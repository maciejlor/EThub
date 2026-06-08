export interface ManagedDriverEntry {
  id: string;
  addedAt: string;
  loggedBy: string;
  username: string;
  discordUserId: string;
  steamId: string;
  /** Resolved 76561198… when Steam API / parsing succeeded */
  steamId64: string | null;
  truckersmpUserId: string;
  /** Seconds since epoch from Steam, if lookup succeeded */
  ets2LastPlayedUnix: number | null;
  /** ISO timestamp of last Steam ETS2 fetch attempt */
  ets2FetchedAt: string | null;
  /** Human hint when ETS2 time unavailable */
  ets2Note: string | null;
}

export interface LeftDriverEntry {
  id: string;
  driverName: string;
  reasonForLeaving: string;
  leftDate: string;
  loggedBy: string;
  addedAt: string;
}

export interface EventInviteEntry {
  id: string;
  convoyName: string;
  vtcName: string;
  status: 'pending' | 'accepted' | 'declined' | 'maybe';
  inviteDate: string;
  addedAt: string;
  addedBy: string;
}

export interface BlacklistVtcEntry {
  id: string;
  vtcName: string;
  reason: string;
  tmpVtcLink: string;
  discordVtcLink: string;
  addedAt: string;
  addedBy: string;
}

export interface BlacklistStaffEntry {
  id: string;
  staffName: string;
  tmpProfileLink: string;
  discordId: string;
  reason: string;
  addedAt: string;
  addedBy: string;
}

export interface HistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'added' | 'removed' | 'changed' | 'accepted' | 'declined' | 'pending' | 'maybe';
  entityType: 'driver' | 'event_invite' | 'blacklist_driver' | 'blacklist_vtc' | 'blacklist_staff' | 'user' | 'role';
  entityName: string;
  entityId: string;
  description: string;
  changes?: Record<string, { old: string | number; new: string | number }>;
  performedBy: string;
  performedAt: string;
  department?: 'HR' | 'Event' | 'Admin' | 'System';
}

export interface UserEntry {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  // Stored for future authentication (currently login flow uses user selection).
  password?: string;
  role:
    | 'Admin'
    | 'Overseer'
    | 'HR Staff'
    | 'Event Staff'
    | 'Senior Staff'
    | 'Driver'
    | 'HR Team'
    | 'Event Assistant'
    | 'HR Manager'
    | 'Event Manager';
  department: 'HR' | 'Event' | 'Admin' | 'None';
  isActive: boolean;
  isPending?: boolean;
  lastLogin?: string;
  createdAt: string;
  createdBy: string;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  steamId?: string;
  steamAvatar?: string;
  steamUsername?: string;
  profileNumber?: number;
  rankColor?: string;
  coverImage?: string;
  rankTitle?: string;
  rankLevel?: number;
  truckyId?: string;
}

const STORAGE_KEY = 'ethub_managed_drivers_v1';

function safeParse(raw: string | null): ManagedDriverEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.map(parseStoredEntry).filter((e): e is ManagedDriverEntry => e !== null);
  } catch {
    return [];
  }
}

function parseStoredEntry(x: unknown): ManagedDriverEntry | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== 'string' ||
    typeof o.addedAt !== 'string' ||
    typeof o.loggedBy !== 'string' ||
    typeof o.username !== 'string' ||
    typeof o.steamId !== 'string' ||
    typeof o.truckersmpUserId !== 'string'
  )
    return null;

  const sid64 = o.steamId64;
  const etsUnix = o.ets2LastPlayedUnix;
  return {
    id: o.id,
    addedAt: o.addedAt,
    loggedBy: o.loggedBy,
    username: o.username,
    discordUserId: typeof o.discordUserId === 'string' ? o.discordUserId : '',
    steamId: o.steamId,
    truckersmpUserId: o.truckersmpUserId,
    steamId64: sid64 === undefined || sid64 === null ? null : typeof sid64 === 'string' ? sid64 : null,
    ets2LastPlayedUnix: typeof etsUnix === 'number' && Number.isFinite(etsUnix) ? etsUnix : null,
    ets2FetchedAt: typeof o.ets2FetchedAt === 'string' ? o.ets2FetchedAt : null,
    ets2Note: typeof o.ets2Note === 'string' ? o.ets2Note : null,
  };
}

