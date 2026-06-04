/**
 * Multi-Browser Database Synchronization Engine
 * Safe, non-blocking. Supports Firebase Firestore real-time sync with fallback to dev server db.json sync.
 */

import { isFirebaseConfigured, db } from './firebase';
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';

// Exact key names from storage modules — DO NOT include session/auth keys
const SYNC_KEYS = new Set([
  'ethub_users_v1',
  'ethub_seeded_v1',
  'ethub_managed_drivers_v1',
  'ethub_left_drivers_v1',
  'ethub_event_invites_v1',
  'ethub_blacklist_vtcs_v1',
  'ethub_blacklist_staff_v1',
  'ethub_history_v1',
  'ethub_blacklist_drivers_v1',
  'ethub_loa_requests_v1',
  'ethub_downloads_v1',
]);

const KEY_TO_COLLECTION: Record<string, string> = {
  'ethub_users_v1': 'users',
  'ethub_managed_drivers_v1': 'managed_drivers',
  'ethub_left_drivers_v1': 'left_drivers',
  'ethub_event_invites_v1': 'event_invites',
  'ethub_blacklist_drivers_v1': 'blacklist_drivers',
  'ethub_blacklist_vtcs_v1': 'blacklist_vtcs',
  'ethub_blacklist_staff_v1': 'blacklist_staff',
  'ethub_history_v1': 'history',
  'ethub_loa_requests_v1': 'loa_requests',
  'ethub_downloads_v1': 'downloads',
};

const ENDPOINT = '/api/db-sync';
const POLL_INTERVAL_MS = 3000;

let applying = false;            // True while we're writing server data into localStorage
let lastServerPayload = '';      // Last seen server JSON string (to skip unchanged polls)
let pushDebounce: number | null = null;

// Firebase local cache
const firestoreCache: Record<string, any[]> = {};

// Store original localStorage methods as closures BEFORE hooking
// These are safe references that always write directly to storage
let _set: (k: string, v: string) => void;
let _remove: (k: string) => void;

function readLocalDb(): Record<string, string> {
  const out: Record<string, string> = {};
  SYNC_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) out[key] = val;
  });
  return out;
}

function schedulePush() {
  if (pushDebounce !== null) clearTimeout(pushDebounce);
  pushDebounce = window.setTimeout(pushToServer, 200);
}

async function pushToServer() {
  try {
    const body = JSON.stringify(readLocalDb());
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    console.log('[Sync] ⬆ Pushed to local server');
  } catch {
    // Network error — silently ignore, will retry on next change
  }
}

async function pullFromServer() {
  try {
    const res = await fetch(ENDPOINT);
    if (!res.ok) return;

    const raw = await res.text();
    if (raw === lastServerPayload) return; // Nothing changed
    lastServerPayload = raw;

    const serverDb = JSON.parse(raw) as Record<string, string>;
    if (Object.keys(serverDb).length === 0) {
      // Server is empty — push our local data to seed it
      await pushToServer();
      return;
    }

    let changed = false;
    applying = true;

    SYNC_KEYS.forEach((key) => {
      const serverVal = serverDb[key];
      if (serverVal === undefined) return; // Server doesn't have this key — keep local
      const localVal = localStorage.getItem(key);
      if (serverVal !== localVal) {
        _set(key, serverVal);            // Write using original method (no hook re-trigger)
        changed = true;
      }
    });

    applying = false;

    if (changed) {
      console.log('[Sync] ⬇ Applied local server changes');
      dispatchChangedEvents(null); // Dispatch all events
    }
  } catch {
    applying = false;
    // Network/parse error — silently ignore
  }
}

function sortByTimestamp(a: any, b: any) {
  const tA = a.addedAt || a.createdAt || a.submittedAt || a.performedAt || '';
  const tB = b.addedAt || b.createdAt || b.submittedAt || b.performedAt || '';
  return tB.localeCompare(tA);
}

function isEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    const val1 = obj1[key];
    const val2 = obj2[key];
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      if (!isEqual(val1, val2)) return false;
    } else if (val1 !== val2) {
      return false;
    }
  }
  return true;
}

async function uploadItemsToFirestore(colName: string, items: any[]) {
  if (!db) return;
  try {
    const batches = [];
    let currentBatch = writeBatch(db);
    let count = 0;
    
    for (const item of items) {
      const { id, ...data } = item;
      if (!id) continue;
      const docRef = doc(db, colName, id);
      currentBatch.set(docRef, data);
      count++;
      
      if (count === 500) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) {
      batches.push(currentBatch);
    }
    
    await Promise.all(batches.map(b => b.commit()));
    console.log(`[Sync] Seeded ${items.length} items to ${colName}`);
  } catch (err) {
    console.error(`[Sync] Failed to seed ${colName}:`, err);
  }
}

async function syncLocalChangeToFirestore(key: string, localJson: string) {
  const colName = KEY_TO_COLLECTION[key];
  if (!colName || !db) return;
  
  try {
    const localItems = JSON.parse(localJson || '[]') as any[];
    const cachedItems = firestoreCache[key] || [];
    
    // INSTANT CACHE UPDATE: Pretend server already has this data
    // This prevents onSnapshot from reverting the local change while the push is in flight
    firestoreCache[key] = localItems;

    const cachedMap = new Map<string, any>(cachedItems.map(item => [item.id, item]));
    const localMap = new Map<string, any>(localItems.map(item => [item.id, item]));
    
    const toUpsert: any[] = [];
    const toDelete: string[] = [];
    
    for (const item of localItems) {
      if (!item.id) continue;
      const cached = cachedMap.get(item.id);
      if (!cached || !isEqual(item, cached)) {
        toUpsert.push(item);
      }
    }
    
    for (const cached of cachedItems) {
      if (!cached.id) continue;
      if (!localMap.has(cached.id)) {
        toDelete.push(cached.id);
      }
    }
    
    if (toUpsert.length === 0 && toDelete.length === 0) return;
    
    console.log(`[Sync] Syncing local changes to ${colName}: ${toUpsert.length} upserts, ${toDelete.length} deletes`);
    
    const batch = writeBatch(db);
    for (const item of toUpsert) {
      const { id, ...data } = item;
      batch.set(doc(db, colName, id), data);
    }
    for (const id of toDelete) {
      batch.delete(doc(db, colName, id));
    }
    await batch.commit();
  } catch (err: any) {
    console.error(`[Sync] Error syncing local change for ${key} to Firestore:`, err);
    if (err.code === 'permission-denied') {
      console.error('[Sync] 🚨 DATABASE PERMISSION DENIED! Please ensure your Firebase Rules allow writes.');
    }
  }
}

function dispatchChangedEvents(key: string | null) {
  window.dispatchEvent(new Event('storage'));
  
  const triggerEvent = (k: string) => {
    if (k === 'ethub_users_v1') {
      window.dispatchEvent(new Event('ethub-users-changed'));
    } else if (k === 'ethub_managed_drivers_v1') {
      window.dispatchEvent(new CustomEvent('ethub-managed-drivers-changed'));
    } else if (k === 'ethub_left_drivers_v1') {
      window.dispatchEvent(new CustomEvent('ethub-left-drivers-changed'));
    } else if (k === 'ethub_event_invites_v1') {
      window.dispatchEvent(new CustomEvent('ethub-event-invites-changed'));
    } else if (k === 'ethub_blacklist_drivers_v1') {
      window.dispatchEvent(new CustomEvent('ethub-blacklist-drivers-changed'));
    } else if (k === 'ethub_blacklist_vtcs_v1') {
      window.dispatchEvent(new CustomEvent('ethub-blacklist-vtcs-changed'));
    } else if (k === 'ethub_blacklist_staff_v1') {
      window.dispatchEvent(new CustomEvent('ethub-blacklist-staff-changed'));
    } else if (k === 'ethub_history_v1') {
      window.dispatchEvent(new Event('ethub-history-changed'));
    } else if (k === 'ethub_loa_requests_v1') {
      window.dispatchEvent(new CustomEvent('ethub-loa-changed'));
    } else if (k === 'ethub_downloads_v1') {
      window.dispatchEvent(new Event('ethub-downloads-changed'));
    }
  };

  if (key) {
    triggerEvent(key);
  } else {
    Object.keys(KEY_TO_COLLECTION).forEach(triggerEvent);
  }
}

