import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchTruckersmpEvent, type TruckersmpEvent } from '@/lib/truckersmp';
import { 
  ArrowLeftIcon, MapPinIcon, GamepadIcon, 
  GlobeIcon, CalendarIcon, ExternalLinkIcon
} from 'lucide-react';

const formatBannerTime = (isoString?: string) => {
  if (!isoString) return 'TBD';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'TBD';
  
  const weekday = d.toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const day = d.getUTCDate().toString();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
  
  return `${weekday}, ${month} ${day} · ${time} UTC`;
};

const formatDetailTime = (isoString?: string) => {
  if (!isoString) return 'TBD';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'TBD';
  return d.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });
};

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

        <main className='bg-[#050505] min-h-screen text-white'>
          {loading ? (
            <Page>
              <div className='flex items-center justify-center h-96 text-neutral-500 font-medium'>
                <div className='animate-pulse text-lg'>Fetching event details...</div>
              </div>
            </Page>
          ) : error ? (
            <Page>
              <div className='rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center mt-6'>
                <h3 className='text-destructive font-bold mb-2'>Error</h3>
                <p className='text-neutral-400 text-sm'>{error}</p>
              </div>
            </Page>
          ) : !eventData ? (
            <Page>
              <div className='text-center p-12 text-neutral-500 mt-6'>Event not found.</div>
            </Page>
          ) : (
            <div className='flex flex-col w-full'>
              
              {/* Full-width Hero Banner Header */}
              <div className='relative w-full overflow-hidden bg-black border-b border-neutral-900 min-h-[340px] flex flex-col justify-between'>
                {/* Background image overlay */}
                <div className='absolute inset-0 z-0'>
                  <img
                    src={eventData.banner || 'https://via.placeholder.com/1920x600'}
                    alt=""
                    className='w-full h-full object-cover opacity-45'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-black/20' />
                </div>

                {/* Content Container */}
                <div className='relative z-10 max-w-7xl mx-auto w-full px-6 pt-12 pb-10 flex-1 flex flex-col justify-between'>
                  {/* Back button */}
                  <div>
                    <Link 
                      to='/calendar' 
                      className='text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 w-fit font-bold uppercase tracking-wider'
                    >
                      <ArrowLeftIcon className='size-3.5' />
                      Back to events
                    </Link>
                  </div>

                  {/* Badges, Title, Info Row */}
                  <div className='mt-8 space-y-4'>
                    {/* Badges */}
                    <div className='flex gap-2'>
                      <span className='px-2.5 py-1 text-[10px] font-extrabold bg-[#5865F2]/20 border border-[#5865F2]/30 rounded-md text-white uppercase tracking-wider'>
                        {eventData.game?.includes('truck') ? (eventData.game.includes('euro') ? 'ETS2' : 'ATS') : (eventData.game || 'ETS2')}
                      </span>
                      <span className='px-2.5 py-1 text-[10px] font-extrabold bg-neutral-900/80 border border-neutral-800 rounded-md text-neutral-400 tracking-wider'>
                        {eventData.ups || 0} attending
                      </span>
                    </div>

                    {/* Title */}
                    <h1 className='text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight max-w-4xl'>
                      {eventData.name}
                    </h1>

                    {/* Info row with icons */}
                    <div className='flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs text-neutral-300 font-semibold tracking-wide'>
                      {/* Date & Time */}
                      <div className='flex items-center gap-2'>
                        <CalendarIcon className='size-4 text-neutral-500' />
                        <span>{formatBannerTime(eventData.start_at)}</span>
                      </div>

                      {/* Server */}
                      <div className='flex items-center gap-2'>
                        <GlobeIcon className='size-4 text-neutral-500' />
                        <span>{eventData.server?.name || 'To be determined'}</span>
                      </div>

                      {/* Route (City start -> city end) */}
                      <div className='flex items-center gap-2'>
                        <MapPinIcon className='size-4 text-neutral-500' />
                        <span>
                          {eventData.departure?.city || 'TBD'} → {(eventData.arrival?.city || eventData.arrive?.city) || 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Grid Content */}
              <div className='max-w-7xl mx-auto w-full px-6 py-10'>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                  
                  {/* Left Column (Description & Route Timeline) */}
                  <div className='lg:col-span-2 space-y-8'>
                    {/* Description Card */}
                    <Card className='p-6 md:p-8 rounded-2xl bg-neutral-900/20 border border-neutral-800 shadow-md'>
                      <h2 className='text-xl font-semibold text-white mb-6 tracking-tight'>Description</h2>
                      <div className='text-neutral-400 leading-relaxed text-sm whitespace-pre-line font-normal'>
                        {eventData.description || 'No description provided.'}
                      </div>
                    </Card>

                    {/* Route Timeline Card */}
                    <Card className='p-6 md:p-8 rounded-2xl bg-neutral-900/20 border border-neutral-800 shadow-md relative overflow-hidden'>
                      <h2 className='text-xl font-semibold text-white mb-8 tracking-tight'>Route</h2>
                      
                      <div className='relative'>
                        {/* Timeline vertical bar */}
                        <div className='absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-primary to-teal-500' />
                        
                        {/* Departure Point */}
                        <div className='relative flex items-start gap-4 mb-8'>
                          <div className='w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'>
                            <MapPinIcon className='size-5' />
                          </div>
                          <div>
                            <div className='text-xs text-neutral-500 mb-1'>Departure</div>
                            <div className='text-lg font-medium text-white'>{eventData.departure?.city || 'To be determined'}</div>
                            {eventData.departure?.location && (
                              <div className='text-sm text-neutral-400 mt-0.5'>{eventData.departure.location}</div>
                            )}
                          </div>
                        </div>

                        {/* Arrival Point */}
                        <div className='relative flex items-start gap-4'>
                          <div className='w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]'>
                            <MapPinIcon className='size-5' />
                          </div>
                          <div>
                            <div className='text-xs text-neutral-500 mb-1'>Arrival</div>
                            <div className='text-lg font-medium text-white'>
                              {(eventData.arrival?.city || eventData.arrive?.city) || 'To be determined'}
                            </div>
                            {(eventData.arrival?.location || eventData.arrive?.location) && (
                              <div className='text-sm text-neutral-400 mt-0.5'>
                                {eventData.arrival?.location || eventData.arrive?.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Right Column (Details Card & Action Buttons) */}
                  <div className='space-y-6'>
                    {/* Details List Card */}
                    <Card className='p-6 rounded-2xl bg-neutral-900/20 border border-neutral-800 shadow-md space-y-5'>
                      <h3 className='text-lg font-semibold text-white tracking-tight border-b border-neutral-800 pb-3'>Details</h3>
                      
                      <div className='space-y-4'>
                        {/* Game */}
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-400 border border-neutral-800 shrink-0'>
                            <GamepadIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-xs text-neutral-500'>Game</div>
                            <div className='text-sm text-white'>
                              {eventData.game?.includes('truck') ? (eventData.game.includes('euro') ? 'ETS2' : 'ATS') : (eventData.game || 'ETS2')}
                            </div>
                          </div>
                        </div>

                        {/* Server */}
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-400 border border-neutral-800 shrink-0'>
                            <GlobeIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-xs text-neutral-500'>Server</div>
                            <div className='text-sm text-white'>{eventData.server?.name || 'TBD'}</div>
                          </div>
                        </div>

                        <div className='h-px bg-neutral-800' />

                        {/* Meetup */}
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-400 border border-neutral-800 shrink-0'>
                            <CalendarIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-xs text-neutral-500'>Meetup</div>
                            <div className='text-sm text-white font-medium'>
                              {eventData.meetup_at ? formatDetailTime(eventData.meetup_at) : 'TBD'}
                            </div>
                          </div>
                        </div>

                        {/* Start */}
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded-lg bg-[#0d0d0d] flex items-center justify-center text-neutral-400 border border-neutral-800 shrink-0'>
                            <CalendarIcon className='size-4' />
                          </div>
                          <div>
                            <div className='text-xs text-neutral-500'>Start</div>
                            <div className='text-sm text-white font-medium'>
                              {eventData.start_at ? formatDetailTime(eventData.start_at) : 'TBD'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Sidebar Links Card */}
                    <div className='space-y-3 pt-2'>
                      <a
                        href={`https://truckersmp.com/events/${eventId}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-neutral-950 font-semibold rounded-lg hover:bg-neutral-100 transition-colors text-sm shadow-md'
                      >
                        View on TruckersMP
                        <ExternalLinkIcon className='size-4' />
                      </a>
                      
                      {eventData.url && (
                        <a 
                          href={eventData.url} 
                          target='_blank' 
                          rel='noopener noreferrer' 
                          className='w-full flex items-center justify-center gap-2 px-6 py-3 text-neutral-300 border border-neutral-800 rounded-lg hover:bg-neutral-900 hover:border-neutral-700 transition-all text-sm font-semibold'
                        >
                          More Info
                        </a>
                      )}
                    </div>

                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
