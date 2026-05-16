import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { fetchTruckersmpEvent, type TruckersmpEvent } from '@/lib/truckersmp';
import { ClockIcon, MapPinIcon, GamepadIcon, GlobeIcon, PackageIcon, Share2Icon, ArrowLeftIcon, InfoIcon, UsersIcon, CheckCircle2Icon } from 'lucide-react';



export function CalendarEventPage() {
  const params = useParams();
  const eventId = useMemo(() => Number(params.id), [params.id]);

  const [eventData, setEventData] = useState<TruckersmpEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    fetchTruckersmpEvent(eventId)
      .then(setEventData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main className='bg-background min-h-screen text-foreground p-6'>
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
                  <Button variant='outline' className='h-8 gap-2 uppercase text-[10px] font-bold tracking-widest'>
                    <Share2Icon className='size-3' />
                    Share
                  </Button>
                  <Button asChild className='h-8 gap-2 uppercase text-[10px] font-bold tracking-widest'>
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
                      <div className='flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]'>
                        <span className='size-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(168,85,247,0.4)]' />
                        {eventData.event_type?.name || 'Convoy'}
                      </div>
                      <h1 className='text-3xl font-black tracking-tight lg:text-4xl'>
                        {eventData.name}
                      </h1>
                    </div>

                    <div className='grid gap-4 sm:grid-cols-2'>
                      <Card className='p-6 space-y-4 shadow-sm border-muted'>
                        <div className='flex items-center gap-3'>
                          <div className='size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary'>
                            <ClockIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Time</div>
                            <div className='text-sm font-bold'>
                              {eventData.start_at ? new Date(eventData.start_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBD'} UTC
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500'>
                            <MapPinIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Start Location</div>
                            <div className='text-sm font-bold'>{eventData.departure?.city || 'TBD'} {eventData.departure?.location ? `(${eventData.departure.location})` : ''}</div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='size-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500'>
                            <GamepadIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Game</div>
                            <div className='text-sm font-bold'>{eventData.game?.includes('truck') ? (eventData.game.includes('euro') ? 'ETS2' : 'ATS') : (eventData.game || 'ETS2')}</div>
                          </div>
                        </div>
                      </Card>

                      <Card className='p-6 space-y-4 shadow-sm border-muted'>
                        <div className='flex items-center gap-3'>
                          <div className='size-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500'>
                            <GlobeIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Server</div>
                            <div className='text-sm font-bold'>{eventData.server?.name || 'TBD'}</div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='size-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500'>
                            <MapPinIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Destination</div>
                            <div className='text-sm font-bold'>{(eventData.arrival?.city || eventData.arrive?.city) || 'TBD'} {(eventData.arrival?.location || eventData.arrive?.location) ? `(${(eventData.arrival?.location || eventData.arrive?.location)})` : ''}</div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='size-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500'>
                            <PackageIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>DLC Required</div>
                            <div className='text-sm font-bold'>{eventData.dlc?.name || 'None'}</div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className='p-8 shadow-sm border-muted'>
                      <div className='flex items-center gap-2 font-bold mb-6'>
                        <InfoIcon className='size-4 text-primary' />
                        Description
                      </div>
                      <div className='text-sm leading-relaxed text-muted-foreground whitespace-pre-line'>
                        {eventData.description || 'No description provided.'}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column: Convoy Info */}
                  <div className='flex flex-col gap-6'>
                    <Card className='p-6 space-y-6 sticky top-6 shadow-sm border-muted'>
                      <div>
                        <CardTitle className='text-lg font-bold mb-1'>Event Participation</CardTitle>
                        <p className='text-xs text-muted-foreground'>Official TruckersMP information</p>
                      </div>

                      <div className='space-y-4'>
                        <div className='flex items-center justify-between p-3 rounded-xl bg-muted/50 border'>
                          <div className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Attendance</div>
                          <div className='text-sm font-black text-primary'>{eventData.ups || 0}</div>
                        </div>
                        <div className='p-3 rounded-xl bg-muted/50 border space-y-2'>
                          <div className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Event Link</div>
                          <a 
                            href={`https://truckersmp.com/events/${eventId}`} 
                            target='_blank' 
                            rel='noreferrer'
                            className='text-xs font-medium text-primary hover:underline block truncate'
                          >
                            truckersmp.com/events/{eventId}
                          </a>
                        </div>
                      </div>

                      <div className='pt-4 border-t'>
                        <div className='flex items-center gap-2 mb-4'>
                          <UsersIcon className='size-3 text-muted-foreground' />
                          <span className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Event Team</span>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='size-10 rounded-xl bg-muted border flex items-center justify-center overflow-hidden'>
                            {eventData.vtc?.logo ? (
                              <img src={eventData.vtc.logo} className='size-full object-cover' alt='' />
                            ) : (
                              <UsersIcon className='size-5 text-muted-foreground/30' />
                            )}
                          </div>
                          <div>
                            <div className='text-xs font-bold'>{eventData.vtc?.name || 'Community Event'}</div>
                            <div className='text-[10px] text-muted-foreground'>Organizer</div>
                          </div>
                        </div>
                      </div>

                      <div className='pt-2'>
                        <div className='flex items-center gap-2 mb-4'>
                          <CheckCircle2Icon className='size-3 text-emerald-500' />
                          <span className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>Quick Actions</span>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                          <Button variant='outline' size='sm' className='h-8 text-[9px] font-bold uppercase'>Reminder</Button>
                          <Button variant='outline' size='sm' className='h-8 text-[9px] font-bold uppercase'>Route</Button>
                        </div>
                      </div>
                    </Card>
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