export let initialSyncPromise: Promise<void> = Promise.resolve();

export function startSync() {
  if (typeof window === 'undefined') return;

  // Capture original methods before any hook
  _set = localStorage.setItem.bind(localStorage);
  _remove = localStorage.removeItem.bind(localStorage);

  // Hook setItem — push to server whenever a sync key changes
  const hookedSetItem = localStorage.setItem;
  localStorage.setItem = function (key: string, value: string) {
    hookedSetItem.call(localStorage, key, value);
    if (!applying && SYNC_KEYS.has(key)) {
      if (isFirebaseConfigured()) {
        syncLocalChangeToFirestore(key, value);
      } else {
        schedulePush();
      }
    }
  };

  // Hook removeItem
  const hookedRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function (key: string) {
    hookedRemoveItem.call(localStorage, key);
    if (!applying && SYNC_KEYS.has(key)) {
      if (isFirebaseConfigured()) {
        syncLocalChangeToFirestore(key, '[]');
      } else {
        schedulePush();
      }
    }
  };

  // Hook clear
  const hookedClear = localStorage.clear;
  localStorage.clear = function () {
    hookedClear.call(localStorage);
    if (!applying) {
      if (isFirebaseConfigured()) {
        Object.keys(KEY_TO_COLLECTION).forEach(key => {
          syncLocalChangeToFirestore(key, '[]');
        });
      } else {
        schedulePush();
      }
    }
  };

  if (!isFirebaseConfigured()) {
    console.log('[Sync] 🔄 Local API Sync Active — polling every 3s');
    initialSyncPromise = pullFromServer();
    initialSyncPromise.then(() => {
      setInterval(pullFromServer, POLL_INTERVAL_MS);
    });
    return;
  }

  console.log('[Sync] 🔥 Firebase Firestore Sync Active — Real-time Mode');

  const promises = Object.entries(KEY_TO_COLLECTION).map(([key, colName]) => {
    return new Promise<void>((resolve) => {
      let isFirst = true;
      const colRef = collection(db!, colName);
      onSnapshot(colRef, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort(sortByTimestamp);
        
        // Save to cache
        firestoreCache[key] = items;
        
        const jsonVal = JSON.stringify(items);
        const localVal = localStorage.getItem(key);
        
        // Seed if Firebase is empty but we have local data
        if (snapshot.empty && localVal) {
          try {
            const localItems = JSON.parse(localVal);
            if (Array.isArray(localItems) && localItems.length > 0) {
              console.log(`[Sync] Firestore collection ${colName} is empty. Seeding with local storage data...`);
              uploadItemsToFirestore(colName, localItems);
              if (isFirst) {
                isFirst = false;
                resolve();
              }
              return;
            }
          } catch (err) {
            console.error(`[Sync] Error parsing local storage for seeding ${key}:`, err);
          }
        }
        
        if (jsonVal !== localVal) {
          applying = true;
          _set(key, jsonVal);
          applying = false;
          dispatchChangedEvents(key);
        }
        
        if (isFirst) {
          isFirst = false;
          resolve();
        }
      }, (err) => {
        console.error(`[Sync] Firestore subscription error for ${colName}:`, err);
        if (isFirst) {
          isFirst = false;
          resolve();
        }
      });
    });
  });
  
  initialSyncPromise = Promise.all(promises).then(() => {
    console.log('[Sync] Firebase initial sync complete');
  });
}
