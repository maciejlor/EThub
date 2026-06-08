/**
 * Firebase Configuration & Initialization
 *
 * Setup instructions:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (e.g. "EThub")
 * 3. Go to Project Settings → General → Your apps → Add web app
 * 4. Copy the firebaseConfig values into your .env file
 * 5. Go to Build → Firestore Database → Create database (start in test mode)
 * 6. The app will auto-create all needed collections on first use
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';

const sanitizeEnvVar = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

const firebaseConfig = {
  apiKey: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeEnvVar(import.meta.env.VITE_FIREBASE_APP_ID),
};

// Only initialize if we have a project ID
const hasConfig = !!firebaseConfig.projectId;

const app = hasConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

/** Check whether Firestore is available */
export function isFirebaseConfigured(): boolean {
  return hasConfig && db !== null;
}

// ─── Collection Names ───────────────────────────────────────────────
export const COLLECTIONS = {
  users: 'users',
  managedDrivers: 'managed_drivers',
  leftDrivers: 'left_drivers',
  eventInvites: 'event_invites',
  blacklistDrivers: 'blacklist_drivers',
  blacklistVtcs: 'blacklist_vtcs',
  blacklistStaff: 'blacklist_staff',
  history: 'history',
  loaRequests: 'loa_requests',
  downloads: 'downloads',
} as const;

// ─── Generic Firestore CRUD helpers ─────────────────────────────────

/** Get all documents from a collection (returns array) */
export async function getAll<T>(collectionName: string): Promise<T[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
  } catch (err) {
    console.error(`[Firebase] Failed to read ${collectionName}:`, err);
    return [];
  }
}

/** Get all documents, ordered by a field */
export async function getAllOrdered<T>(collectionName: string, field: string, direction: 'asc' | 'desc' = 'desc'): Promise<T[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, collectionName), orderBy(field, direction));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
  } catch (err) {
    console.error(`[Firebase] Failed to read ${collectionName}:`, err);
    return [];
  }
}

/** Get a single document by ID */
export async function getById<T>(collectionName: string, id: string): Promise<T | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as T;
  } catch (err) {
    console.error(`[Firebase] Failed to read ${collectionName}/${id}:`, err);
    return null;
  }
}

/** Create or overwrite a document (uses ID from the data) */
export async function upsert<T extends { id: string }>(collectionName: string, data: T): Promise<boolean> {
  if (!db) return false;
  try {
    const { id, ...rest } = data;
    await setDoc(doc(db, collectionName, id), rest);
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to upsert ${collectionName}/${data.id}:`, err);
    return false;
  }
}

/** Partial update a document */
export async function patch(collectionName: string, id: string, updates: Record<string, unknown>): Promise<boolean> {
  if (!db) return false;
  try {
    await updateDoc(doc(db, collectionName, id), updates);
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to patch ${collectionName}/${id}:`, err);
    return false;
  }
}

/** Delete a document */
export async function remove(collectionName: string, id: string): Promise<boolean> {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to delete ${collectionName}/${id}:`, err);
    return false;
  }
}

/** Batch write multiple documents */
export async function batchUpsert<T extends { id: string }>(collectionName: string, items: T[]): Promise<boolean> {
  if (!db || items.length === 0) return false;
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const { id, ...rest } = item;
      batch.set(doc(db, collectionName, id), rest);
    }
    await batch.commit();
    return true;
  } catch (err) {
    console.error(`[Firebase] Batch upsert failed for ${collectionName}:`, err);
    return false;
  }
}

/** Subscribe to real-time changes on a collection */
export function subscribe(collectionName: string, callback: (docs: Record<string, unknown>[]) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(collection(db, collectionName), (snap) => {
    const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    callback(docs);
  }, (err) => {
    console.error(`[Firebase] Subscription error on ${collectionName}:`, err);
  });
}

export { db, app };
