import { useState, useEffect } from 'react';
import { getRoles, addRole, updateRole, deleteRole, getUsers, subscribeUsersChanges, type RoleEntry, type Permission, type UserEntry } from '@/lib/driver-storage';
import { Plus, Edit2, Trash2, Shield, Save, X, Users } from 'lucide-react';
import { RoleBadge } from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';

const ALL_PERMISSIONS: { id: Permission; label: string; desc: string }[] = [
  { id: 'manage_users', label: 'Manage Users', desc: 'Can add, edit, or remove users and handle applications.' },
  { id: 'manage_roles', label: 'Manage Roles', desc: 'Can create and assign custom roles to users.' },
  { id: 'manage_events', label: 'Manage Events', desc: 'Can create events, invite VTCs, and manage event attendance.' },
  { id: 'manage_hr', label: 'Manage HR (All)', desc: 'Has full access to all Human Resources features.' },
  { id: 'manage_loa', label: 'Manage LOA', desc: 'Can view and process Leave of Absence requests.' },
  { id: 'manage_attendance', label: 'Manage Attendance', desc: 'Can view and process attendance logs.' },
  { id: 'manage_blacklist', label: 'Manage Blacklist', desc: 'Can view and modify the driver blacklist.' },
  { id: 'manage_left_drivers', label: 'Manage Left Drivers', desc: 'Can view and manage left drivers data.' },
  { id: 'view_audit_logs', label: 'View Audit Logs', desc: 'Can view the global history and staff activity logs.' },
  { id: 'manage_settings', label: 'Manage Settings', desc: 'Can change global application settings.' },
];

export function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [editingRole, setEditingRole] = useState<RoleEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadRoles();
    setUsers(getUsers());
    const handleRolesChanged = () => loadRoles();
    const unsubUsers = subscribeUsersChanges(() => setUsers(getUsers()));
    window.addEventListener('ethub-roles-changed', handleRolesChanged);
    return () => {
      window.removeEventListener('ethub-roles-changed', handleRolesChanged);
      unsubUsers();
    };
  }, []);

  const loadRoles = () => {
    setRoles(getRoles());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      if (editingRole.id.startsWith('role_') && !roles.find(r => r.id === editingRole.id)) {
        addRole({
          name: editingRole.name,
          color: editingRole.color,
          gradientColor: editingRole.gradientColor,
          iconUrl: editingRole.iconUrl,
          permissions: editingRole.permissions,
          isSystem: false,
        });
      } else {
        updateRole(editingRole.id, editingRole);
      }
      setEditingRole(null);
      setIsCreating(false);
    }
  };

  const handleTogglePermission = (permId: Permission) => {
    if (!editingRole) return;
    setEditingRole(prev => {
      if (!prev) return prev;
      const has = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: has ? prev.permissions.filter(p => p !== permId) : [...prev.permissions, permId]
      };
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this role? Users with this role will lose their permissions.')) {
      deleteRole(id);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <Header />
        <main className="bg-background">
          <Page>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    Roles & Permissions
                  </h1>
                  <p className="text-white/60 text-sm mt-1">Create custom roles and configure what they are allowed to do.</p>
                </div>
                <Button onClick={() => {
                  setEditingRole({ id: `role_${Date.now()}`, name: '', color: '#8b5cf6', permissions: [], isSystem: false });
                  setIsCreating(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </div>

              {editingRole ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      {isCreating ? <Plus className="h-5 w-5 text-primary" /> : <Edit2 className="h-5 w-5 text-primary" />}
                      {isCreating ? 'Create New Role' : 'Edit Role'}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingRole(null); setIsCreating(false); }}>
                      <X className="h-5 w-5 text-white/50" />
                    </Button>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-1">Role Name</label>
                          <input
                            type="text"
                            required
                            value={editingRole.name}
                            onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                            placeholder="e.g. Moderator"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-1">Badge Base Color</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={editingRole.color}
                                onChange={e => setEditingRole({ ...editingRole, color: e.target.value })}
                                className="h-10 w-10 rounded cursor-pointer bg-transparent border-0 p-0"
                              />
                              <span className="text-xs text-white/50 font-mono">{editingRole.color}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-1">Gradient Color (Optional)</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={editingRole.gradientColor || '#000000'}
                                onChange={e => setEditingRole({ ...editingRole, gradientColor: e.target.value })}
                                className="h-10 w-10 rounded cursor-pointer bg-transparent border-0 p-0"
                              />
                              {editingRole.gradientColor && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setEditingRole({ ...editingRole, gradientColor: undefined })}
                                  className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-1">Custom Icon URL (Optional)</label>
                          <input
                            type="url"
                            value={editingRole.iconUrl || ''}
                            onChange={e => setEditingRole({ ...editingRole, iconUrl: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                            placeholder="https://example.com/icon.png"
                          />
                          <p className="text-xs text-white/40 mt-1">Provide a direct link to an image to replace the default shield icon.</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Live Preview</label>
                          <div className="p-3 bg-black/30 border border-white/5 rounded-lg flex items-center justify-center min-h-[60px]">
                            <RoleBadge role={editingRole} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-white/80 mb-1">Permissions</label>
                        <div className="bg-black/30 border border-white/5 rounded-lg p-2 space-y-2 max-h-[300px] overflow-y-auto">
                          {ALL_PERMISSIONS.map(perm => {
                            const isChecked = editingRole.permissions.includes(perm.id);
                            return (
                              <label key={perm.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.id)}
                                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black/50 text-primary focus:ring-primary focus:ring-offset-black"
                                />
                                <div>
                                  <p className="text-sm font-medium text-white">{perm.label}</p>
                                  <p className="text-xs text-white/50">{perm.desc}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                      {!isCreating && editingRole.id !== 'role_admin' && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          className="mr-auto bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this role? Users with this role will lose their permissions.')) {
                              deleteRole(editingRole.id);
                              setEditingRole(null);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Role
                        </Button>
                      )}
                      <Button type="button" variant="ghost" onClick={() => { setEditingRole(null); setIsCreating(false); }}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Save Role
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Assigned Users</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Permissions</th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role, i) => (
                          <tr 
                            key={role.id}
                            className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
                              i % 2 === 0 ? '' : 'bg-muted/10'
                            }`}
                          >
                            <td className="px-4 py-4 align-top">
                              <RoleBadge role={role.id} />
                            </td>
                            
                            <td className="px-4 py-4 align-top hidden md:table-cell">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                {users.filter(u => u.role === role.id || u.role === role.name).length}
                              </span>
                            </td>
                            
                            <td className="px-4 py-4 align-top">
                              {role.permissions.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {role.permissions.map(permId => {
                                    const permDef = ALL_PERMISSIONS.find(p => p.id === permId);
                                    return (
                                      <div key={permId} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground border border-border/50">
                                        <div className="h-1 w-1 rounded-full bg-primary/50" />
                                        {permDef?.label || permId}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-xs">No special permissions</span>
                              )}
                            </td>
                            
                            <td className="px-4 py-4 align-top">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditingRole(role)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                {role.id !== 'role_admin' && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(role.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
