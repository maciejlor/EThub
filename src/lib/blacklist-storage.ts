export interface BlacklistDriverEntry {
  id: string;
  addedAt: string;
  username: string;
  discordId: string;
  truckersmpUserId: string;
  steamId: string;
  reasons: string;
}

const STORAGE_KEY = 'ethub_blacklist_drivers_v1';

function safeParse(raw: string | null): BlacklistDriverEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isBlacklistEntry);
  } catch {
    return [];
  }
}

function isBlacklistEntry(x: unknown): x is BlacklistDriverEntry {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.addedAt === 'string' &&
    typeof o.username === 'string' &&
    typeof o.discordId === 'string' &&
    typeof o.truckersmpUserId === 'string' &&
    typeof o.steamId === 'string' &&
    typeof o.reasons === 'string'
  );
}

export function getBlacklistDriverEntries(): BlacklistDriverEntry[] {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function persist(list: BlacklistDriverEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addBlacklistDriverEntry(
  entry: Omit<BlacklistDriverEntry, 'id' | 'addedAt'>
): BlacklistDriverEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `blk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const row: BlacklistDriverEntry = {
    ...entry,
    id,
    addedAt: new Date().toISOString(),
  };
  const list = getBlacklistDriverEntries();
  list.unshift(row);
  persist(list);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ethub-blacklist-drivers-changed'));
  }
  return row;
}

export function removeBlacklistDriverEntry(id: string): boolean {
  const list = getBlacklistDriverEntries();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  persist(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ethub-blacklist-drivers-changed'));
  }
  return true;
}

export function subscribeBlacklistDriverChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-blacklist-drivers-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-blacklist-drivers-changed', handler);
    window.removeEventListener('storage', handler);
  };
}
