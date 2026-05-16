import { useState, useEffect } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserCheckIcon, PlusIcon, TrashIcon, EditIcon, UserIcon, MailIcon, CalendarIcon, ShieldIcon } from 'lucide-react';
import { getUsers, addUser, updateUser, removeUser, subscribeUsersChanges, type UserEntry } from '@/lib/driver-storage';

const ROLE_COLORS: Record<string, string> = {
  'Admin': 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  'HR Manager': 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'Event Manager': 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
  'HR Staff': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'Event Staff': 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
  'Senior Staff': 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  'Driver': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
};

const DEPARTMENT_COLORS: Record<string, string> = {
  'HR': 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  'Event': 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  'Admin': 'bg-red-500/20 text-red-700 dark:text-red-400',
};

export function AllMembersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    steamId: '',
    discordId: '',
    role: 'HR Staff' as UserEntry['role'],
    department: 'HR' as UserEntry['department'],
    isActive: true,
    createdBy: 'Current User',
  });

  const deriveDepartmentFromRole = (role: UserEntry['role']): UserEntry['department'] => {
    if (role === 'HR Staff') return 'HR';
    if (role === 'Event Staff') return 'Event';
    return newUser.department;
  };

  useEffect(() => {
    setUsers(getUsers());
    
    const unsubscribe = subscribeUsersChanges(() => {
      setUsers(getUsers());
    });

    return unsubscribe;
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.steamId ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.discordId ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password) {
      return;
    }

    // `addUser()` requires email/displayName. We auto-fill them from username,
    // since the dialog no longer asks for those values.
    addUser({
      username: newUser.username,
      password: newUser.password,
      email: '',
      displayName: newUser.username,
      avatar: '',
      steamId: newUser.steamId.trim() || undefined,
      discordId: newUser.discordId.trim() || undefined,
      role: newUser.role,
      department: newUser.department,
      isActive: newUser.isActive,
      createdBy: newUser.createdBy,
    });

    setNewUser({
      username: '',
      password: '',
      steamId: '',
      discordId: '',
      role: 'HR Staff',
      department: 'HR',
      isActive: true,
      createdBy: 'Current User'
    });
    setIsAddDialogOpen(false);
  };

  const handleEditUser = (user: UserEntry) => {
    setEditingUser(user);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    updateUser(editingUser.id, {
      username: editingUser.username,
      email: editingUser.email,
      displayName: editingUser.displayName,
      avatar: editingUser.avatar,
      role: editingUser.role,
      department: editingUser.department,
      isActive: editingUser.isActive,
    });

    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      removeUser(userId);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setDepartmentFilter('all');
    setStatusFilter('all');
  };

  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='bg-background'>
        <Header />
        <main className='bg-background'>
          <Page>
            <div className='flex flex-col gap-4 lg:flex-row lg:justify-between mb-8'>
              <div>
                <h1 className='text-xl font-semibold lg:text-2xl text-foreground'>All Members</h1>
                <p className='text-sm text-muted-foreground'>Manage user accounts and assign roles for dashboard access.</p>
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className='bg-primary text-primary-foreground hover:bg-primary/90'>
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className='bg-card border-border'>
                  <DialogHeader>
                    <DialogTitle className='text-foreground'>Add New User</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Username</label>
                      <Input
                        value={newUser.username}
                        onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                        placeholder='Enter username'
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Password</label>
                      <Input
                        type='password'
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        placeholder='Enter password'
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Steam ID</label>
                      <Input
                        value={newUser.steamId}
                        onChange={(e) => setNewUser(prev => ({ ...prev, steamId: e.target.value }))}
                        placeholder='Enter Steam ID (64-bit)'
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Discord ID</label>
                      <Input
                        value={newUser.discordId}
                        onChange={(e) => setNewUser(prev => ({ ...prev, discordId: e.target.value }))}
                        placeholder='Enter Discord user ID'
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Role</label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value: UserEntry['role']) =>
                          setNewUser((prev) => ({
                            ...prev,
                            role: value,
                            department: deriveDepartmentFromRole(value),
                          }))
                        }
                      >
                        <SelectTrigger className='bg-background border-border'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-card border-border'>
                          <SelectItem value='Driver' className='text-foreground hover:bg-accent'>Driver</SelectItem>
                          <SelectItem value='HR Staff' className='text-foreground hover:bg-accent'>HR Staff</SelectItem>
                          <SelectItem value='Event Staff' className='text-foreground hover:bg-accent'>Event Staff</SelectItem>
                          <SelectItem value='Event Manager' className='text-foreground hover:bg-accent'>Event Manager</SelectItem>
                          <SelectItem value='HR Manager' className='text-foreground hover:bg-accent'>HR Manager</SelectItem>
                          <SelectItem value='Admin' className='text-foreground hover:bg-accent'>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddUser} className='w-full bg-primary text-primary-foreground hover:bg-primary/90'>
                      Add User
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <Card className='bg-card border-border mb-6'>
              <CardHeader>
                <CardTitle className='text-lg'>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Search</label>
                    <Input
                      placeholder='Search users...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='bg-background border-border'
                    />
                  </div>
                  
                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Role</label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className='bg-background border-border'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-card border-border'>
                        <SelectItem value='all'>All Roles</SelectItem>
                        <SelectItem value='HR Staff'>HR Staff</SelectItem>
                        <SelectItem value='Event Staff'>Event Staff</SelectItem>
                        <SelectItem value='Senior Staff'>Senior Staff</SelectItem>
                        <SelectItem value='HR Manager'>HR Manager</SelectItem>
                        <SelectItem value='Event Manager'>Event Manager</SelectItem>
                        <SelectItem value='Admin'>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Department</label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className='bg-background border-border'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-card border-border'>
                        <SelectItem value='all'>All Departments</SelectItem>
                        <SelectItem value='HR'>HR</SelectItem>
                        <SelectItem value='Event'>Event</SelectItem>
                        <SelectItem value='Admin'>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className='bg-background border-border'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-card border-border'>
                        <SelectItem value='all'>All Status</SelectItem>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='inactive'>Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex items-end'>
                    <Button onClick={clearFilters} variant='outline' className='w-full bg-background border-border'>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users Display */}
            <div className='space-y-4'>
              {filteredUsers.length === 0 ? (
                <div className='text-center py-16'>
                  <UserCheckIcon className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-xl font-semibold text-foreground mb-2'>No users found</h3>
                  <p className='text-muted-foreground'>
                    {users.length === 0 ? 'No users created yet.' : 'No users match your filters.'}
                  </p>
                </div>
              ) : (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className='bg-card border-border'>
                      <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.displayName} className='w-10 h-10 rounded-full' />
                            ) : (
                              <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                                <UserIcon className='h-5 w-5 text-primary' />
                              </div>
                            )}
                            <div>
                              <CardTitle className='text-lg text-foreground'>{user.displayName}</CardTitle>
                              <p className='text-sm text-muted-foreground'>@{user.username}</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge className={user.isActive ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <MailIcon className='h-4 w-4' />
                          <span>{user.email}</span>
                        </div>
                        
                        <div className='flex items-center gap-2'>
                          <Badge className={ROLE_COLORS[user.role]}>
                            <ShieldIcon className='h-3 w-3 mr-1' />
                            {user.role}
                          </Badge>
                          <Badge className={DEPARTMENT_COLORS[user.department]}>
                            {user.department}
                          </Badge>
                        </div>

                        <div className='text-xs text-muted-foreground'>
                          <div className='flex items-center gap-1'>
                            <CalendarIcon className='h-3 w-3' />
                            <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                          {user.lastLogin && (
                            <div className='flex items-center gap-1 mt-1'>
                              <CalendarIcon className='h-3 w-3' />
                              <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className='flex space-x-2 pt-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEditUser(user)}
                            className='bg-background border-border'
                          >
                            <EditIcon className='mr-2 h-4 w-4' />
                            Edit
                          </Button>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleDeleteUser(user.id)}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          >
                            <TrashIcon className='mr-2 h-4 w-4' />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Edit User Dialog */}
            {editingUser && (
              <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className='bg-card border-border'>
                  <DialogHeader>
                    <DialogTitle className='text-foreground'>Edit User</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Username</label>
                      <Input
                        value={editingUser.username}
                        onChange={(e) => setEditingUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Email</label>
                      <Input
                        type='email'
                        value={editingUser.email}
                        onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Display Name</label>
                      <Input
                        value={editingUser.displayName}
                        onChange={(e) => setEditingUser(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                        className='bg-background border-border'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Role</label>
                      <Select
                        value={editingUser.role}
                        onValueChange={(value: UserEntry['role']) =>
                          setEditingUser((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  role: value,
                                  department:
                                    value === 'HR Staff'
                                      ? 'HR'
                                      : value === 'Event Staff'
                                        ? 'Event'
                                        : prev.department,
                                }
                              : null
                          )
                        }
                      >
                        <SelectTrigger className='bg-background border-border'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-card border-border'>
                          <SelectItem value='HR Staff' className='text-foreground hover:bg-accent'>HR Staff</SelectItem>
                          <SelectItem value='Event Staff' className='text-foreground hover:bg-accent'>Event Staff</SelectItem>
                          <SelectItem value='Senior Staff' className='text-foreground hover:bg-accent'>Senior Staff</SelectItem>
                          <SelectItem value='HR Manager' className='text-foreground hover:bg-accent'>HR Manager</SelectItem>
                          <SelectItem value='Event Manager' className='text-foreground hover:bg-accent'>Event Manager</SelectItem>
                          <SelectItem value='Admin' className='text-foreground hover:bg-accent'>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>Department</label>
                      <Select value={editingUser.department} onValueChange={(value: UserEntry['department']) => setEditingUser(prev => prev ? { ...prev, department: value } : null)}>
                        <SelectTrigger className='bg-background border-border'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-card border-border'>
                          <SelectItem value='HR' className='text-foreground hover:bg-accent'>HR</SelectItem>
                          <SelectItem value='Event' className='text-foreground hover:bg-accent'>Event</SelectItem>
                          <SelectItem value='Admin' className='text-foreground hover:bg-accent'>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        id='isActive'
                        checked={editingUser.isActive}
                        onChange={(e) => setEditingUser(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                        className='rounded'
                      />
                      <label htmlFor='isActive' className='text-sm font-medium text-foreground'>
                        Active User
                      </label>
                    </div>
                    <div className='flex space-x-2'>
                      <Button onClick={handleUpdateUser} className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'>
                        Update User
                      </Button>
                      <Button onClick={() => setEditingUser(null)} variant='outline' className='flex-1 bg-background border-border'>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
