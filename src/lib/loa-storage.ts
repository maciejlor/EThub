export type LoaStatus = 'pending' | 'approved' | 'rejected';

export interface LoaRequest {
  id: string;
  submittedAt: string;
  requesterName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LoaStatus;
  reviewedAt?: string;
}

const STORAGE_KEY = 'ethub_loa_requests_v1';

function safeParse(raw: string | null): LoaRequest[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isLoaRequest);
  } catch {
    return [];
  }
}

function isLoaRequest(x: unknown): x is LoaRequest {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.submittedAt === 'string' &&
    typeof o.requesterName === 'string' &&
    typeof o.startDate === 'string' &&
    typeof o.endDate === 'string' &&
    typeof o.reason === 'string' &&
    (o.status === 'pending' || o.status === 'approved' || o.status === 'rejected')
  );
}

export function getLoaRequests(): LoaRequest[] {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function persist(list: LoaRequest[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addLoaRequest(entry: Omit<LoaRequest, 'id' | 'submittedAt' | 'status' | 'reviewedAt'>): LoaRequest {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `loa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const row: LoaRequest = {
    ...entry,
    id,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };
  const list = getLoaRequests();
  list.unshift(row);
  persist(list);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ethub-loa-changed'));
  }
  return row;
}

export function setLoaRequestStatus(id: string, status: 'approved' | 'rejected'): LoaRequest | null {
  const list = getLoaRequests();
  const i = list.findIndex((r) => r.id === id);
  if (i === -1) return null;
  list[i] = {
    ...list[i],
    status,
    reviewedAt: new Date().toISOString(),
  };
  persist(list);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ethub-loa-changed'));
  }
  return list[i];
}

export function subscribeLoaChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-loa-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-loa-changed', handler);
    window.removeEventListener('storage', handler);
  };
}