export function getManagedDrivers(): ManagedDriverEntry[] {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function persist(list: ManagedDriverEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function coerceRow(o: Omit<ManagedDriverEntry, 'id' | 'addedAt'>): Omit<ManagedDriverEntry, 'id' | 'addedAt'> {
  return {
    ...o,
    steamId64: o.steamId64 ?? null,
    ets2LastPlayedUnix: o.ets2LastPlayedUnix ?? null,
    ets2FetchedAt: o.ets2FetchedAt ?? null,
    ets2Note: o.ets2Note ?? null,
  };
}

export function addManagedDriver(
  row: Omit<ManagedDriverEntry, 'id' | 'addedAt'>
): ManagedDriverEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `drv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: ManagedDriverEntry = {
    ...coerceRow(row),
    id,
    addedAt: new Date().toISOString(),
  };
  const list = getManagedDrivers();
  list.unshift(entry);
  persist(list);
  dispatchChanged();
  
  // Add history entry
  addHistoryEntry({
    action: 'created',
    entityType: 'driver',
    entityName: entry.username,
    entityId: id,
    description: `Added driver ${entry.username} to managed drivers`,
    performedBy: entry.loggedBy,
    department: 'HR',
  });
  
  return entry;
}

export function updateManagedDriver(id: string, patch: Partial<ManagedDriverEntry>): ManagedDriverEntry | null {
  const list = getManagedDrivers();
  const i = list.findIndex((r) => r.id === id);
  if (i === -1) return null;
  list[i] = { ...list[i], ...patch };
  persist(list);
  dispatchChanged();
  return list[i];
}

export function removeManagedDriver(id: string): boolean {
  const list = getManagedDrivers();
  const driverToRemove = list.find((r) => r.id === id);
  if (!driverToRemove) return false;
  
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  persist(next);
  dispatchChanged();
  
  // Add history entry
  addHistoryEntry({
    action: 'deleted',
    entityType: 'driver',
    entityName: driverToRemove.username,
    entityId: id,
    description: `Removed driver ${driverToRemove.username} from managed drivers`,
    performedBy: getActorName(),
    department: 'HR',
  });
  
  return true;
}

function dispatchChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ethub-managed-drivers-changed'));
}

export function subscribeManagedDriverChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-managed-drivers-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-managed-drivers-changed', handler);
    window.removeEventListener('storage', handler);
  };
}

// Left Drivers Storage
const LEFT_DRIVERS_STORAGE_KEY = 'ethub_left_drivers_v1';

function safeParseLeftDrivers(raw: string | null): LeftDriverEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((e): e is LeftDriverEntry => {
      const o = e as Record<string, unknown>;
      return (
        typeof o.id === 'string' &&
        typeof o.driverName === 'string' &&
        typeof o.reasonForLeaving === 'string' &&
        typeof o.leftDate === 'string' &&
        typeof o.loggedBy === 'string' &&
        typeof o.addedAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

function persistLeftDrivers(list: LeftDriverEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEFT_DRIVERS_STORAGE_KEY, JSON.stringify(list));
}

export function getLeftDrivers(): LeftDriverEntry[] {
  if (typeof window === 'undefined') return [];
  return safeParseLeftDrivers(localStorage.getItem(LEFT_DRIVERS_STORAGE_KEY));
}

export function addLeftDriver(
  row: Omit<LeftDriverEntry, 'id' | 'addedAt'>
): LeftDriverEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `left-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: LeftDriverEntry = {
    ...row,
    id,
    addedAt: new Date().toISOString(),
  };
  const list = getLeftDrivers();
  list.unshift(entry);
  persistLeftDrivers(list);
  dispatchLeftDriversChanged();
  return entry;
}

export function removeLeftDriver(id: string): boolean {
  const list = getLeftDrivers();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  persistLeftDrivers(next);
  dispatchLeftDriversChanged();
  return true;
}

function dispatchLeftDriversChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ethub-left-drivers-changed'));
}

export function subscribeLeftDriverChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-left-drivers-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-left-drivers-changed', handler);
    window.removeEventListener('storage', handler);
  };
}

// Event Invites Storage
const EVENT_INVITES_STORAGE_KEY = 'ethub_event_invites_v1';

