import { useState } from 'react';
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
  ImageIcon
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
  RANKS,
  type UserEntry 
} from '@/lib/driver-storage';
import { getSteamPlayerSummary } from '@/lib/steam-ets2';
import { generateDiscordOAuthUrl, generateSteamOAuthUrl } from '@/lib/discord-auth';

export function SettingsPage() {
  const navigate = useNavigate();
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
  const [isLoading, setIsLoading] = useState(false);

  const [newAvatar, setNewAvatar] = useState('');
  const [newCover, setNewCover] = useState('');
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');

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

  const currentRank = getUserRank(user?.rankLevel);
  const nextRank = getNextRank(user?.rankLevel);
  const displayAvatar = user?.avatar || user?.discordAvatar || user?.steamAvatar;

  const displayRankTitle = user?.rankTitle || currentRank?.title || 'No Rank';
  const displayRankIcon = currentRank?.icon || '';

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
                      <p className='text-sm text-muted-foreground'>@{user.username}</p>
                      <Badge className='mt-2 bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest'>
                        {displayRankIcon} {displayRankTitle}
                      </Badge>
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
                      <p className='text-sm font-bold text-white'>@{user.username}</p>
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
