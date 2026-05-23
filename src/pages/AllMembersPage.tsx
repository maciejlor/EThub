import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  UserCheckIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  UserIcon,
  ShieldIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  UsersIcon,
  TruckIcon,
  EyeIcon,
  SearchIcon,
} from 'lucide-react';
import { getUsers, addUser, updateUser, removeUser, subscribeUsersChanges, getCurrentUser, type UserEntry } from '@/lib/driver-storage';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ALL_ROLES: UserEntry['role'][] = [
  'Driver',
  'HR Team',
  'Event Assistant',
  'HR Manager',
  'Event Manager',
  'Admin',
];

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  'HR Manager': 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  'Event Manager': 'bg-purple-600/20 text-purple-400 border-purple-500/30',
  'HR Team': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'Event Assistant': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  Driver: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  // Legacy colours kept for backwards-compat with old stored data
  Overseer: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'HR Staff': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Event Staff': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Senior Staff': 'bg-green-500/20 text-green-400 border-green-500/30',
};

function deriveDepartmentFromRole(role: UserEntry['role']): UserEntry['department'] {
  if (role === 'HR Team' || role === 'HR Manager' || role === 'HR Staff') return 'HR';
  if (role === 'Event Assistant' || role === 'Event Manager' || role === 'Event Staff') return 'Event';
  if (role === 'Admin' || role === 'Overseer') return 'Admin';
  return 'None';
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso?: string) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="h-14 w-14 text-muted-foreground mb-4 opacity-40" />
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export function AllMembersPage() {
  const [users, setUsers] = useState<UserEntry[]>(getUsers());
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserEntry | null>(null);
  const navigate = useNavigate();
  const [acceptingUser, setAcceptingUser] = useState<UserEntry | null>(null);
  const [acceptRole, setAcceptRole] = useState<UserEntry['role']>('Driver');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add-user form
  const currentUserRaw = localStorage.getItem('ethub_current_user') || '{"displayName":"Admin"}';
  const currentUserInfo = JSON.parse(currentUserRaw) as { displayName?: string };

  const emptyNew = {
    displayName: '',
    discordId: '',
    steamId: '',
    role: 'Driver' as UserEntry['role'],
  };
  const [newUser, setNewUser] = useState(emptyNew);

  useEffect(() => {
    const unsub = subscribeUsersChanges(() => setUsers(getUsers()));
    return unsub;
  }, []);

  // ── Derived lists ────────────────────────────────────────────────────────
  const activeMembers = users.filter((u) => !u.isPending);
  const pendingRequests = users.filter((u) => u.isPending === true);

  const filteredMembers = activeMembers.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.displayName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.discordId ?? '').toLowerCase().includes(q) ||
      (u.steamId ?? '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddUser = () => {
    if (!newUser.displayName.trim()) return;
    const role = newUser.role;
    addUser({
      username: newUser.displayName.toLowerCase().replace(/\s+/g, '_'),
      email: '',
      displayName: newUser.displayName.trim(),
      avatar: '',
      discordId: newUser.discordId.trim() || undefined,
      steamId: newUser.steamId.trim() || undefined,
      role,
      department: deriveDepartmentFromRole(role),
      isActive: true,
      isPending: false,
      createdBy: currentUserInfo.displayName ?? 'Admin',
    });
    setNewUser(emptyNew);
    setIsAddOpen(false);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    updateUser(editingUser.id, {
      displayName: editingUser.displayName,
      discordId: editingUser.discordId,
      steamId: editingUser.steamId,
      role: editingUser.role,
      department: deriveDepartmentFromRole(editingUser.role),
      isActive: editingUser.isActive,
    });
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this user?')) removeUser(id);
  };

  const handleAccept = () => {
    if (!acceptingUser) return;
    updateUser(acceptingUser.id, {
      role: acceptRole,
      department: deriveDepartmentFromRole(acceptRole),
      isActive: true,
      isPending: false,
    });
    setAcceptingUser(null);
  };

  const handleDecline = (id: string) => {
    if (confirm('Are you sure you want to decline and remove this join request?')) removeUser(id);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <Header />
        <main className="bg-background">
          <Page>
            {/* ── Page Header ── */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className="text-xl font-semibold lg:text-2xl text-foreground">All Members</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage user accounts, roles, and join requests.
                </p>
              </div>
              {isAdmin && (
                <Button
                  id="add-user-btn"
                  onClick={() => setIsAddOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              )}
            </div>

            {/* ── Tabs ── */}
            {isAdmin && (
              <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg w-fit">
                <button
                  id="tab-members"
                  onClick={() => setActiveTab('members')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'members'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UsersIcon className="inline h-4 w-4 mr-2" />
                  All Members
                  <span className="ml-2 text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                    {activeMembers.length}
                  </span>
                </button>
                <button
                  id="tab-requests"
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'requests'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ClockIcon className="inline h-4 w-4 mr-2" />
                  Join Requests
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: ALL MEMBERS                                           */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'members' && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="member-search"
                      placeholder="Search by name, Discord ID, Steam ID…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-background border-border"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger id="role-filter" className="w-44 bg-background border-border">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">All Roles</SelectItem>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(search || roleFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => { setSearch(''); setRoleFilter('all'); }}
                      className="bg-background border-border"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Table */}
                {filteredMembers.length === 0 ? (
                  <EmptyState
                    icon={UserCheckIcon}
                    title="No members found"
                    sub={activeMembers.length === 0 ? 'No users created yet. Click "Add User" to get started.' : 'No users match your current filters.'}
                  />
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rank</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Discord</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Steam</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Last Login</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Member Since</th>
                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Profile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMembers.map((u, i) => (
                            <tr
                              key={u.id}
                              className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
                                i % 2 === 0 ? '' : 'bg-muted/10'
                              }`}
                            >
                              {/* Member */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {u.avatar || u.discordAvatar || u.steamAvatar ? (
                                    <img
                                      src={u.avatar || u.discordAvatar || u.steamAvatar}
                                      alt={u.displayName}
                                      className="w-9 h-9 rounded-full border border-border object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-border flex items-center justify-center shrink-0">
                                      <UserIcon className="h-4 w-4 text-primary" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">{u.displayName}</p>
                                    <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Rank */}
                              <td className="px-4 py-3">
                                <Badge className={`${ROLE_COLORS[u.role] ?? 'bg-muted text-muted-foreground'} text-xs border`}>
                                  <ShieldIcon className="h-3 w-3 mr-1" />
                                  {u.role}
                                </Badge>
                              </td>

                              {/* Discord (clickable) */}
                              <td className="px-4 py-3 hidden md:table-cell">
                                {u.discordId ? (
                                  <a
                                    href={`https://discord.com/users/${u.discordId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline text-sm"
                                  >
                                    Click me
                                  </a>
                                ) : (
                                  <span className="font-mono text-xs text-muted-foreground">—</span>
                                )}
                              </td>

                              {/* Steam (clickable) */}
                              <td className="px-4 py-3 hidden lg:table-cell">
                                {u.steamId ? (
                                  <a
                                    href={u.steamId.startsWith('http') ? u.steamId : `https://steamcommunity.com/profiles/${u.steamId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline text-sm"
                                    title={`Open Steam profile: ${u.steamId}`}
                                  >
                                    Click me
                                  </a>
                                ) : (
                                  <span className="font-mono text-xs text-muted-foreground">—</span>
                                )}
                              </td>

                              {/* Last Login */}
                              <td className="px-4 py-3 hidden xl:table-cell">
                                <span className="text-xs text-muted-foreground">{formatDateTime(u.lastLogin)}</span>
                              </td>

                              {/* Member Since */}
                              <td className="px-4 py-3 hidden xl:table-cell">
                                <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
                              </td>

                              {/* Profile / Actions */}
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    id={`view-profile-${u.id}`}
                                    size="sm"
                                    onClick={() => {
                                      const viewNumber = u.profileNumber ?? (users.findIndex((x) => x.id === u.id) + 1);
                                      navigate(`/profile/users/${viewNumber}`);
                                    }}
                                    className="h-8 px-3 bg-background border-border"
                                  >
                                    <EyeIcon className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  {isAdmin && (
                                    <>
                                      <Button
                                        id={`edit-user-${u.id}`}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingUser(u)}
                                        className="h-8 px-2 bg-background border-border"
                                      >
                                        <EditIcon className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        id={`delete-user-${u.id}`}
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(u.id)}
                                        className="h-8 px-2"
                                      >
                                        <TrashIcon className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: JOIN REQUESTS                                         */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'requests' && (
              <>
                {pendingRequests.length === 0 ? (
                  <EmptyState
                    icon={ClockIcon}
                    title="No pending requests"
                    sub="When someone signs in via Discord and is not yet registered, their join request will appear here."
                  />
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Applicant</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Discord ID</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Discord Username</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Requested</th>
                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingRequests.map((u, i) => (
                            <tr
                              key={u.id}
                              className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
                                i % 2 === 0 ? '' : 'bg-muted/10'
                              }`}
                            >
                              {/* Applicant */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {u.discordAvatar ? (
                                    <img
                                      src={u.discordAvatar}
                                      alt={u.displayName}
                                      className="w-9 h-9 rounded-full border border-yellow-500/30 object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                                      <UserIcon className="h-4 w-4 text-yellow-400" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">{u.displayName}</p>
                                    <Badge className="mt-0.5 bg-yellow-500/15 text-yellow-400 border-yellow-500/30 border text-xs">
                                      Pending
                                    </Badge>
                                  </div>
                                </div>
                              </td>

                              {/* Discord ID */}
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {u.discordId || '—'}
                                </span>
                              </td>

                              {/* Discord Username */}
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className="text-xs text-muted-foreground">
                                  {u.discordUsername || '—'}
                                </span>
                              </td>

                              {/* Requested date */}
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-xs text-muted-foreground">{formatDateTime(u.createdAt)}</span>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    id={`accept-request-${u.id}`}
                                    size="sm"
                                    onClick={() => { setAcceptingUser(u); setAcceptRole('Driver'); }}
                                    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckIcon className="h-3 w-3 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    id={`decline-request-${u.id}`}
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDecline(u.id)}
                                    className="h-8 px-3"
                                  >
                                    <XIcon className="h-3 w-3 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </Page>
        </main>
      </SidebarInset>

      {/* ── Add User Dialog ────────────────────────────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Display Name <span className="text-red-400">*</span>
              </label>
              <Input
                id="add-displayName"
                value={newUser.displayName}
                onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="e.g. John Smith"
                className="bg-background border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Discord ID</label>
              <Input
                id="add-discordId"
                value={newUser.discordId}
                onChange={(e) => setNewUser((p) => ({ ...p, discordId: e.target.value }))}
                placeholder="e.g. 123456789012345678"
                className="bg-background border-border font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required so this user can log in via Discord.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Steam ID</label>
              <Input
                id="add-steamId"
                value={newUser.steamId}
                onChange={(e) => setNewUser((p) => ({ ...p, steamId: e.target.value }))}
                placeholder="e.g. 76561198000000000"
                className="bg-background border-border font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Rank</label>
              <Select
                value={newUser.role}
                onValueChange={(v: UserEntry['role']) => setNewUser((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger id="add-role" className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-foreground hover:bg-accent">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Department is automatically assigned based on rank.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                id="add-user-submit"
                onClick={handleAddUser}
                disabled={!newUser.displayName.trim()}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add User
              </Button>
              <Button
                variant="outline"
                onClick={() => { setNewUser(emptyNew); setIsAddOpen(false); }}
                className="flex-1 bg-background border-border"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ───────────────────────────────────────────────── */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Display Name</label>
                <Input
                  id="edit-displayName"
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser((p) => p ? { ...p, displayName: e.target.value } : null)}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Discord ID</label>
                <Input
                  id="edit-discordId"
                  value={editingUser.discordId ?? ''}
                  onChange={(e) => setEditingUser((p) => p ? { ...p, discordId: e.target.value } : null)}
                  className="bg-background border-border font-mono"
                  placeholder="e.g. 123456789012345678"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Steam ID</label>
                <Input
                  id="edit-steamId"
                  value={editingUser.steamId ?? ''}
                  onChange={(e) => setEditingUser((p) => p ? { ...p, steamId: e.target.value } : null)}
                  className="bg-background border-border font-mono"
                  placeholder="e.g. 76561198000000000"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Rank</label>
                <Select
                  value={editingUser.role}
                  onValueChange={(v: UserEntry['role']) =>
                    setEditingUser((p) =>
                      p ? { ...p, role: v, department: deriveDepartmentFromRole(v) } : null
                    )
                  }
                >
                  <SelectTrigger id="edit-role" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-foreground hover:bg-accent">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  id="edit-user-submit"
                  onClick={handleUpdateUser}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-background border-border"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Accept Join Request Dialog ────────────────────────────────────── */}
      {acceptingUser && (
        <Dialog open={!!acceptingUser} onOpenChange={() => setAcceptingUser(null)}>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-foreground">Accept Join Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                {acceptingUser.discordAvatar ? (
                  <img src={acceptingUser.discordAvatar} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{acceptingUser.displayName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{acceptingUser.discordId || 'No Discord ID'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Assign Rank
                </label>
                <Select value={acceptRole} onValueChange={(v: UserEntry['role']) => setAcceptRole(v)}>
                  <SelectTrigger id="accept-role" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-foreground hover:bg-accent">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  id="accept-request-submit"
                  onClick={handleAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAcceptingUser(null)}
                  className="flex-1 bg-background border-border"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
    </SidebarProvider>
  );
}