function safeParseEventInvites(raw: string | null): EventInviteEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((e): e is EventInviteEntry => {
      const o = e as Record<string, unknown>;
      return (
        typeof o.id === 'string' &&
        typeof o.convoyName === 'string' &&
        typeof o.vtcName === 'string' &&
        (o.status === 'pending' || o.status === 'accepted' || o.status === 'declined' || o.status === 'maybe') &&
        typeof o.inviteDate === 'string' &&
        typeof o.addedAt === 'string' &&
        typeof o.addedBy === 'string'
      );
    });
  } catch {
    return [];
  }
}

function persistEventInvites(list: EventInviteEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EVENT_INVITES_STORAGE_KEY, JSON.stringify(list));
}

export function getEventInvites(): EventInviteEntry[] {
  if (typeof window === 'undefined') return [];
  return safeParseEventInvites(localStorage.getItem(EVENT_INVITES_STORAGE_KEY));
}

export function addEventInvite(
  row: Omit<EventInviteEntry, 'id' | 'addedAt'>
): EventInviteEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `invite-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: EventInviteEntry = {
    ...row,
    id,
    addedAt: new Date().toISOString(),
  };
  const list = getEventInvites();
  list.unshift(entry);
  persistEventInvites(list);
  dispatchEventInvitesChanged();
  
  // Add history entry
  addHistoryEntry({
    action: 'created',
    entityType: 'event_invite',
    entityName: `${entry.convoyName} - ${entry.vtcName}`,
    entityId: id,
    description: `Created event invite for ${entry.vtcName} (${entry.convoyName}) with status ${entry.status}`,
    performedBy: entry.addedBy,
    department: 'Event',
  });
  
  return entry;
}

export function updateEventInviteStatus(id: string, status: EventInviteEntry['status']): boolean {
  const list = getEventInvites();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return false;
  
  const oldStatus = list[index].status;
  list[index].status = status;
  persistEventInvites(list);
  dispatchEventInvitesChanged();
  
  // Add history entry
  addHistoryEntry({
    action: status,
    entityType: 'event_invite',
    entityName: `${list[index].convoyName} - ${list[index].vtcName}`,
    entityId: id,
    description: `Updated event invite status from ${oldStatus} to ${status} for ${list[index].vtcName}`,
    performedBy: getActorName(),
    department: 'Event',
    changes: {
      status: { old: oldStatus, new: status }
    }
  });
  
  return true;
}

export function removeEventInvite(id: string): boolean {
  const list = getEventInvites();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  persistEventInvites(next);
  dispatchEventInvitesChanged();
  return true;
}

function dispatchEventInvitesChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ethub-event-invites-changed'));
}

export function subscribeEventInviteChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-event-invites-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-event-invites-changed', handler);
    window.removeEventListener('storage', handler);
  };
}

// Blacklist VTCs Storage
const BLACKLIST_VTCS_STORAGE_KEY = 'ethub_blacklist_vtcs_v1';

function safeParseBlacklistVtcs(raw: string | null): BlacklistVtcEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((e): e is BlacklistVtcEntry => {
      const o = e as Record<string, unknown>;
      return (
        typeof o.id === 'string' &&
        typeof o.vtcName === 'string' &&
        typeof o.reason === 'string' &&
        typeof o.tmpVtcLink === 'string' &&
        typeof o.discordVtcLink === 'string' &&
        typeof o.addedAt === 'string' &&
        typeof o.addedBy === 'string'
      );
    });
  } catch {
    return [];
  }
}

function persistBlacklistVtcs(list: BlacklistVtcEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BLACKLIST_VTCS_STORAGE_KEY, JSON.stringify(list));
}

export function getBlacklistVtcs(): BlacklistVtcEntry[] {
  if (typeof window === 'undefined') return [];
  return safeParseBlacklistVtcs(localStorage.getItem(BLACKLIST_VTCS_STORAGE_KEY));
}

export function addBlacklistVtc(
  row: Omit<BlacklistVtcEntry, 'id' | 'addedAt'>
): BlacklistVtcEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `bvtc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: BlacklistVtcEntry = {
    ...row,
    id,
    addedAt: new Date().toISOString(),
  };
  const list = getBlacklistVtcs();
  list.unshift(entry);
  persistBlacklistVtcs(list);
  dispatchBlacklistVtcsChanged();
  return entry;
}

