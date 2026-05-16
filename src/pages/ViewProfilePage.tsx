import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  UserIcon, 
  CalendarIcon, 
  TrophyIcon,
  StarIcon,
  MessageCircleIcon,
  Gamepad2Icon,
  ShieldIcon,
  ArrowLeftIcon,
  EditIcon,
  BriefcaseIcon
} from 'lucide-react';
import { 
  getUsers, 
  getUserRank, 
  getNextRank, 
  getCurrentUser,
  RANKS,
  type UserEntry 
} from '@/lib/driver-storage';
import { fetchTruckyJobsPage, type TruckyJob } from '@/lib/trucky';

export function ViewProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<TruckyJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const COMPANY_ID = 44349; // Same company ID as JobsPage

  useEffect(() => {
    const loadUser = () => {
      setLoading(true);
      
      if (userId) {
        // Load specific user by ID
        const users = getUsers();
        const foundUser = users.find(u => u.id === userId);
        setUser(foundUser || null);
      } else {
        // Load current user if no userId provided
        const currentUser = getCurrentUser();
        setUser(currentUser);
      }
      
      setLoading(false);
    };

    loadUser();
  }, [userId]);

  const currentRank = getUserRank(user?.rankLevel);
  const nextRank = getNextRank(user?.rankLevel);

  // Load jobs from Trucky API
  const loadJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 10000)
      );
      
      const jobsPromise = fetchTruckyJobsPage(COMPANY_ID, 1, 5);
      
      const result = await Promise.race([jobsPromise, timeoutPromise]) as any;
      setJobs(result.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobsError('Failed to load jobs from Trucky API');
    } finally {
      setJobsLoading(false);
    }
  };

  // Load jobs when user is loaded
  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='bg-background'>
          <Header />
          <main className='bg-background'>
            <Page>
              <div className='text-center py-16'>
                <UserIcon className='h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse' />
                <p className='text-muted-foreground'>Loading profile...</p>
                <Button 
                  onClick={() => {
                    setLoading(false);
                    navigate(-1);
                  }} 
                  variant='outline' 
                  className='mt-4 bg-background border-border'
                >
                  Go Back
                </Button>
              </div>
            </Page>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!user) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='bg-background'>
          <Header />
          <main className='bg-background'>
            <Page>
              <div className='text-center py-16'>
                <UserIcon className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-foreground mb-2'>Profile Not Found</h3>
                <p className='text-muted-foreground mb-4'>The user profile you're looking for doesn't exist.</p>
                <Button onClick={() => navigate(-1)} className='bg-primary text-primary-foreground hover:bg-primary/90'>
                  <ArrowLeftIcon className='mr-2 h-4 w-4' />
                  Go Back
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
            <div className='flex items-center gap-4 mb-8'>
              <Button 
                variant='outline' 
                onClick={() => navigate(-1)}
                className='bg-background border-border'
              >
                <ArrowLeftIcon className='mr-2 h-4 w-4' />
                Back
              </Button>
              <div>
                <h1 className='text-xl font-semibold lg:text-2xl text-foreground'>Profile</h1>
                <p className='text-sm text-muted-foreground'>View user profile information</p>
              </div>
            </div>

            <div className='grid gap-6 lg:grid-cols-3'>
              {/* Main Profile Card */}
              <Card className='bg-card border-border lg:col-span-2'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      <UserIcon className='h-5 w-5' />
                      Profile Information
                    </CardTitle>
                    {!userId && (
                      <Button 
                        variant='outline' 
                        onClick={() => navigate('/settings')}
                        className='bg-background border-border'
                      >
                        <EditIcon className='mr-2 h-4 w-4' />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Banner with Profile Info */}
                  <div className='relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white'>
                    <div className='flex items-center'>
                      <div className='flex-1'>
                        <h1 className='text-3xl font-bold text-white'>{user.username}</h1>
                        <div className='flex items-center gap-2 mt-1'>
                          <span className='text-white/80'>Profile -</span>
                          {currentRank && (
                            <span className='px-3 py-1 bg-white/20 rounded-full text-sm font-medium' style={{ 
                              backgroundColor: currentRank?.color + '30', 
                              color: 'white'
                            }}>
                              {currentRank?.icon} {currentRank?.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className='space-y-4 mt-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <h4 className='text-sm font-medium text-muted-foreground'>Username</h4>
                        <p className='text-foreground'>@{user.username}</p>
                      </div>
                      <div>
                        <h4 className='text-sm font-medium text-muted-foreground'>Email</h4>
                        <p className='text-foreground'>{user.email}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-muted-foreground'>Member Since</h4>
                      <p className='text-foreground'>{new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div className='border-t border-border pt-4'>
                      <p className='text-muted-foreground text-sm'>------------------------------</p>
                    </div>
                  </div>

                  {/* Newest Jobs Section */}
                  <div className='space-y-4'>
                    <h3 className='font-medium text-foreground'>Newest Jobs from &lt;{user.username}&gt;</h3>
                    {jobsLoading ? (
                      <div className='space-y-3'>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className='p-4 border border-border rounded-lg animate-pulse'>
                            <div className='space-y-2'>
                              <div className='h-4 bg-muted rounded w-1/3'></div>
                              <div className='h-3 bg-muted rounded w-1/2'></div>
                              <div className='h-3 bg-muted rounded w-1/4'></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : jobsError ? (
                      <div className='text-center py-8 p-4 border border-border rounded-lg'>
                        <BriefcaseIcon className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
                        <h4 className='font-medium text-foreground mb-2'>Unable to Load Jobs</h4>
                        <p className='text-sm text-muted-foreground mb-4'>
                          {jobsError}
                        </p>
                        <Button onClick={loadJobs} className='bg-primary text-primary-foreground hover:bg-primary/90'>
                          Retry
                        </Button>
                      </div>
                    ) : jobs.length > 0 ? (
                      <div className='space-y-3'>
                        {jobs.map((job) => (
                          <div key={job.id} className='p-4 border border-border rounded-lg'>
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <h4 className='font-medium text-foreground'>{job.cargo_name}</h4>
                                <p className='text-sm text-muted-foreground'>
                                  {job.source_city_name} to {job.destination_city_name} • {job.real_distance_km.toLocaleString()} km
                                </p>
                                <p className='text-xs text-muted-foreground mt-1'>
                                  €{job.revenue?.toLocaleString() || '0'} • Started: {new Date(job.created_at).toLocaleString()}
                                </p>
                                {job.stop_date && (
                                  <p className='text-xs text-muted-foreground mt-1'>
                                    Ended: {new Date(job.stop_date).toLocaleString()}
                                  </p>
                                )}
                                {job.driver && (
                                  <p className='text-xs text-muted-foreground mt-1'>
                                    Driver: {job.driver.name}
                                  </p>
                                )}
                              </div>
                              <Badge className={
                                job.status === 'completed' 
                                  ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                                  : job.status === 'in_progress'
                                  ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
                                  : 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'
                              }>
                                {job.status === 'completed' ? 'Completed' : 
                                 job.status === 'in_progress' ? 'In Progress' : 
                                 job.status === 'available' ? 'Available' : job.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <p className='text-xs text-muted-foreground'>
                          *Jobs are loaded from Trucky API • Showing 5 most recent jobs
                        </p>
                      </div>
                    ) : (
                      <div className='text-center py-8 p-4 border border-border rounded-lg'>
                        <BriefcaseIcon className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
                        <h4 className='font-medium text-foreground mb-2'>No Jobs Available</h4>
                        <p className='text-sm text-muted-foreground mb-4'>
                          No jobs found from Trucky API. Check back later for new jobs.
                        </p>
                        <Button onClick={loadJobs} className='bg-primary text-primary-foreground hover:bg-primary/90'>
                          Refresh Jobs
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  
                  {/* Role and Department */}
                  <div className='space-y-4'>
                    <h3 className='font-medium text-foreground'>Role Information</h3>
                    <div className='grid gap-3 md:grid-cols-2'>
                      <div className='flex items-center gap-3'>
                        <ShieldIcon className='h-5 w-5 text-muted-foreground' />
                        <div>
                          <p className='text-sm font-medium text-foreground'>Role</p>
                          <Badge className='bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <ShieldIcon className='h-5 w-5 text-muted-foreground' />
                        <div>
                          <p className='text-sm font-medium text-foreground'>Department</p>
                          <Badge className='bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30'>
                            {user.department}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Information */}
                  <div className='space-y-4'>
                    <h3 className='font-medium text-foreground'>Account Information</h3>
                    <div className='grid gap-3 md:grid-cols-2'>
                      <div className='flex items-center gap-3'>
                        <CalendarIcon className='h-5 w-5 text-muted-foreground' />
                        <div>
                          <p className='text-sm font-medium text-foreground'>Member Since</p>
                          <p className='text-sm text-muted-foreground'>
                            {new Date(user.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      {user.lastLogin && (
                        <div className='flex items-center gap-3'>
                          <CalendarIcon className='h-5 w-5 text-muted-foreground' />
                          <div>
                            <p className='text-sm font-medium text-foreground'>Last Login</p>
                            <p className='text-sm text-muted-foreground'>
                              {new Date(user.lastLogin).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Connected Accounts */}
              <Card className='bg-card border-border'>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <MessageCircleIcon className='h-5 w-5' />
                    Connected Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Discord */}
                  <div className='flex items-center gap-3 p-3 border border-border rounded-lg'>
                    <MessageCircleIcon className='h-8 w-8 text-[#5865F2]' />
                    <div className='flex-1'>
                      <h4 className='font-medium text-foreground'>Discord</h4>
                      {user.discordUsername ? (
                        <p className='text-sm text-muted-foreground'>{user.discordUsername}</p>
                      ) : (
                        <p className='text-sm text-muted-foreground'>Not connected</p>
                      )}
                    </div>
                    {user.discordUsername && (
                      <Badge className='bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'>
                        Connected
                      </Badge>
                    )}
                  </div>

                  {/* Steam */}
                  <div className='flex items-center gap-3 p-3 border border-border rounded-lg'>
                    <Gamepad2Icon className='h-8 w-8 text-[#1B2838]' />
                    <div className='flex-1'>
                      <h4 className='font-medium text-foreground'>Steam</h4>
                      {user.steamUsername ? (
                        <p className='text-sm text-muted-foreground'>{user.steamUsername}</p>
                      ) : (
                        <p className='text-sm text-muted-foreground'>Not connected</p>
                      )}
                    </div>
                    {user.steamUsername && (
                      <Badge className='bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'>
                        Connected
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rank Progress */}
              <Card className='bg-card border-border'>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <TrophyIcon className='h-5 w-5' />
                    Rank Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {currentRank && (
                    <div className='text-center'>
                      <div className='text-5xl mb-2'>{currentRank.icon}</div>
                      <h3 className='font-semibold text-foreground' style={{ color: currentRank.color }}>
                        {currentRank.title}
                      </h3>
                      <p className='text-sm text-muted-foreground'>Level {currentRank.level}</p>
                    </div>
                  )}

                  {nextRank && (
                    <>
                      <Separator />
                      <div>
                        <h4 className='font-medium text-foreground mb-2'>Next Rank</h4>
                        <div className='flex items-center gap-2'>
                          <span className='text-3xl'>{nextRank.icon}</span>
                          <div>
                            <p className='font-medium text-foreground' style={{ color: nextRank.color }}>
                              {nextRank.title}
                            </p>
                            <p className='text-xs text-muted-foreground'>Level {nextRank.level}</p>
                          </div>
                        </div>
                        <div className='mt-2 space-y-1'>
                          {nextRank.requirements?.map((req, index) => (
                            <div key={index} className='text-xs text-muted-foreground flex items-center gap-1'>
                              <StarIcon className='h-3 w-3' />
                              {req}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div>
                    <h4 className='font-medium text-foreground mb-2'>All Ranks</h4>
                    <div className='space-y-2 max-h-48 overflow-y-auto'>
                      {RANKS.map((rank) => (
                        <div 
                          key={rank.level} 
                          className={`flex items-center gap-2 p-2 rounded ${
                            rank.level === currentRank?.level ? 'bg-primary/10' : ''
                          }`}
                        >
                          <span className='text-lg'>{rank.icon}</span>
                          <div className='flex-1'>
                            <p className='text-sm font-medium text-foreground' style={{ color: rank.color }}>
                              {rank.title}
                            </p>
                            <p className='text-xs text-muted-foreground'>Level {rank.level}</p>
                          </div>
                          {rank.level === currentRank?.level && (
                            <Badge className='bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'>
                              Current
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
