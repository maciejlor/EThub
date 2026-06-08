import { useLanguage } from '@/components/LanguageProvider';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  ChevronLeftIcon, ChevronRightIcon, SearchIcon, UsersIcon
} from 'lucide-react';
import type { TruckersmpAttendingEvent } from '@/lib/truckersmp';
import { fetchVtcAttendingEvents, prefetchEvents } from '@/lib/truckersmp';
import { Card } from '@/components/ui/card';

type ConvoyEvent = TruckersmpAttendingEvent & {
  color?: string;
  gradient?: string;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const EVENT_GRADIENTS = [
  'from-[#00c6ff] to-[#0072ff]',
  'from-[#f12711] to-[#f5af19]',
  'from-[#8E2DE2] to-[#4A00E0]',
  'from-[#11998e] to-[#38ef7d]',
  'from-[#FF416C] to-[#FF4B2B]'
];

export function CalendarPage() {
  const { t, language } = useLanguage();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const [events, setEvents] = useState<ConvoyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Try to load from cache immediately for better UX
    try {
      const cached = localStorage.getItem('ethub_cached_events_v2');
      if (cached) {
        const data = JSON.parse(cached);
        const coloredData = data.map((e: any, i: number) => ({
          ...e,
          gradient: EVENT_GRADIENTS[i % EVENT_GRADIENTS.length]
        }));
        setEvents(coloredData);
        setLoading(false);
      }
    } catch { /**/ }

    fetchVtcAttendingEvents(74784)
      .then((data) => {
        if (cancelled) return;
        
        // Prefetch next 8 upcoming events in background to make them instant
        const upcomingIds = data
          .filter(e => new Date(e.startDate).getTime() > Date.now())
          .slice(0, 8)
          .map(e => e.id);
        prefetchEvents(upcomingIds);

        const coloredData = data.map((e, i) => ({
          ...e,
          gradient: EVENT_GRADIENTS[i % EVENT_GRADIENTS.length]
        }));
        setEvents(coloredData);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('Calendar fetch error:', e);
        setError(e instanceof Error ? e.message : 'Failed to load events. Please check your connection.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const monthLabel = useMemo(() => {
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';
    return cursor.toLocaleString(locale, { month: 'long', year: 'numeric' });
  }, [cursor, language]);

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const firstWeekday = (first.getDay() + 6) % 7; // monday=0
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - firstWeekday);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [cursor]);

  const weekDays = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], []);

  // Build map of all events (past AND upcoming) keyed by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, TruckersmpAttendingEvent[]>();
    for (const e of events) {
      const d = new Date(e.startDate);
      if (isNaN(d.getTime())) continue;
      const key = toDayKey(d);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
    return map;
  }, [events]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main>
          <Page>
            <div className='flex flex-col gap-6'>
              {/* Top Header */}
              <div className='flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center'>
                <h1 className='text-xl font-semibold lg:text-2xl'>{t('Calendar')}</h1>

                <div className='flex flex-wrap items-center gap-3'>
                  {/* View Toggles */}
                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' className='h-9 rounded-md px-4' onClick={() => setCursor(startOfMonth(new Date()))}>{t('Today')}</Button>
                    <div className='flex items-center bg-muted/50 rounded-md p-1 border'>
                      <Button variant='ghost' size='icon' className='size-7 rounded-sm hover:bg-background transition-colors' onClick={() => setCursor(d => addMonths(d, -1))}>
                        <ChevronLeftIcon className='size-4 text-muted-foreground' />
                      </Button>
                      <span className='px-3 text-xs font-medium min-w-[120px] text-center'>{monthLabel}</span>
                      <Button variant='ghost' size='icon' className='size-7 rounded-sm hover:bg-background transition-colors' onClick={() => setCursor(d => addMonths(d, 1))}>
                        <ChevronRightIcon className='size-4 text-muted-foreground' />
                      </Button>
                    </div>
                  </div>

                  <div className='relative group hidden sm:block'>
                    <SearchIcon className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
                    <Input 
                      placeholder={t('Search events...')} 
                      className='bg-background border-input rounded-md pl-10 h-9 w-64 focus-visible:ring-1 focus-visible:ring-primary/50 text-sm'
                    />
                  </div>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className='rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3'>
                  <div className='size-2 rounded-full bg-destructive animate-pulse' />
                  {error}
                  <Button variant='outline' size='sm' className='ml-auto h-7 text-xs' onClick={() => window.location.reload()}>{t('Retry')}</Button>
                </div>
              )}

              {/* Loading State */}
              {loading && events.length === 0 && (
                <div className='flex flex-col items-center justify-center py-20 text-muted-foreground gap-4'>
                  <div className='size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin' />
                  <p className='text-sm font-medium animate-pulse'>{t('Fetching events from TruckersMP...')}</p>
                </div>
              )}

              {/* Full Width Calendar Grid */}
              <div className='grid grid-cols-1 gap-6'>

                {/* Calendar Grid */}
                <Card className='rounded-xl border p-6 lg:p-8 shadow-sm relative overflow-hidden flex flex-col bg-background'>
                  <div className='absolute top-0 right-0 w-full h-[300px] bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none' />
                  
                  <div className='relative z-10 flex-1 flex flex-col'>
                    {/* Grid Header */}
                    <div className='grid grid-cols-7 mb-6'>
                      {weekDays.map((day) => (
                        <div key={day} className='text-center text-[11px] font-semibold text-muted-foreground/50 tracking-widest uppercase'>
                          {t(day)}
                        </div>
                      ))}
                    </div>

                    {/* Grid Content */}
                    <div className='grid grid-cols-7 gap-3 lg:gap-4 flex-1'>
                      {cells.map((d) => {
                        const isToday = isSameDay(d, today);
                        const isCurrentMonth = d.getMonth() === cursor.getMonth();
                        const dayEvents = eventsByDay.get(toDayKey(d)) ?? [];
                        const hasEvents = dayEvents.length > 0;

                        return (
                          <div
                            key={d.toISOString()}
                            className={cn(
                              'min-h-[110px] lg:min-h-[140px] rounded-[1.5rem] p-2.5 transition-all duration-300 relative group/cell flex flex-col',
                              !isCurrentMonth && 'opacity-30 grayscale',
                              isCurrentMonth && !hasEvents && 'bg-muted/10 border border-muted/20 hover:bg-muted/30 hover:border-muted/40 hover:scale-[1.02]',
                              hasEvents && 'bg-background border border-muted/50 hover:border-primary/30 shadow-sm hover:shadow-md hover:scale-[1.02]'
                            )}
                          >
                            {/* Empty state patterns */}
                            {!hasEvents && (d.getDay() === 0 || d.getDay() === 6) && (
                              <div className='absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--muted)_10px,var(--muted)_20px)] rounded-[1.5rem] pointer-events-none' />
                            )}
                            
                            {/* Date Number */}
                            <div className='flex justify-between items-start mb-2.5 relative z-10'>
                              <span className={cn(
                                'text-[13px] font-semibold size-8 rounded-full flex items-center justify-center transition-colors',
                                isToday ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-muted-foreground group-hover/cell:text-foreground'
                              )}>
                                {String(d.getDate()).padStart(2, '0')}
                              </span>
                            </div>
                            
                            {/* Events */}
                            <div className='flex flex-col gap-2 flex-1 relative z-10'>
                              {dayEvents.slice(0, 2).map((event) => (
                                <Link 
                                  key={event.id}
                                  to={`/calendar/${event.id}`}
                                  state={{ event }}
                                  className={cn(
                                    'p-2.5 rounded-xl flex flex-col gap-1.5 transition-all hover:scale-[1.03] hover:shadow-md relative overflow-hidden border border-primary/10 group/event',
                                    'bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10'
                                  )}
                                >
                                  <div className='relative z-10'>
                                    <div className='text-[10px] font-semibold text-primary-foreground/90 bg-primary/80 px-2 py-0.5 rounded-md w-fit mb-1'>
                                       {t('Convoy')}
                                    </div>
                                    <div className='text-[11px] font-semibold text-foreground line-clamp-2 leading-[1.3] mb-2'>
                                      {event.name}
                                    </div>
                                    <div className='flex items-center justify-between mt-auto'>
                                      <div className='text-[9px] font-bold tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-lg border'>
                                        {event.startDate ? `${new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false })} UTC` : t('All Day')}
                                      </div>
                                      <div className='flex -space-x-1.5'>
                                        <div className='size-5 rounded-full bg-background border flex items-center justify-center shadow-sm'>
                                          <UsersIcon className='size-3 text-primary'/>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                              
                              {dayEvents.length > 2 && (
                                <div className='mt-auto text-center'>
                                  <span className='text-[10px] font-semibold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-xl border border-muted/50 hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer inline-block shadow-sm'>
                                    {t('+{count} more', { count: dayEvents.length - 2 })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