export function removeBlacklistVtc(id: string): boolean {
  const list = getBlacklistVtcs();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  persistBlacklistVtcs(next);
  dispatchBlacklistVtcsChanged();
  return true;
}

function dispatchBlacklistVtcsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ethub-blacklist-vtcs-changed'));
}

export function subscribeBlacklistVtcChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-blacklist-vtcs-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-blacklist-vtcs-changed', handler);
    window.removeEventListener('storage', handler);
  };
}

// Blacklist Staff Storage
const BLACKLIST_STAFF_STORAGE_KEY = 'ethub_blacklist_staff_v1';

function safeParseBlacklistStaff(raw: string | null): BlacklistStaffEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((e): e is BlacklistStaffEntry => {
      const o = e as Record<string, unknown>;
      return (
        typeof o.id === 'string' &&
        typeof o.staffName === 'string' &&
        typeof o.tmpProfileLink === 'string' &&
        typeof o.discordId === 'string' &&
        typeof o.reason === 'string' &&
        typeof o.addedAt === 'string' &&
        typeof o.addedBy === 'string'
      );
    });
  } catch {
    return [];
  }
}

function persistBlacklistStaff(list: BlacklistStaffEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BLACKLIST_STAFF_STORAGE_KEY, JSON.stringify(list));
}

export function getBlacklistStaff(): BlacklistStaffEntry[] {
  if (typeof window === 'undefined') return [];
  return safeParseBlacklistStaff(localStorage.getItem(BLACKLIST_STAFF_STORAGE_KEY));
}

