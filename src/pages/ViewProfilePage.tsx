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
import { cn } from '@/lib/utils';
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
  BriefcaseIcon,
  InfoIcon,
  LayoutGridIcon,
  ChevronRightIcon
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
  const [user] = useState<UserEntry | null>(() => {
    try {
      if (userId) {
        return getUsers().find(u => u.id === userId) || null;
      }
      return getCurrentUser();
    } catch (e) {
      console.error('State init error:', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<TruckyJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'info'>('jobs');

  const COMPANY_ID = 44349;

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
      
      const result = await Promise.race([jobsPromise, timeoutPromise]) as Awaited<typeof jobsPromise>;
      setJobs(result.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobsError('Failed to load jobs from Trucky API');
    } finally {
      setJobsLoading(false);
    }
  };

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
    }, 5000); 

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

  try {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='bg-background'>
          <Header />
          <main className='bg-background'>
            <Page>
              <div className='flex items-center gap-4 mb-4'>
                <Button 
                  variant='outline' 
                  onClick={() => navigate(-1)}
                  className='bg-background border-border shadow-sm'
                >
                  <ArrowLeftIcon className='mr-2 h-4 w-4' />
                  Back
                </Button>
              </div>

              {/* Premium Header Banner */}
              <div className='relative mb-8 rounded-2xl overflow-hidden border border-white/5 shadow-2xl'>
                <div className='h-[350px] relative'>
                  <img 
                    src={user.coverImage || 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop'} 
                    alt='Cover' 
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent'></div>
                  
                  {!userId && (
                    <div className='absolute top-4 right-4 flex gap-2'>
                      <Button onClick={() => navigate('/settings')} size='sm' variant='secondary' className='bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border-white/10'>
                        <EditIcon className='h-3 w-3 mr-2' />
                        Edit Cover
                      </Button>
                    </div>
                  )}
                </div>

                <div className='absolute bottom-0 left-0 right-0 p-8 pt-0'>
                  <div className='flex flex-col md:flex-row items-end gap-6'>
                    <div className='relative -mb-12 md:-mb-16'>
                      <div className='p-1.5 bg-background rounded-full shadow-2xl'>
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.displayName} 
                            className='w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/5 object-cover'
                          />
                        ) : (
                          <div className='w-32 h-32 md:w-40 md:h-40 rounded-full bg-primary/20 flex items-center justify-center'>
                            <UserIcon className='h-16 w-16 text-primary' />
                          </div>
                        )}
                      </div>
                      {currentRank && (
                        <div className='absolute bottom-2 right-2'>
                          <Badge className='px-3 py-1 text-xs font-bold uppercase shadow-lg border-2 border-background' style={{ backgroundColor: currentRank.color, color: 'white' }}>
                            {currentRank.title}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className='flex-1 pb-4 pt-4 md:pt-0'>
                      <div className='flex items-center gap-3'>
                        <h1 className='text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]'>{user.displayName}</h1>
                        {currentRank && (
                          <Badge className='bg-primary text-white border-none font-bold px-3 py-1 text-sm'>
                            LVL {currentRank.level}
                          </Badge>
                        )}
                      </div>
                      <div className='flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-white/90 font-medium drop-shadow-sm'>
                        <span className='font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 text-sm'># ID: {user.id.slice(-4)}</span>
                        <span className='flex items-center gap-2 text-sm'>
                          <CalendarIcon className='h-4 w-4' />
                          Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className='flex gap-3 pb-4'>
                      <div className='flex gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10'>
                        <div className='p-2 bg-white/5 rounded-lg border border-white/5'>
                          <MessageCircleIcon className={`h-5 w-5 ${user.discordUsername ? 'text-[#5865F2]' : 'text-white/20'}`} />
                        </div>
                        <div className='p-2 bg-white/5 rounded-lg border border-white/5'>
                          <Gamepad2Icon className={`h-5 w-5 ${user.steamUsername ? 'text-white' : 'text-white/20'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className='flex items-center gap-8 mb-8 border-b border-border/50 mt-16 md:mt-20'>
                <button 
                  onClick={() => setActiveTab('jobs')}
                  className={cn(
                    'pb-4 text-sm font-bold transition-all relative flex items-center gap-2',
                    activeTab === 'jobs' ? 'text-white' : 'text-muted-foreground hover:text-white'
                  )}
                >
                  <BriefcaseIcon className='h-4 w-4' />
                  Jobs
                  <span className='bg-muted px-1.5 py-0.5 rounded text-[10px] font-black'>{jobs.length}</span>
                  {activeTab === 'jobs' && (
                    <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full' />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    'pb-4 text-sm font-bold transition-all relative flex items-center gap-2',
                    activeTab === 'info' ? 'text-white' : 'text-muted-foreground hover:text-white'
                  )}
                >
                  <InfoIcon className='h-4 w-4' />
                  Info
                  {activeTab === 'info' && (
                    <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full' />
                  )}
                </button>
              </div>

              {activeTab === 'jobs' ? (
                <div className='space-y-6'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                      <LayoutGridIcon className='h-5 w-5 text-primary' />
                      Recent Deliveries
                    </h3>
                    <p className='text-xs text-muted-foreground font-medium'>
                      *Showing last 5 jobs
                    </p>
                  </div>

                  {jobsLoading ? (
                    <div className='grid gap-4 md:grid-cols-2'>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className='h-32 bg-card/50 rounded-2xl animate-pulse border border-border/50' />
                      ))}
                    </div>
                  ) : jobsError ? (
                    <div className='text-center py-20 bg-card/30 rounded-2xl border border-dashed border-border'>
                      <BriefcaseIcon className='h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20' />
                      <p className='text-muted-foreground font-medium mb-4'>{jobsError}</p>
                      <Button onClick={loadJobs} variant='outline'>Retry Sync</Button>
                    </div>
                  ) : jobs.length > 0 ? (
                    <div className='grid gap-4 md:grid-cols-2'>
                      {jobs.map((job) => (
                        <div key={job.id} className='group p-5 bg-card/40 hover:bg-card/60 transition-all rounded-2xl border border-white/5 hover:border-primary/30 shadow-sm relative overflow-hidden'>
                          <div className='flex items-start justify-between relative z-10'>
                            <div className='space-y-1'>
                              <h4 className='font-bold text-lg text-white group-hover:text-primary transition-colors'>{job.cargo_name}</h4>
                              <p className='text-sm text-muted-foreground flex items-center gap-2'>
                                <span className='text-white/60'>{job.source_city_name}</span>
                                <ChevronRightIcon className='h-3 w-3' />
                                <span className='text-white/60'>{job.destination_city_name}</span>
                              </p>
                              <div className='flex items-center gap-3 mt-4'>
                                <Badge variant='secondary' className='bg-white/5 text-[10px] font-black uppercase tracking-wider'>
                                  {(job.real_distance_km || 0).toLocaleString()} KM
                                </Badge>
                                <Badge variant='secondary' className='bg-white/5 text-[10px] font-black uppercase tracking-wider text-primary'>
                                  €{job.revenue?.toLocaleString() || '0'}
                                </Badge>
                              </div>
                            </div>
                            <Badge className={cn(
                              'text-[10px] font-black uppercase tracking-widest px-2 py-1',
                              job.status === 'completed' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            )}>
                              {job.status}
                            </Badge>
                          </div>
                          <div className='absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity' />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-20 bg-card/30 rounded-2xl border border-dashed border-border'>
                      <BriefcaseIcon className='h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20' />
                      <p className='text-muted-foreground font-medium'>No jobs logged for this member yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className='grid gap-6 lg:grid-cols-3'>
                  <div className='lg:col-span-2 space-y-6'>
                    <Card className='bg-card/40 border-white/5 overflow-hidden rounded-2xl'>
                      <CardHeader className='pb-4'>
                        <CardTitle className='text-lg font-bold flex items-center gap-2'>
                          <UserIcon className='h-5 w-5 text-primary' />
                          Member Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-8'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                          <div className='space-y-1'>
                            <p className='text-xs font-black uppercase tracking-widest text-muted-foreground'>Login Handle</p>
                            <p className='text-lg font-bold text-white'>@{user.username}</p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs font-black uppercase tracking-widest text-muted-foreground'>Email Address</p>
                            <p className='text-lg font-bold text-white'>{user.email}</p>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs font-black uppercase tracking-widest text-muted-foreground'>VTC Rank</p>
                            <Badge className='bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase tracking-widest'>
                              {user.role}
                            </Badge>
                          </div>
                          <div className='space-y-1'>
                            <p className='text-xs font-black uppercase tracking-widest text-muted-foreground'>Department</p>
                            <Badge className='bg-purple-500/10 text-purple-500 border-purple-500/20 font-black uppercase tracking-widest'>
                              {user.department}
                            </Badge>
                          </div>
                        </div>

                        <Separator className='bg-white/5' />

                        <div className='space-y-4'>
                          <h4 className='text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2'>
                            <ShieldIcon className='h-4 w-4 text-primary' />
                            Driver Permissions
                          </h4>
                          <div className='flex flex-wrap gap-2'>
                            <Badge variant='outline' className='border-white/10 text-white/60'>Convoy Management</Badge>
                            <Badge variant='outline' className='border-white/10 text-white/60'>Job Logging</Badge>
                            <Badge variant='outline' className='border-white/10 text-white/60'>VTC Statistics</Badge>
                            <Badge variant='outline' className='border-white/10 text-white/60'>Member Access</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className='bg-card/40 border-white/5 overflow-hidden rounded-2xl'>
                      <CardHeader>
                        <CardTitle className='text-lg font-bold flex items-center gap-2'>
                          <MessageCircleIcon className='h-5 w-5 text-primary' />
                          External Connections
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div className='flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5'>
                            <div className='relative'>
                              <div className='p-3 bg-[#5865F2]/10 rounded-lg'>
                                <MessageCircleIcon className='h-6 w-6 text-[#5865F2]' />
                              </div>
                              {user.discordAvatar && (
                                <img 
                                  src={user.discordAvatar} 
                                  className='absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background' 
                                  alt='Discord Avatar' 
                                />
                              )}
                            </div>
                            <div>
                              <p className='text-xs font-black uppercase tracking-widest text-muted-foreground'>Discord</p>
                              <p className='font-bold text-white'>{user.discordUsername || 'Not Linked'}</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5'>
                            <div className='p-3 bg-white/10 rounded-lg'>
                              <Gamepad2Icon className='h-6 w-6 text-white' />
                            </div>
                            <div>
                              <p className='text-xs font-black uppercase tracking-widest text-muted-foreground'>Steam</p>
                              <p className='font-bold text-white'>{user.steamUsername || 'Not Linked'}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className='space-y-6'>
                    <Card className='bg-card/40 border-white/5 overflow-hidden rounded-2xl'>
                      <CardHeader>
                        <CardTitle className='text-lg font-bold flex items-center gap-2'>
                          <TrophyIcon className='h-5 w-5 text-amber-500' />
                          Experience
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-6'>
                        {currentRank && (
                          <div className='text-center py-4'>
                            <div className='text-6xl mb-4 drop-shadow-xl'>{currentRank.icon}</div>
                            <h3 className='text-2xl font-black uppercase tracking-tighter' style={{ color: currentRank.color }}>
                              {currentRank.title}
                            </h3>
                            <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1'>Member Level {currentRank.level}</p>
                          </div>
                        )}
                        
                        {nextRank && (
                          <div className='p-4 bg-white/5 rounded-xl border border-white/5'>
                            <p className='text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3'>Next Milestone</p>
                            <div className='flex items-center gap-3'>
                              <span className='text-3xl'>{nextRank.icon}</span>
                              <div>
                                <p className='font-bold text-white'>{nextRank.title}</p>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>Level {nextRank.level}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </Page>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  } catch (error) {
    console.error('Profile render error:', error);
    return (
      <div className='flex items-center justify-center min-h-screen bg-background text-foreground p-8 text-center'>
        <div>
          <h2 className='text-2xl font-bold mb-4'>Something went wrong loading your profile.</h2>
          <p className='text-muted-foreground mb-6'>Please try refreshing or check your settings.</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }
}
