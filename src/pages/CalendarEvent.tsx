import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { fetchTruckersmpEvent } from '@/lib/truckersmp';
import { ClockIcon, MapPinIcon, GamepadIcon, GlobeIcon, PackageIcon, Share2Icon, ArrowLeftIcon, InfoIcon, CheckCircle2Icon, UsersIcon } from 'lucide-react';



export function CalendarEventPage() {
  const params = useParams();
  const eventId = useMemo(() => Number(params.id), [params.id]);

  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    setLoading(true);
    fetchTruckersmpEvent(eventId)
      .then(setEventData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <SidebarProvider open={false}>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main className='bg-[#0c0c0c] min-h-screen text-[#e0e0e0] p-6'>
          <Page>
            <div className='flex flex-col gap-8 max-w-5xl mx-auto'>
              {/* Back Button & Actions */}
              <div className='flex items-center justify-between'>
                <Button asChild variant='ghost' className='text-muted-foreground hover:text-foreground gap-2 h-8 px-0'>
                  <Link to='/calendar'>
                    <ArrowLeftIcon className='size-4' />
                    Back to Schedule
                  </Link>
                </Button>
                
                <div className='flex items-center gap-3'>
                  <Button variant='outline' className='bg-[#8be9fd]/10 text-[#8be9fd] border-[#8be9fd]/20 hover:bg-[#8be9fd]/20 h-8 gap-2 uppercase text-[10px] font-bold tracking-widest'>
                    <Share2Icon className='size-3' />
                    Share
                  </Button>
                  <Button asChild className='bg-[#ff79c6] text-white hover:bg-[#ff79c6]/90 h-8 gap-2 uppercase text-[10px] font-bold tracking-widest'>
                    <a href={`https://truckersmp.com/events/${eventId}`} target='_blank' rel='noreferrer'>
                      Open TMP
                    </a>
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className='flex items-center justify-center h-64 text-muted-foreground font-medium'>
                  <div className='animate-pulse'>Fetching event details...</div>
                </div>
              ) : error ? (
                <div className='rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center'>
                  <h3 className='text-destructive font-bold mb-2'>Error</h3>
                  <p className='text-muted-foreground text-sm'>{error}</p>
                </div>
              ) : !eventData ? (
                <div className='text-center p-12 text-muted-foreground'>Event not found.</div>
              ) : (
                <div className='grid gap-8 lg:grid-cols-[1fr_360px]'>
                  {/* Left Column: Banner & Info */}
                  <div className='flex flex-col gap-8'>
                    <div className='relative group'>
                      <div className='absolute -inset-0.5 bg-gradient-to-r from-[#ff79c6] to-[#bd93f9] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000'></div>
                      <img
                        src={eventData.banner || 'https://via.placeholder.com/1200x600?text=No+Banner'}
                        alt={eventData.name}
                        className='relative rounded-2xl aspect-[21/9] w-full object-cover border border-white/10'
                      />
                    </div>

                    <div className='space-y-4'>
                      <div className='flex items-center gap-2 text-[#ff79c6] font-bold text-[10px] uppercase tracking-[0.2em]'>
                        <span className='size-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(255,121,198,0.8)]' />
                        {eventData.event_type.name}
                      </div>
                      <h1 className='text-3xl font-black tracking-tight lg:text-4xl text-white'>
                        {eventData.name}
                      </h1>
                    </div>

                    <div className='grid gap-4 sm:grid-cols-2'>
                      <div className='rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4'>
                        <div className='flex items-center gap-3 text-white'>
                          <div className='size-8 rounded-xl bg-[#50fa7b]/10 flex items-center justify-center text-[#50fa7b]'>
                            <ClockIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Time</div>
                            <div className='text-sm font-bold'>
                              {new Date(eventData.start_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })} UTC
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3 text-white'>
                          <div className='size-8 rounded-xl bg-[#8be9fd]/10 flex items-center justify-center text-[#8be9fd]'>
                            <MapPinIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Start Location</div>
                            <div className='text-sm font-bold'>{eventData.departure.city} ({eventData.departure.location})</div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3 text-white'>
                          <div className='size-8 rounded-xl bg-[#bd93f9]/10 flex items-center justify-center text-[#bd93f9]'>
                            <GamepadIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Game</div>
                            <div className='text-sm font-bold'>{eventData.game === 'euro-truck-simulator-2' ? 'ETS2' : 'ATS'}</div>
                          </div>
                        </div>
                      </div>

                      <div className='rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4'>
                        <div className='flex items-center gap-3 text-white'>
                          <div className='size-8 rounded-xl bg-[#ffb86c]/10 flex items-center justify-center text-[#ffb86c]'>
                            <GlobeIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Server</div>
                            <div className='text-sm font-bold'>{eventData.server.name}</div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3 text-white'>
                          <div className='size-8 rounded-xl bg-[#ff5555]/10 flex items-center justify-center text-[#ff5555]'>
                            <MapPinIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Destination</div>
                            <div className='text-sm font-bold'>{eventData.arrive.city} ({eventData.arrive.location})</div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3 text-white'>
                          <div className='size-8 rounded-xl bg-[#f1fa8c]/10 flex items-center justify-center text-[#f1fa8c]'>
                            <PackageIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>DLC Required</div>
                            <div className='text-sm font-bold'>{eventData.dlc?.name || 'None'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='rounded-2xl border border-white/5 bg-white/[0.02] p-8'>
                      <div className='flex items-center gap-2 text-white font-bold mb-6'>
                        <InfoIcon className='size-4 text-[#bd93f9]' />
                        Description
                      </div>
                      <div className='text-sm leading-relaxed text-muted-foreground whitespace-pre-line'>
                        {eventData.description}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Convoy Info */}
                  <div className='flex flex-col gap-6'>
                    <div className='rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 space-y-6 sticky top-6'>
                      <div>
                        <h3 className='text-lg font-bold text-white mb-1'>Event Participation</h3>
                        <p className='text-xs text-muted-foreground'>Official TruckersMP information</p>
                      </div>

                      <div className='space-y-4'>
                        <div className='flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5'>
                          <div className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Attendance</div>
                          <div className='text-sm font-black text-[#ff79c6]'>{eventData.ups}</div>
                        </div>
                        <div className='p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2'>
                          <div className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Event Link</div>
                          <a 
                            href={`https://truckersmp.com/events/${eventId}`} 
                            target='_blank' 
                            rel='noreferrer'
                            className='text-xs font-medium text-[#8be9fd] hover:underline block truncate'
                          >
                            truckersmp.com/events/{eventId}
                          </a>
                        </div>
                      </div>

                      <div className='pt-4 border-t border-white/5'>
                        <div className='flex items-center gap-2 mb-4'>
                          <UsersIcon className='size-3 text-muted-foreground' />
                          <span className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Event Team</span>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center'>
                            <img src={eventData.vtc?.logo} className='size-6 rounded-md' alt='' />
                          </div>
                          <div>
                            <div className='text-xs font-bold text-white'>{eventData.vtc?.name || 'Community Event'}</div>
                            <div className='text-[10px] text-muted-foreground'>Organizer</div>
                          </div>
                        </div>
                      </div>

                      <div className='pt-2'>
                        <div className='flex items-center gap-2 mb-4'>
                          <CheckCircle2Icon className='size-3 text-[#50fa7b]' />
                          <span className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Quick Actions</span>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                          <Button variant='outline' size='sm' className='h-8 text-[9px] font-bold uppercase bg-white/5 border-white/10'>Reminder</Button>
                          <Button variant='outline' size='sm' className='h-8 text-[9px] font-bold uppercase bg-white/5 border-white/10'>Route</Button>
                        </div>
                      </div>
                    </div>
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