export function addBlacklistStaff(
  row: Omit<BlacklistStaffEntry, 'id' | 'addedAt'>
): BlacklistStaffEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `bstaff-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: BlacklistStaffEntry = {
    ...row,
    id,
    addedAt: new Date().toISOString(),
  };
  const list = getBlacklistStaff();
  list.unshift(entry);
  persistBlacklistStaff(list);
  dispatchBlacklistStaffChanged();
  return entry;
}

export function removeBlacklistStaff(id: string): boolean {
  const list = getBlacklistStaff();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  persistBlacklistStaff(next);
  dispatchBlacklistStaffChanged();
  return true;
}

function dispatchBlacklistStaffChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ethub-blacklist-staff-changed'));
}

export function subscribeBlacklistStaffChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-blacklist-staff-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-blacklist-staff-changed', handler);
    window.removeEventListener('storage', handler);
  };
}

// History Storage
const HISTORY_STORAGE_KEY = 'ethub_history_v1';

/** Returns the display name of the currently logged-in user for audit log entries. */
function getActorName(): string {
  try {
    const raw = localStorage.getItem('ethub_current_user');
    if (raw) {
      const parsed = JSON.parse(raw) as { displayName?: string };
      if (parsed.displayName) return parsed.displayName;
    }
    // Fallback: look up by local storage user id
    const userId = localStorage.getItem('ethub_current_user_id');
    if (userId) {
      const users = safeParseUsers(localStorage.getItem(USERS_STORAGE_KEY));
      const found = users.find(u => u.id === userId);
      if (found?.displayName) return found.displayName;
    }
  } catch {
    // ignore
  }
  return 'System';
}

function safeParseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((e): e is HistoryEntry => {
      const o = e as Record<string, unknown>;
      return (
        typeof o.id === 'string' &&
        typeof o.action === 'string' &&
        typeof o.entityType === 'string' &&
        typeof o.entityName === 'string' &&
        typeof o.entityId === 'string' &&
        typeof o.description === 'string' &&
        typeof o.performedBy === 'string' &&
        typeof o.performedAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

function persistHistory(list: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
}

function dispatchHistoryChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('ethub-history-changed'));
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  return safeParseHistory(localStorage.getItem(HISTORY_STORAGE_KEY));
}

function sendHistoryToDiscord(entry: HistoryEntry) {
  if (typeof window === 'undefined') return;

  const webhookUrl = '/discord-api/webhooks/1507523270147178611/7SIUnJgs6nd_jqgol_wIfWDxWxH5bK4_ytfXOeZ6WDIvyyN3nsZaffnhpYljgTWFiA3_';
  
  // Choose color based on action
  let color = 3447003; // Light Blue
  if (entry.action === 'created' || entry.action === 'accepted' || entry.action === 'added') color = 3066993; // Green
  if (entry.action === 'deleted' || entry.action === 'removed' || entry.action === 'declined') color = 15158332; // Red
  if (entry.action === 'updated' || entry.action === 'changed') color = 15105570; // Orange

  // Format fields
  const fields = [
    { name: '👤 Performed By', value: entry.performedBy || 'System', inline: true },
    { name: '📁 Category', value: String(entry.entityType).toUpperCase().replace('_', ' '), inline: true },
    { name: '🏢 Department', value: entry.department || 'General', inline: true }
  ];

  if (entry.changes) {
    const changeLines: string[] = [];
    for (const [key, val] of Object.entries(entry.changes)) {
      const oldVal = val && typeof val === 'object' && 'old' in val ? String(val.old) : 'None';
      const newVal = val && typeof val === 'object' && 'new' in val ? String(val.new) : 'None';
      changeLines.push(`• **${key}**: \`${oldVal}\` ➔ \`${newVal}\``);
    }
    if (changeLines.length > 0) {
      fields.push({
        name: '⚙️ Changed Values',
        value: changeLines.join('\n').substring(0, 1024),
        inline: false
      });
    }
  }

  // Build a components-only (v2) webhook payload using link buttons only.
  // Compose richer markdown content so the message includes structured fields
  // since we are not sending an embed.
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  const viewUrl = origin ? `${origin}/downloads?history=${entry.id}` : undefined;
  const historyUrl = origin ? `${origin}/admin/history` : undefined;

  const performedBy = entry.performedBy || 'System';
  const dept = entry.department || 'General';
  const when = entry.performedAt ? new Date(entry.performedAt).toLocaleString() : new Date().toLocaleString();
  const category = String(entry.entityType).toUpperCase().replace('_', ' ');

  // Build a markdown-like content body (Discord supports basic markdown)
  const contentLines: string[] = [];
  contentLines.push(`**Audit:** ${entry.description}`);
  contentLines.push(`**Action:** ${entry.action} | **Type:** ${category}`);
  contentLines.push(`**By:** ${performedBy} | **Dept:** ${dept}`);
  contentLines.push(`**When:** ${when}`);
  const content = contentLines.join('\n');

  const body: Record<string, unknown> = {
    content,
  };
  // Recreate an embed so clients that render embeds still get rich cards,
  // while also attaching v2 components (link buttons).
  const embed = {
    title: `📁 Audit Log: ${entry.description}`,
    description: `An administrative action has been logged in EThub.`,
    color,
    fields,
    timestamp: entry.performedAt || new Date().toISOString(),
    footer: { text: `EThub Auditing System • ID: ${entry.id}` }
  };

  const components: any[] = [];
  const actionRow: any = { type: 1, components: [] };
  if (viewUrl) actionRow.components.push({ type: 2, style: 5, label: 'Open in EThub', url: viewUrl });
  if (historyUrl) actionRow.components.push({ type: 2, style: 5, label: 'View History', url: historyUrl });
  if (actionRow.components.length > 0) components.push(actionRow);

  // Attach both embed and components for maximum compatibility and v2 support
  body.embeds = [embed];
  if (components.length > 0) body.components = components;

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(err => console.error('Failed to dispatch discord audit log:', err));
}

