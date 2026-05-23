/**
 * Multi-Browser Database Synchronization Engine
 * Safe, non-blocking. Runs in the background and never interferes with app state.
 */

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

const ENDPOINT = '/api/db-sync';
const POLL_INTERVAL_MS = 3000;

let applying = false;            // True while we're writing server data into localStorage
let lastServerPayload = '';      // Last seen server JSON string (to skip unchanged polls)
let pushDebounce: number | null = null;

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
    console.log('[Sync] ⬆ Pushed to server');
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
      console.log('[Sync] ⬇ Applied server changes');
      // Fire standard events so React components re-render
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('ethub-users-changed'));
      window.dispatchEvent(new CustomEvent('ethub-managed-drivers-changed'));
      window.dispatchEvent(new CustomEvent('ethub-blacklist-drivers-changed'));
      window.dispatchEvent(new CustomEvent('ethub-loa-changed'));
      window.dispatchEvent(new Event('ethub-downloads-changed'));
    }
  } catch {
    applying = false;
    // Network/parse error — silently ignore
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
    if (!applying && SYNC_KEYS.has(key)) schedulePush();
  };

  // Hook removeItem
  const hookedRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function (key: string) {
    hookedRemoveItem.call(localStorage, key);
    if (!applying && SYNC_KEYS.has(key)) schedulePush();
  };

  // Hook clear — push empty state to server
  const hookedClear = localStorage.clear;
  localStorage.clear = function () {
    hookedClear.call(localStorage);
    if (!applying) schedulePush();
  };

  console.log('[Sync] 🔄 Active — polling every 3s');

  // Initial pull, then poll
  initialSyncPromise = pullFromServer();
  initialSyncPromise.then(() => {
    setInterval(pullFromServer, POLL_INTERVAL_MS);
  });
}
