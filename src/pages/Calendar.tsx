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
  ChevronLeftIcon, ChevronRightIcon, SearchIcon, SettingsIcon, 
  BellIcon, CalendarIcon, PhoneIcon, CheckSquareIcon, FileTextIcon, 
  PenLineIcon, UsersIcon
} from 'lucide-react';
import type { TruckersmpAttendingEvent } from '@/lib/truckersmp';
import { fetchVtcAttendingEvents } from '@/lib/truckersmp';

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
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const [events, setEvents] = useState<ConvoyEvent[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchVtcAttendingEvents('74784-eternal')
      .then((data) => {
        if (cancelled) return;
        const coloredData = data.map((e, i) => ({
          ...e,
          gradient: EVENT_GRADIENTS[i % EVENT_GRADIENTS.length]
        }));
        setEvents(coloredData);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load events');
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
    return cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }, [cursor]);

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

  const eventsByDay = useMemo(() => {
    const map = new Map<string, TruckersmpAttendingEvent[]>();
    for (const e of events) {
      if (!e.startAt) continue;
      const key = toDayKey(e.startAt);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0));
    }
    return map;
  }, [events]);

  return (
    <SidebarProvider open={false}>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main className='bg-[#0a0a0a] min-h-screen text-[#e0e0e0] p-4 lg:p-8 overflow-x-hidden'>
          <Page>
            <div className='flex flex-col gap-6 max-w-[1600px] mx-auto'>
              {/* Top Header - Scheduling */}
              <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111]/80 p-4 rounded-[2rem] border border-white/5 backdrop-blur-md'>
                <div className='flex items-center gap-6 pl-2'>
                  <h1 className='text-2xl font-semibold text-white tracking-tight flex items-center gap-3'>
                    <div className='size-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'>
                      <div className='size-3 rounded-full bg-emerald-400' />
                    </div>
                    Scheduling
                  </h1>
                </div>

                <div className='flex flex-wrap items-center gap-4'>
                  {/* View Toggles */}
                  <div className='flex items-center bg-[#1a1a1a] rounded-full p-1 border border-white/5 shadow-inner'>
                    <Button variant='ghost' className='rounded-full px-5 h-9 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5' onClick={() => setCursor(startOfMonth(new Date()))}>Today</Button>
                    <Button variant='ghost' className='rounded-full px-5 h-9 text-xs font-medium bg-[#2a2a2a] text-white shadow-md border border-white/10'>{monthLabel}</Button>
                  </div>
                  
                  {/* Prev/Next Month */}
                  <div className='flex items-center gap-1 bg-[#1a1a1a] rounded-full p-1 border border-white/5 shadow-inner'>
                    <Button variant='ghost' size='icon' className='size-9 rounded-full hover:bg-white/10 transition-colors' onClick={() => setCursor(d => addMonths(d, -1))}>
                      <ChevronLeftIcon className='size-4 text-white/70' />
                    </Button>
                    <Button variant='ghost' size='icon' className='size-9 rounded-full hover:bg-white/10 transition-colors' onClick={() => setCursor(d => addMonths(d, 1))}>
                      <ChevronRightIcon className='size-4 text-white/70' />
                    </Button>
                  </div>

                  <div className='relative group hidden sm:block'>
                    <SearchIcon className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40 group-focus-within:text-white/80 transition-colors' />
                    <Input 
                      placeholder='Search events...' 
                      className='bg-[#1a1a1a] border-white/5 rounded-full pl-10 h-11 w-64 focus-visible:ring-1 focus-visible:ring-emerald-500/50 shadow-inner'
                    />
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button variant='ghost' size='icon' className='size-11 rounded-full bg-[#1a1a1a] border border-white/5 hover:bg-white/10 transition-colors relative'>
                      <BellIcon className='size-4.5 text-white/70' />
                      <span className='absolute top-3 right-3 size-2 bg-emerald-500 rounded-full border border-[#1a1a1a]' />
                    </Button>
                    <Button variant='ghost' size='icon' className='size-11 rounded-full bg-[#1a1a1a] border border-white/5 hover:bg-white/10 transition-colors'>
                      <SettingsIcon className='size-4.5 text-white/70' />
                    </Button>
                    <div className='size-11 rounded-full border-2 border-[#2a2a2a] overflow-hidden ml-2 shadow-lg'>
                      <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Column Grid */}
              <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-6'>
                {/* Left Panel */}
                <div className='flex flex-col gap-6'>
                  {/* Mini Calendar Widget */}
                  <div className='bg-[#111] rounded-[2rem] p-6 border border-white/5 shadow-xl relative overflow-hidden'>
                    <div className='absolute -inset-10 bg-gradient-to-br from-emerald-500/5 to-transparent blur-3xl pointer-events-none' />
                    
                    <div className='flex items-center justify-between mb-6 relative z-10'>
                      <h2 className='text-[15px] font-semibold text-white tracking-tight'>{monthLabel}</h2>
                      <div className='flex gap-1'>
                        <button className='size-7 rounded-full bg-[#1a1a1a] hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5' onClick={() => setCursor(d => addMonths(d, -1))}>
                          <ChevronLeftIcon className='size-3.5 text-white/60' />
                        </button>
                        <button className='size-7 rounded-full bg-[#1a1a1a] hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5' onClick={() => setCursor(d => addMonths(d, 1))}>
                          <ChevronRightIcon className='size-3.5 text-white/60' />
                        </button>
                      </div>
                    </div>
                    
                    <div className='grid grid-cols-7 mb-4 relative z-10'>
                      {['S','M','T','W','T','F','S'].map((day, i) => (
                        <div key={i} className='text-center text-[10px] font-bold text-white/30 tracking-widest'>{day}</div>
                      ))}
                    </div>
                    
                    <div className='grid grid-cols-7 gap-y-3 gap-x-1 relative z-10'>
                      {cells.slice(0, 35).map((d, i) => {
                        const isCurrentMonth = d.getMonth() === cursor.getMonth();
                        const isToday = isSameDay(d, today);
                        return (
                          <div key={i} className='flex items-center justify-center'>
                            <div className={cn(
                              'size-8 rounded-full flex items-center justify-center text-xs font-medium transition-all cursor-pointer',
                              !isCurrentMonth ? 'text-white/10' : 'text-white/70 hover:bg-white/10 hover:text-white',
                              isToday && 'bg-emerald-500 text-black font-bold hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                            )}>
                              {d.getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Create Section */}
                  <div className='flex flex-col gap-4'>
                    <h3 className='text-[13px] font-semibold text-white/40 px-3 uppercase tracking-widest'>Create</h3>
                    <div className='grid grid-cols-2 gap-3'>
                      <Button className='bg-[#131313] hover:bg-[#1a1a1a] border border-white/5 justify-start text-xs font-medium rounded-2xl h-[52px] text-white/80 transition-all shadow-md group'>
                        <CalendarIcon className='mr-3 size-4 text-emerald-400 group-hover:scale-110 transition-transform'/>Meeting
                      </Button>
                      <Button className='bg-[#131313] hover:bg-[#1a1a1a] border border-white/5 justify-start text-xs font-medium rounded-2xl h-[52px] text-white/80 transition-all shadow-md group'>
                        <PhoneIcon className='mr-3 size-4 text-blue-400 group-hover:scale-110 transition-transform'/>Call
                      </Button>
                      <Button className='bg-[#131313] hover:bg-[#1a1a1a] border border-white/5 justify-start text-xs font-medium rounded-2xl h-[52px] text-white/80 transition-all shadow-md group'>
                        <CheckSquareIcon className='mr-3 size-4 text-purple-400 group-hover:scale-110 transition-transform'/>Task
                      </Button>
                      <Button className='bg-[#131313] hover:bg-[#1a1a1a] border border-white/5 justify-start text-xs font-medium rounded-2xl h-[52px] text-white/80 transition-all shadow-md group'>
                        <BellIcon className='mr-3 size-4 text-rose-400 group-hover:scale-110 transition-transform'/>Reminder
                      </Button>
                      <Button className='bg-[#131313] hover:bg-[#1a1a1a] border border-white/5 justify-start text-xs font-medium rounded-2xl h-[52px] text-white/80 transition-all shadow-md group'>
                        <FileTextIcon className='mr-3 size-4 text-amber-400 group-hover:scale-110 transition-transform'/>Document
                      </Button>
                      <Button className='bg-[#131313] hover:bg-[#1a1a1a] border border-white/5 justify-start text-xs font-medium rounded-2xl h-[52px] text-white/80 transition-all shadow-md group'>
                        <PenLineIcon className='mr-3 size-4 text-cyan-400 group-hover:scale-110 transition-transform'/>Note
                      </Button>
                    </div>
                  </div>

                  {/* Week Overview */}
                  <div className='flex flex-col gap-4 mt-2'>
                    <h3 className='text-[13px] font-semibold text-white/40 px-3 uppercase tracking-widest'>Week overview</h3>
                    <div className='bg-[#111] p-5 rounded-[2rem] border border-white/5 shadow-xl group hover:border-emerald-500/20 transition-all duration-500 relative overflow-hidden'>
                      <div className='absolute top-0 right-0 p-4 opacity-5 pointer-events-none'>
                         <CheckSquareIcon className='size-24 text-emerald-500' />
                      </div>
                      <div className='flex items-center gap-3 mb-5 relative z-10'>
                        <div className='size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner'>
                          <CheckSquareIcon className='size-5 text-emerald-400' />
                        </div>
                        <div className='flex-1'>
                          <div className='flex justify-between text-[13px] font-semibold mb-1'>
                            <span className='text-white/90'>Completed tasks</span>
                          </div>
                          <div className='text-[11px] font-medium text-white/40'>12 of 18 completed</div>
                        </div>
                      </div>
                      <div className='h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5 shadow-inner relative z-10'>
                        <div className='h-full bg-emerald-500 w-[66%] rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)] transition-all duration-1000 group-hover:bg-emerald-400' />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Calendar Grid */}
                <div className='bg-[#111] rounded-[2.5rem] border border-white/5 p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col'>
                  <div className='absolute top-0 right-0 w-full h-[300px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none' />
                  
                  <div className='relative z-10 flex-1 flex flex-col'>
                    {/* Grid Header */}
                    <div className='grid grid-cols-7 mb-6'>
                      {weekDays.map((day, i) => (
                        <div key={day} className='text-center text-[11px] font-bold text-white/40 tracking-widest uppercase'>
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Grid Content */}
                    <div className='grid grid-cols-7 gap-3 lg:gap-4 flex-1'>
                      {cells.map((d, index) => {
                        const isToday = isSameDay(d, today);
                        const isCurrentMonth = d.getMonth() === cursor.getMonth();
                        const dayEvents = eventsByDay.get(toDayKey(d)) ?? [];
                        const hasEvents = dayEvents.length > 0;

                        return (
                          <div
                            key={d.toISOString()}
                            className={cn(
                              'min-h-[110px] lg:min-h-[140px] rounded-[1.5rem] p-2.5 transition-all duration-300 relative group/cell flex flex-col',
                              !isCurrentMonth && 'opacity-20 grayscale',
                              isCurrentMonth && !hasEvents && 'bg-white/[0.015] border border-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.02]',
                              hasEvents && 'bg-[#151515] border border-white/[0.06] hover:border-white/10 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                            )}
                          >
                            {/* Empty state patterns */}
                            {!hasEvents && (d.getDay() === 0 || d.getDay() === 6) && (
                              <div className='absolute inset-0 opacity-[0.02] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fff_10px,#fff_20px)] rounded-[1.5rem] pointer-events-none' />
                            )}
                            
                            {/* Date Number */}
                            <div className='flex justify-between items-start mb-2.5 relative z-10'>
                              <span className={cn(
                                'text-[13px] font-semibold size-8 rounded-full flex items-center justify-center transition-colors',
                                isToday ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-white/50 group-hover/cell:text-white/90'
                              )}>
                                {String(d.getDate()).padStart(2, '0')}
                              </span>
                            </div>
                            
                            {/* Events */}
                            <div className='flex flex-col gap-2 flex-1 relative z-10'>
                              {dayEvents.slice(0, 2).map((event, i) => (
                                <Link 
                                  key={event.id}
                                  to={`/calendar/${event.id}`}
                                  className={cn(
                                    'p-2.5 rounded-xl flex flex-col gap-1.5 transition-all hover:scale-[1.03] hover:shadow-lg relative overflow-hidden border border-white/10 group/event',
                                    'bg-gradient-to-br',
                                    event.gradient || 'from-[#1a1a1a] to-[#2a2a2a]'
                                  )}
                                >
                                  {/* Glassmorphic overlay */}
                                  <div className='absolute inset-0 bg-black/20 backdrop-blur-[2px] group-hover/event:bg-black/10 transition-colors' />
                                  
                                  <div className='relative z-10'>
                                    <div className='text-[10px] font-bold text-white/95 line-clamp-2 leading-[1.3] mb-2 drop-shadow-sm'>
                                      {event.title}
                                    </div>
                                    <div className='flex items-center justify-between mt-auto'>
                                      <div className='text-[9px] font-bold tracking-wider text-white/80 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10'>
                                        {event.startAt ? new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day'}
                                      </div>
                                      <div className='flex -space-x-1.5'>
                                        <div className='size-5 rounded-full bg-white/20 border border-white/40 backdrop-blur-md flex items-center justify-center shadow-sm'>
                                          <UsersIcon className='size-3 text-white drop-shadow-sm'/>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                              
                              {dayEvents.length > 2 && (
                                <div className='mt-auto text-center'>
                                  <span className='text-[10px] font-semibold text-white/50 bg-[#1a1a1a] px-3 py-1.5 rounded-xl border border-white/5 hover:bg-[#2a2a2a] hover:text-white/80 transition-colors cursor-pointer inline-block shadow-inner'>
                                    +{dayEvents.length - 2} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