export function addHistoryEntry(
  entry: Omit<HistoryEntry, 'id' | 'performedAt'>
): HistoryEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `hist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const historyEntry: HistoryEntry = {
    ...entry,
    id,
    performedAt: new Date().toISOString(),
  };
  const list = getHistory();
  list.unshift(historyEntry);
  persistHistory(list);
  dispatchHistoryChanged();

  // Send to Discord webhook asynchronously
  sendHistoryToDiscord(historyEntry);

  return historyEntry;
}

export function subscribeHistoryChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-history-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-history-changed', handler);
    window.removeEventListener('storage', handler);
  };
}

// User Management Storage
const USERS_STORAGE_KEY = 'ethub_users_v1';

function safeParseUsers(raw: string | null): UserEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((e): e is UserEntry => {
      const o = e as Record<string, unknown>;
      return (
        typeof o.id === 'string' &&
        typeof o.username === 'string' &&
        typeof o.email === 'string' &&
        typeof o.displayName === 'string' &&
        typeof o.role === 'string' &&
        typeof o.department === 'string' &&
        typeof o.isActive === 'boolean' &&
        typeof o.createdAt === 'string' &&
        typeof o.createdBy === 'string'
      );
    });
  } catch {
    return [];
  }
}

function persistUsers(list: UserEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(list));
}

function dispatchUsersChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('ethub-users-changed'));
}

const SEEDED_FLAG_KEY = 'ethub_seeded_v1';

export function getUsers(): UserEntry[] {
  if (typeof window === 'undefined') return [];

  // Seed default accounts exactly once per browser origin.
  // Uses a separate flag so real data (incl. pending join requests) is never overwritten.
  if (!localStorage.getItem(SEEDED_FLAG_KEY)) {
    localStorage.setItem(SEEDED_FLAG_KEY, '1');
    const existing = safeParseUsers(localStorage.getItem(USERS_STORAGE_KEY));
    if (existing.length === 0) {
      const defaultUsers: UserEntry[] = [
        {
          id: 'user-admin',
          profileNumber: 1,
          username: '',
          email: '',
          displayName: '',
          role: 'Admin',
          department: 'Admin',
          isActive: true,
          createdBy: 'System',
          createdAt: new Date().toISOString(),
          discordId: '877223306468687972',
          discordUsername: '',
          steamId: '',
          rankLevel: 5,
          rankTitle: 'Elite Driver',
          rankColor: '#f97316',
        },
      ];
      persistUsers(defaultUsers);
      return defaultUsers;
    }
  }

  let users = safeParseUsers(localStorage.getItem(USERS_STORAGE_KEY));
  let changed = false;

  users = users.map((u) => {
    // If the seeded admin was saved with the old ID, update it
    if (u.id === 'user-admin' && u.discordId !== '877223306468687972') {
      changed = true;
      return { ...u, discordId: '877223306468687972' };
    }
    // Ensure any user entry matching the user's Discord ID is active Admin
    if (
      u.discordId === '877223306468687972' &&
      (u.role !== 'Admin' || u.department !== 'Admin' || !u.isActive || u.isPending)
    ) {
      changed = true;
      return {
        ...u,
        role: 'Admin',
        department: 'Admin',
        isActive: true,
        isPending: false,
      };
    }
    return u;
  });

  if (changed) {
    persistUsers(users);
  }

  return users;
}

/**
 * Clear all users from localStorage and reset seeding
 * This will remove all template accounts and allow re-seeding with only admin
 */
export function clearAllUsers(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USERS_STORAGE_KEY);
  localStorage.removeItem(SEEDED_FLAG_KEY);
  localStorage.removeItem('ethub_current_user');
  localStorage.removeItem('ethub_current_user_id');
  localStorage.removeItem('ethub_authenticated');
  localStorage.removeItem('ethub_discord_user');
  localStorage.removeItem('ethub_discord_access_token');
  localStorage.removeItem('ethub_auth_method');
  localStorage.removeItem('ethub_login_time');
}


function getNextProfileNumber(users: UserEntry[]): number {
  const maxNumber = users.reduce((max, u) => Math.max(max, u.profileNumber ?? 0), 0);
  return maxNumber + 1;
}

export function addUser(
  user: Omit<UserEntry, 'id' | 'createdAt'>
): UserEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const existingUsers = getUsers();
  const userEntry: UserEntry = {
    ...user,
    id,
    profileNumber: user.profileNumber ?? getNextProfileNumber(existingUsers),
    createdAt: new Date().toISOString(),
  };
  const list = getUsers();
  list.unshift(userEntry);
  persistUsers(list);
  dispatchUsersChanged();
  
  // Add history entry
  addHistoryEntry({
    action: 'created',
    entityType: 'user',
    entityName: user.displayName,
    entityId: id,
    description: `Created user account for ${user.displayName} with role ${user.role}`,
    performedBy: user.createdBy,
    department: 'Admin',
  });
  
  return userEntry;
}

export function updateUser(id: string, updates: Partial<Omit<UserEntry, 'id' | 'createdAt' | 'createdBy'>>): boolean {
  const list = getUsers();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return false;
  
  const oldUser = list[index];
  const updatedUser = { ...oldUser, ...updates };
  list[index] = updatedUser;
  persistUsers(list);
  dispatchUsersChanged();
  
  // Add history entry
  const changes: Record<string, { old: string | number; new: string | number }> = {};
  Object.keys(updates).forEach(key => {
    if (key in oldUser && key in updatedUser) {
      const oldValue = oldUser[key as keyof UserEntry];
      const newValue = updatedUser[key as keyof UserEntry];
      if (oldValue !== newValue) {
        changes[key] = { old: String(oldValue), new: String(newValue) };
      }
    }
  });
  
  if (Object.keys(changes).length > 0) {
    addHistoryEntry({
      action: 'updated',
      entityType: 'user',
      entityName: updatedUser.displayName,
      entityId: id,
      description: `Updated user ${updatedUser.displayName}`,
      changes,
      performedBy: getActorName(),
      department: 'Admin',
    });
  }
  
  return true;
}

export function removeUser(id: string): boolean {
  const list = getUsers();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return false;
  
  const removedUser = list[index];
  list.splice(index, 1);
  persistUsers(list);
  dispatchUsersChanged();
  
  // Add history entry
  addHistoryEntry({
    action: 'deleted',
    entityType: 'user',
    entityName: removedUser.displayName,
    entityId: id,
    description: `Deleted user account for ${removedUser.displayName}`,
    performedBy: getActorName(),
    department: 'Admin',
  });
  
  return true;
}

export function subscribeUsersChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-users-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-users-changed', handler);
    window.removeEventListener('storage', handler);
  };
}

// Current user session management
export function getCurrentUser(): UserEntry | null {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem('ethub_current_user_id');
  if (!userId) return null;
  const users = getUsers();
  return users.find(u => u.id === userId) || null;
}

export function setCurrentUser(userId: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || !user.isActive) return false;
  
  localStorage.setItem('ethub_current_user_id', userId);
  
  // Update last login
  updateUser(userId, { lastLogin: new Date().toISOString() });
  
  return true;
}

export function logoutCurrentUser(): void {
  localStorage.removeItem('ethub_current_user_id');
}

// User Settings Management
export function updateUserSettings(userId: string, settings: Partial<UserEntry>): boolean {
  const list = getUsers();
  const index = list.findIndex(item => item.id === userId);
  if (index === -1) return false;
  
  const oldUser = list[index];
  const updatedUser = { ...oldUser, ...settings };
  list[index] = updatedUser;
  persistUsers(list);
  dispatchUsersChanged();
  
  // Add history entry for settings changes
  const changes: Record<string, { old: string | number; new: string | number }> = {};
  Object.keys(settings).forEach(key => {
    if (key in oldUser && key in updatedUser) {
      const oldValue = oldUser[key as keyof UserEntry];
      const newValue = updatedUser[key as keyof UserEntry];
      if (oldValue !== newValue) {
        changes[key] = { old: String(oldValue), new: String(newValue) };
      }
    }
  });
  
  if (Object.keys(changes).length > 0) {
    addHistoryEntry({
      action: 'updated',
      entityType: 'user',
      entityName: updatedUser.displayName,
      entityId: userId,
      description: `Updated user settings for ${updatedUser.displayName}`,
      changes,
      performedBy: getActorName(),
      department: 'System',
    });
  }
  
  return true;
}

export function connectDiscord(userId: string, discordId: string, discordUsername: string): boolean {
  return updateUserSettings(userId, {
    discordId,
    discordUsername,
  });
}

export function connectSteam(userId: string, steamId: string, steamUsername: string): boolean {
  return updateUserSettings(userId, {
    steamId,
    steamUsername,
  });
}

export function updateAvatar(userId: string, avatarUrl: string): boolean {
  return updateUserSettings(userId, {
    avatar: avatarUrl,
  });
}

export function updateUsername(userId: string, newUsername: string): boolean {
  return updateUserSettings(userId, {
    username: newUsername,
  });
}

export function updateCoverImage(userId: string, coverUrl: string): boolean {
  return updateUserSettings(userId, {
    coverImage: coverUrl,
  });
}

export function updateRank(userId: string, rankLevel: number, rankTitle: string, rankColor: string): boolean {
  return updateUserSettings(userId, {
    rankLevel,
    rankTitle,
    rankColor,
  });
}

// Rank definitions
export interface RankDefinition {
  level: number;
  title: string;
  color: string;
  icon?: string;
  requirements?: string[];
}

export const RANKS: RankDefinition[] = [
  { level: 1, title: 'New Driver', color: '#94a3b8', icon: '🚛', requirements: ['Just joined the VTC'] },
  { level: 2, title: 'Junior Driver', color: '#60a5fa', icon: '🚚', requirements: ['Completed first convoy'] },
  { level: 3, title: 'Experienced Driver', color: '#34d399', icon: '🚛', requirements: ['10 convoys completed'] },
  { level: 4, title: 'Senior Driver', color: '#fbbf24', icon: '🚛', requirements: ['25 convoys completed', 'Active for 3 months'] },
  { level: 5, title: 'Elite Driver', color: '#f97316', icon: '🚛', requirements: ['50 convoys completed', 'Active for 6 months'] },
  { level: 7, title: 'Hall of Fame', color: '#a855f7', icon: '🏆', requirements: ['200+ convoys', 'Outstanding contributions'] },
];

export function getUserRank(rankLevel?: number): RankDefinition | null {
  if (!rankLevel) return null;
  return RANKS.find(rank => rank.level === rankLevel) || RANKS[0];
}

export function getNextRank(currentLevel?: number): RankDefinition | null {
  if (!currentLevel) return RANKS[0];
  const currentIndex = RANKS.findIndex(rank => rank.level === currentLevel);
  return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
}

// Downloads Storage
export interface DownloadFile {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  uploadedBy: string;
  uploadedAt: string;
  description: string;
  category: 'Resource' | 'Mod' | 'Document' | 'Other';
  dataUrl: string;
}

const DOWNLOADS_STORAGE_KEY = 'ethub_downloads_v1';

function safeParseDownloads(raw: string | null): DownloadFile[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

function persistDownloads(list: DownloadFile[]) {
  localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(list));
}

function dispatchDownloadsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('ethub-downloads-changed'));
}

export function getDownloads(): DownloadFile[] {
  if (typeof window === 'undefined') return [];
  return safeParseDownloads(localStorage.getItem(DOWNLOADS_STORAGE_KEY));
}

export function addDownload(
  file: Omit<DownloadFile, 'id' | 'uploadedAt' | 'uploadedBy' | 'formattedSize'>
): DownloadFile {
  const actor = getActorName();
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `dl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
  // Format file size
  let formattedSize = '0 B';
  if (file.size >= 1048576) formattedSize = `${(file.size / 1048576).toFixed(2)} MB`;
  else if (file.size >= 1024) formattedSize = `${(file.size / 1024).toFixed(2)} KB`;
  else formattedSize = `${file.size} B`;

  const downloadFile: DownloadFile = {
    ...file,
    id,
    uploadedAt: new Date().toISOString(),
    uploadedBy: actor,
    formattedSize,
  };

  const list = getDownloads();
  list.unshift(downloadFile);
  persistDownloads(list);
  dispatchDownloadsChanged();

  // Audit Log History Entry
  addHistoryEntry({
    action: 'added',
    entityType: 'driver',
    entityName: file.name,
    entityId: id,
    description: `Uploaded file "${file.name}" to Download center`,
    performedBy: actor,
    department: 'Admin'
  });

  return downloadFile;
}

export function removeDownload(id: string): boolean {
  const list = getDownloads();
  const file = list.find(item => item.id === id);
  if (!file) return false;

  const newList = list.filter(item => item.id !== id);
  persistDownloads(newList);
  dispatchDownloadsChanged();

  // Audit Log History Entry
  addHistoryEntry({
    action: 'removed',
    entityType: 'driver',
    entityName: file.name,
    entityId: id,
    description: `Deleted file "${file.name}" from Download center`,
    performedBy: getActorName(),
    department: 'Admin'
  });

  return true;
}

export function subscribeDownloadsChanges(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => fn();
  window.addEventListener('ethub-downloads-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('ethub-downloads-changed', handler);
    window.removeEventListener('storage', handler);
  };
}
