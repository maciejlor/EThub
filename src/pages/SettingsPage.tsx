import { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { RoleBadge } from '@/components/RoleBadge';
import { useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  UserIcon,
  CameraIcon,
  EditIcon,
  TrophyIcon,
  StarIcon,
  LinkIcon,
  UnlinkIcon,
  MessageCircleIcon,
  Gamepad2Icon,
  ImageIcon,
  TruckIcon
} from 'lucide-react';
import { 
  getCurrentUser, 
  updateUserSettings, 
  updateAvatar, 
  updateCoverImage,
  getUserRank,
  getNextRank,
  setCurrentUser,
  getUsers,
  addUser,
  removeUser,
  RANKS,
  type UserEntry 
} from '@/lib/driver-storage';
import { getSteamPlayerSummary } from '@/lib/steam-ets2';
import { generateDiscordOAuthUrl, generateSteamOAuthUrl } from '@/lib/discord-auth';
import { db, isFirebaseConfigured, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

export function SettingsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isWiping, setIsWiping] = useState(false);
  const [user, setUser] = useState<UserEntry | null>(() => {
    let currentUser = getCurrentUser();
    
    // Create test users if none exist
    if (!currentUser) {
      const users = getUsers();
      if (users.length === 0) {
        // Create test users with different roles
        const testUsers = [
          {
            username: 'admin_user',
            email: 'admin@ethub.com',
            displayName: 'Admin User',
            role: 'Admin' as const,
            department: 'Admin' as const,
            isActive: true,
            createdBy: 'System'
          },
          {
            username: 'hr_manager',
            email: 'hr@ethub.com',
            displayName: 'HR Manager',
            role: 'HR Staff' as const,
            department: 'HR' as const,
            isActive: true,
            createdBy: 'System'
          },
          {
            username: 'event_manager',
            email: 'events@ethub.com',
            displayName: 'Event Manager',
            role: 'Event Staff' as const,
            department: 'Event' as const,
            isActive: true,
            createdBy: 'System'
          },
          {
            username: 'assistant_user',
            email: 'assistant@ethub.com',
            displayName: 'HR Staff',
            role: 'HR Staff' as const,
            department: 'HR' as const,
            isActive: true,
            createdBy: 'System'
          },
          {
            username: 'staff_user',
            email: 'staff@ethub.com',
            displayName: 'Event Staff',
            role: 'Event Staff' as const,
            department: 'Event' as const,
            isActive: true,
            createdBy: 'System'
          },
          {
            username: 'driver_user',
            email: 'driver@ethub.com',
            displayName: 'Driver',
            role: 'Driver' as const,
            department: 'Event' as const,
            isActive: true,
            createdBy: 'System'
          }
        ];

        // Add all test users and get the created user objects
        const createdUsers = testUsers.map(userData => addUser(userData));

        // Set the first user as current
        setCurrentUser(createdUsers[0].id);
        currentUser = createdUsers[0];
      } else {
        // Use the first available user
        setCurrentUser(users[0].id);
        currentUser = users[0];
      }
    }
    
    return currentUser;
  });

  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isTruckyIdDialogOpen, setIsTruckyIdDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newAvatar, setNewAvatar] = useState('');
  const [newCover, setNewCover] = useState('');
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newTruckyId, setNewTruckyId] = useState(user?.truckyId || '');

  const handleAvatarUpdate = async () => {
    if (!user || !newAvatar.trim()) return;
    
    setIsLoading(true);
    try {
      const success = updateAvatar(user.id, newAvatar.trim());
      if (success) {
        setUser(prev => prev ? { ...prev, avatar: newAvatar.trim() } : null);
        setNewAvatar('');
        setIsAvatarDialogOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const success = updateAvatar(user.id, base64String);
      if (success) {
        setUser(prev => prev ? { ...prev, avatar: base64String } : null);
        setIsAvatarDialogOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseDiscordAvatar = () => {
    if (!user || !user.discordAvatar) return;
    const success = updateAvatar(user.id, user.discordAvatar);
    if (success) {
      setUser(prev => prev ? { ...prev, avatar: user.discordAvatar } : null);
      setIsAvatarDialogOpen(false);
    }
  };

  const handleUseSteamAvatar = async () => {
    if (!user || !user.steamId) return;
    setIsLoading(true);
    try {
      const profile = await getSteamPlayerSummary(user.steamId);
      const steamAvatar = profile?.avatarfull || user.steamAvatar || user.avatar || '';
      if (!steamAvatar) return;
      const success = updateUserSettings(user.id, { steamAvatar, avatar: steamAvatar });
      if (success) setUser(prev => prev ? { ...prev, steamAvatar, avatar: steamAvatar } : null);
      setIsAvatarDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverUpdate = async () => {
    if (!user || !newCover.trim()) return;
    
    setIsLoading(true);
    try {
      const success = updateCoverImage(user.id, newCover.trim());
      if (success) {
        setUser(prev => prev ? { ...prev, coverImage: newCover.trim() } : null);
        setNewCover('');
        setIsCoverDialogOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const success = updateCoverImage(user.id, base64String);
      if (success) {
        setUser(prev => prev ? { ...prev, coverImage: base64String } : null);
        setIsCoverDialogOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUsernameUpdate = () => {
    if (!user || !newUsername.trim()) return;
    
    const success = updateUserSettings(user.id, { 
      username: newUsername.trim(),
      displayName: newUsername.trim()
    });
    if (success) {
      setUser(prev => prev ? { ...prev, username: newUsername.trim(), displayName: newUsername.trim() } : null);
      setIsUsernameDialogOpen(false);
    }
  };

  const handleEmailUpdate = () => {
    if (!user || !newEmail.trim()) return;

    const success = updateUserSettings(user.id, { email: newEmail.trim() });
    if (success) {
      setUser(prev => prev ? { ...prev, email: newEmail.trim() } : null);
      setIsEmailDialogOpen(false);
    }
  };

  const handleTruckyIdUpdate = () => {
    if (!user) return;

    const success = updateUserSettings(user.id, { truckyId: newTruckyId.trim() || undefined });
    if (success) {
      setUser(prev => prev ? { ...prev, truckyId: newTruckyId.trim() || undefined } : null);
      setIsTruckyIdDialogOpen(false);
    }
  };

  const handleDiscordConnect = () => {
    window.location.href = generateDiscordOAuthUrl();
  };

  const handleDiscordDisconnect = () => {
    if (!user) return;
    
    const success = updateUserSettings(user.id, { discordId: undefined, discordUsername: undefined });
    if (success) {
      setUser(prev => prev ? { ...prev, discordId: undefined, discordUsername: undefined } : null);
    }
  };

  const handleSteamConnect = () => {
    window.location.href = generateSteamOAuthUrl();
  };

  const handleSteamDisconnect = () => {
    if (!user) return;
    
    const success = updateUserSettings(user.id, { steamId: undefined, steamUsername: undefined });
    if (success) {
      setUser(prev => prev ? { ...prev, steamId: undefined, steamUsername: undefined } : null);
    }
  };

  const handleResetApp = () => {
    if (confirm('Are you sure you want to reset your local session and cache? You will be logged out, but the central database will NOT be affected.')) {
      // Keys to preserve (central database sync data)
      const preserve = new Set([
        'ethub_users_v1',
        'ethub_managed_drivers_v1',
        'ethub_left_drivers_v1',
        'ethub_event_invites_v1',
        'ethub_blacklist_drivers_v1',
        'ethub_blacklist_vtcs_v1',
        'ethub_blacklist_staff_v1',
        'ethub_history_v1',
        'ethub_loa_requests_v1',
        'ethub_downloads_v1',
        'ethub_seeded_v1'
      ]);

      // Temporary local storage entries
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (!preserve.has(key)) {
          localStorage.removeItem(key);
        }
      });

      // Redirect to login and reload
      window.location.href = '/login';
    }
  };

  const isAdmin = user?.role === 'Admin';

  const handleWipeDatabase = async () => {
    if (!isAdmin) return;
    if (!confirm('🚨 WARNING: This will permanently delete ALL members, join requests, blacklist entries, and history from the central Firebase database. Only YOU (Macik) will remain. Are you absolutely sure?')) return;
    
    setIsWiping(true);
    try {
      if (!isFirebaseConfigured() || !db) {
        alert('Firebase is not configured.');
        return;
      }

      const collectionsToClear = [
        COLLECTIONS.managedDrivers,
        COLLECTIONS.leftDrivers,
        COLLECTIONS.eventInvites,
        COLLECTIONS.blacklistDrivers,
        COLLECTIONS.blacklistVtcs,
        COLLECTIONS.blacklistStaff,
        COLLECTIONS.history,
        COLLECTIONS.loaRequests,
        COLLECTIONS.downloads
      ];

      // 1. Wipe other collections
      for (const colName of collectionsToClear) {
        const snap = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(doc(db, colName, d.id)));
        await batch.commit();
      }

      // 2. Wipe users except Macik
      const userSnap = await getDocs(collection(db, COLLECTIONS.users));
      const userBatch = writeBatch(db);
      userSnap.docs.forEach(d => {
        const data = d.data();
        const name = (data.displayName || data.username || '').toLowerCase();
        if (!name.includes('macik') && !name.includes('maciek')) {
          userBatch.delete(doc(db, COLLECTIONS.users, d.id));
        }
      });
      await userBatch.commit();

      alert('Database wipe complete! Refreshing application...');
      window.location.reload();
    } catch (err) {
      console.error('Wipe failed:', err);
      alert('Failed to wipe database. Check console for details.');
    } finally {
      setIsWiping(false);
    }
  };

  const currentRank = getUserRank(user?.rankLevel);
  const nextRank = getNextRank(user?.rankLevel);
  const displayAvatar = user?.avatar || user?.discordAvatar || user?.steamAvatar;

  const displayRankTitle = user?.rankTitle || currentRank?.title || 'No Rank';
  const displayRankIcon = currentRank?.icon || '';
  const rankColor = user?.rankColor || currentRank?.color;

  if (!user) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='bg-background'>
          <Header />
          <main className='bg-background'>
            <Page>
              <div className='flex flex-col gap-4 lg:flex-row lg:justify-between mb-8'>
                <div>
                  <h1 className='text-xl font-semibold lg:text-2xl text-foreground'>Settings</h1>
                  <p className='text-sm text-muted-foreground'>Manage your profile, connections, and preferences.</p>
                </div>
              </div>
              <div className='text-center py-16'>
                <UserIcon className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-foreground mb-2'>Authentication Required</h3>
                <p className='text-muted-foreground mb-4'>Please log in to access your settings.</p>
                <Button onClick={() => {
                  const users = getUsers();
                  if (users.length === 0) {
                    const testUser = addUser({
                      username: 'testuser',
                      email: 'test@example.com',
                      displayName: 'Test User',
                      role: 'HR Staff',
                      department: 'HR',
                      isActive: true,
                      createdBy: 'System'
                    });
                    setCurrentUser(testUser.id);
                    window.location.reload();
                  } else {
                    setCurrentUser(users[0].id);
                    window.location.reload();
                  }
                }} className='bg-primary text-primary-foreground hover:bg-primary/90'>
                  Log In / Create Test User
                </Button>
              </div>
            </Page>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='bg-background'>
        <Header />
        <main className='bg-background'>
          <Page>
            <div className='flex flex-col gap-4 lg:flex-row lg:justify-between mb-8'>
              <div>
                <h1 className='text-xl font-semibold lg:text-2xl text-foreground'>Settings</h1>
                <p className='text-sm text-muted-foreground'>Manage your profile, connections, and preferences.</p>
              </div>
            </div>

            <div className='grid gap-6 lg:grid-cols-3'>
              {/* Profile Section */}
              <Card className='bg-card border-border lg:col-span-2'>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <UserIcon className='h-5 w-5' />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Avatar Section */}
                  <div className='flex items-center gap-4 p-2 rounded-lg'>
                    <div className='relative'>
                      {displayAvatar ? (
                        <img 
                          src={displayAvatar} 
                          alt={user.displayName} 
                          className='w-20 h-20 rounded-full object-cover'
                        />
                      ) : (
                        <div className='w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center'>
                          <UserIcon className='h-10 w-10 text-primary' />
                        </div>
                      )}
                      <Button
                        size='sm'
                        className='absolute bottom-0 right-0 bg-primary text-primary-foreground hover:bg-primary/90'
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAvatarDialogOpen(true);
                        }}
                      >
                        <CameraIcon className='h-3 w-3' />
                      </Button>
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold text-white'>{user.displayName}</h3>
                      <div className='mt-2 flex items-center gap-2 flex-wrap'>
                        {currentRank && (
                          <div
                            className='inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[9px] font-semibold border tracking-wider uppercase'
                            style={{
                              color: rankColor,
                              backgroundColor: `${rankColor}18`,
                              borderColor: `${rankColor}40`,
                            }}
                          >
                            {displayRankIcon && <span>{displayRankIcon}</span>}
                            <span>{displayRankTitle}</span>
                          </div>
                        )}
                        {user.role && user.role !== 'Driver' && (
                          <RoleBadge role={user.role} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='rounded-2xl overflow-hidden border border-border bg-slate-950/40'>
                    {user.coverImage ? (
                      <img src={user.coverImage} alt='banner preview' className='w-full h-40 object-cover' />
                    ) : (
                      <div className='flex h-40 items-center justify-center bg-slate-900 text-sm text-muted-foreground'>
                        No profile banner uploaded yet.
                      </div>
                    )}
                    <div className='flex items-center justify-between p-3 bg-background border-t border-border'>
                      <div>
                        <div className='text-sm font-medium text-foreground'>Profile Banner</div>
                        <div className='text-xs text-muted-foreground'>Upload an image or enter a banner URL.</div>
                      </div>
                      <Button size='sm' onClick={() => setIsCoverDialogOpen(true)} className='bg-primary text-primary-foreground hover:bg-primary/90'>
                        Update Banner
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Username Section */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-medium text-foreground'>Username</h4>
                      <p className='text-sm font-bold text-white'>{user.displayName || user.username}</p>
                    </div>
                    <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant='outline' className='bg-background border-border'>
                          <EditIcon className='mr-2 h-4 w-4' />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='bg-card border-border'>
                        <DialogHeader>
                          <DialogTitle className='text-foreground'>Profile Settings</DialogTitle>
                        </DialogHeader>
                        <div className='space-y-4'>
                          <div>
                            <label className='text-sm font-medium text-foreground block mb-2'>Display Name / Username</label>
                            <Input
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              placeholder='Enter custom username'
                              className='bg-background border-border'
                            />
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            This name will be shown on the dashboard and your menu.
                          </div>
                          <div className='flex space-x-2'>
                            <Button onClick={handleUsernameUpdate} className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'>
                              Update Username
                            </Button>
                            <Button onClick={() => setIsUsernameDialogOpen(false)} variant='outline' className='flex-1 bg-background border-border'>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>


                </CardContent>
              </Card>

            </div>

            {/* Connected Accounts */}
            <Card className='bg-card border-border mt-6'>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <LinkIcon className='h-5 w-5' />
                  Connected Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Discord */}
                <div className='flex items-center justify-between p-4 border border-border rounded-lg bg-accent/5'>
                  <div className='flex items-center gap-3'>
                    <div className='relative'>
                      {user.discordAvatar && user.discordUsername ? (
                        <img src={user.discordAvatar} className='h-8 w-8 rounded-full' />
                      ) : (
                        <MessageCircleIcon className='h-8 w-8 text-[#5865F2]' />
                      )}
                    </div>
                    <div>
                      <h4 className='font-medium text-foreground'>Discord</h4>
                      {user.discordUsername ? (
                        <p className='text-sm font-bold text-white'>Connected as {user.discordUsername}</p>
                      ) : (
                        <p className='text-sm text-muted-foreground'>Sign into EThub using your Discord account</p>
                      )}
                    </div>
                  </div>
                  {user.discordUsername ? (
                    <Button 
                      variant='destructive' 
                      onClick={handleDiscordDisconnect}
                      className='bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20'
                    >
                      <UnlinkIcon className='mr-2 h-4 w-4' />
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleDiscordConnect}
                      className='bg-[#5865F2] text-white hover:bg-[#4752C4]'
                    >
                      <MessageCircleIcon className='mr-2 h-4 w-4' />
                      Connect Discord
                    </Button>
                  )}
                </div>

                {/* Steam */}
                <div className='flex items-center justify-between p-4 border border-border rounded-lg bg-accent/5'>
                  <div className='flex items-center gap-3'>
                    <div className='relative'>
                      {user.steamAvatar && user.steamUsername ? (
                        <img src={user.steamAvatar} className='h-8 w-8 rounded-full' />
                      ) : (
                        <Gamepad2Icon className='h-8 w-8 text-[#1B2838] dark:text-white' />
                      )}
                    </div>
                    <div>
                      <h4 className='font-medium text-foreground'>Steam</h4>
                      {user.steamUsername ? (
                        <p className='text-sm font-bold text-white'>Connected as {user.steamUsername}</p>
                      ) : (
                        <p className='text-sm text-muted-foreground'>Sign into EThub using your Steam account</p>
                      )}
                    </div>
                  </div>
                  {user.steamUsername ? (
                    <Button
                      variant='destructive'
                      onClick={handleSteamDisconnect}
                      className='bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20'
                    >
                      <UnlinkIcon className='mr-2 h-4 w-4' />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSteamConnect}
                      className='bg-[#1B2838] text-white hover:bg-[#2A3F5F]'
                    >
                      <Gamepad2Icon className='mr-2 h-4 w-4' />
                      Connect Steam
                    </Button>
                  )}
                </div>

                {/* Trucky ID */}
                <div className='flex items-center justify-between p-4 border border-border rounded-lg bg-accent/5'>
                  <div className='flex items-center gap-3'>
                    <TruckIcon className='h-8 w-8 text-[#FF6B35]' />
                    <div>
                      <h4 className='font-medium text-foreground'>Trucky ID</h4>
                      {user.truckyId ? (
                        <p className='text-sm font-bold text-white'>{user.truckyId}</p>
                      ) : (
                        <p className='text-sm text-muted-foreground'>Enter your Trucky ID for accurate job tracking</p>
                      )}
                    </div>
                  </div>
                  <Dialog open={isTruckyIdDialogOpen} onOpenChange={setIsTruckyIdDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant='outline' className='bg-background border-border'>
                        <EditIcon className='mr-2 h-4 w-4' />
                        {user.truckyId ? 'Edit' : 'Add'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='bg-card border-border'>
                      <DialogHeader>
                        <DialogTitle className='text-foreground'>Trucky ID</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div>
                          <label className='text-sm font-medium text-foreground block mb-2'>Your Trucky ID</label>
                          <Input
                            value={newTruckyId}
                            onChange={(e) => setNewTruckyId(e.target.value)}
                            placeholder='Enter your Trucky driver ID'
                            className='bg-background border-border'
                          />
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Enter your Trucky ID to accurately match your jobs from the Trucky API. This ensures your profile shows only your actual completed jobs.
                        </div>
                        <div className='flex space-x-2'>
                          <Button onClick={handleTruckyIdUpdate} className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'>
                            Save
                          </Button>
                          <Button onClick={() => setIsTruckyIdDialogOpen(false)} variant='outline' className='flex-1 bg-background border-border'>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className='bg-card border-destructive/20 mt-6 border'>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2 text-destructive'>
                  <StarIcon className='h-5 w-5' />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium text-foreground'>Reset Application</h4>
                    <p className='text-sm text-muted-foreground'>
                      Clear your local session and cache. This fixes most login issues and refreshes all data from the database.
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    {isAdmin && (
                      <Button 
                        variant='destructive' 
                        onClick={handleWipeDatabase}
                        disabled={isWiping}
                        className='bg-red-900/50 text-red-200 border-red-800 hover:bg-red-800'
                      >
                        {isWiping ? 'Wiping...' : 'Wipe Central DB'}
                      </Button>
                    )}
                    <Button 
                      variant='destructive' 
                      onClick={handleResetApp}
                      className='bg-destructive text-white hover:bg-destructive/90'
                    >
                      Reset & Logout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avatar Upload Dialog */}
            <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
              <DialogContent className='bg-card border-border'>
                <DialogHeader>
                  <DialogTitle className='text-foreground'>Update Avatar</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <Button onClick={handleUseDiscordAvatar} disabled={!user?.discordAvatar} className='h-10'>
                      Use Discord Avatar
                    </Button>
                    <Button onClick={handleUseSteamAvatar} disabled={!user?.steamId || isLoading} className='h-10'>
                      {isLoading ? 'Fetching...' : 'Use Steam Avatar'}
                    </Button>
                    <div className='col-span-2'>
                      <label className='text-sm font-medium text-foreground block mb-2'>Avatar URL</label>
                      <Input
                        value={newAvatar}
                        onChange={(e) => setNewAvatar(e.target.value)}
                        placeholder='Enter avatar image URL'
                        className='bg-background border-border'
                      />
                    </div>
                    <div className='col-span-2'>
                      <input type='file' accept='image/*' onChange={handleAvatarFileUpload} className='w-full' />
                    </div>
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Pick an avatar source: Discord, Steam, upload a file, or enter an image URL.
                  </div>
                  <div className='flex space-x-2'>
                    <Button onClick={handleAvatarUpdate} disabled={isLoading} className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'>
                      {isLoading ? 'Updating...' : 'Update Avatar'}
                    </Button>
                    <Button onClick={() => setIsAvatarDialogOpen(false)} variant='outline' className='flex-1 bg-background border-border'>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCoverDialogOpen} onOpenChange={setIsCoverDialogOpen}>
              <DialogContent className='bg-card border-border'>
                <DialogHeader>
                  <DialogTitle className='text-foreground'>Update Banner</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Banner URL</label>
                    <Input
                      value={newCover}
                      onChange={(e) => setNewCover(e.target.value)}
                      placeholder='Enter banner image URL'
                      className='bg-background border-border'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>Upload Banner Image</label>
                    <input type='file' accept='image/*' onChange={handleCoverFileUpload} className='w-full' />
                  </div>
                  <div className='text-xs text-muted-foreground'>Upload a custom profile banner or point to an image URL. The selected banner will appear on your profile page.</div>
                  <div className='flex space-x-2'>
                    <Button onClick={handleCoverUpdate} disabled={isLoading} className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'>
                      {isLoading ? 'Updating...' : 'Save Banner'}
                    </Button>
                    <Button onClick={() => setIsCoverDialogOpen(false)} variant='outline' className='flex-1 bg-background border-border'>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
