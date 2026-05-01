import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { TruckersmpAttendingEvent } from '@/lib/truckersmp';
import { fetchVtcAttendingEvents } from '@/lib/truckersmp';

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

export function EventsPage() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(() => new Date());

  const [events, setEvents] = useState<TruckersmpAttendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchVtcAttendingEvents('74784-eternal')
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
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

  const selectedEvents = useMemo(() => {
    return eventsByDay.get(toDayKey(selected)) ?? [];
  }, [eventsByDay, selected]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => (e.startAt?.getTime() ?? Number.POSITIVE_INFINITY) >= now)
      .slice(0, 20);
  }, [events]);

  return (
    <SidebarProvider open={false}>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main>
          <Page>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h1 className='text-xl font-semibold lg:text-2xl'>Upcoming events</h1>
                  <p className='text-sm text-muted-foreground'>
                    Attending convoys from TruckersMP (VTC: Eternal Transport).
                  </p>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label='Previous month'
                    onClick={() => setCursor((d) => addMonths(d, -1))}
                  >
                    <ChevronLeftIcon />
                  </Button>

                  <div className='min-w-[14ch] text-center font-medium'>{monthLabel}</div>

                  <Button
                    variant='outline'
                    size='icon'
                    aria-label='Next month'
                    onClick={() => setCursor((d) => addMonths(d, 1))}
                  >
                    <ChevronRightIcon />
                  </Button>

                  <Button variant='outline' onClick={() => setCursor(startOfMonth(new Date()))}>
                    Today
                  </Button>
                </div>
              </div>

              {error && (
                <div className='rounded-xl border bg-card p-4 text-sm text-destructive'>
                  {error}
                </div>
              )}

              <div className='grid gap-6 lg:grid-cols-[1fr_380px]'>
                <div className='rounded-xl border bg-card'>
                  <div className='grid grid-cols-7 border-b bg-muted/30'>
                    {weekDays.map((d) => (
                      <div
                        key={d}
                        className='px-3 py-2 text-xs font-medium text-muted-foreground'
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className='grid grid-cols-7'>
                    {cells.map((d) => {
                      const inMonth = d.getMonth() === cursor.getMonth();
                      const isToday = isSameDay(d, today);
                      const isSelected = isSameDay(d, selected);
                      const dayEvents = eventsByDay.get(toDayKey(d)) ?? [];

                      return (
                        <button
                          key={d.toISOString()}
                          type='button'
                          onClick={() => setSelected(d)}
                          className={cn(
                            'group relative min-h-24 border-t border-l p-3 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                            !inMonth && 'text-muted-foreground/70',
                          )}
                        >
                          <div className='flex items-start justify-between'>
                            <span
                              className={cn(
                                'grid size-7 place-items-center rounded-md text-sm',
                                isSelected && 'bg-primary text-primary-foreground',
                                !isSelected && isToday && 'ring-1 ring-primary text-primary',
                              )}
                            >
                              {d.getDate()}
                            </span>

                            {dayEvents.length > 0 && (
                              <span className='inline-flex items-center gap-1 text-[10px] text-muted-foreground'>
                                <span className='size-2 rounded-full bg-amber-500/80' />
                                {dayEvents.length}
                              </span>
                            )}
                          </div>

                          <div className='mt-3 space-y-2'>
                            {loading ? (
                              <div className='h-2 w-20 rounded-full bg-muted' />
                            ) : dayEvents.length > 0 ? (
                              <>
                                <div className='h-2 w-20 rounded-full bg-amber-500/25' />
                                <div className='h-2 w-14 rounded-full bg-emerald-500/15' />
                              </>
                            ) : (
                              <div className='h-2 w-14 rounded-full bg-muted/50 opacity-0 transition-opacity group-hover:opacity-100' />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className='flex flex-col gap-6'>
                  <div className='rounded-xl border bg-card p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <h2 className='font-semibold'>Selected day</h2>
                        <p className='text-sm text-muted-foreground'>
                          {selected.toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className='text-xs text-muted-foreground'>
                        {selectedEvents.length} event(s)
                      </span>
                    </div>

                    <div className='mt-4 space-y-3'>
                      {selectedEvents.length === 0 ? (
                        <div className='text-sm text-muted-foreground'>No events on this day.</div>
                      ) : (
                        selectedEvents.map((e) => (
                          <Link
                            key={e.id}
                            to={`/events/${e.id}`}
                            className='block rounded-lg border bg-background p-3 hover:bg-muted/30'
                          >
                            <div className='text-sm font-medium'>{e.title}</div>
                            <div className='mt-1 text-xs text-muted-foreground'>
                              {e.startAt ? e.startAt.toLocaleString() : e.startText}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  <div className='rounded-xl border bg-card p-4'>
                    <h2 className='font-semibold'>Next attending convoys</h2>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      Total listed: {events.length}
                    </p>

                    <div className='mt-4 space-y-3'>
                      {loading ? (
                        <div className='text-sm text-muted-foreground'>Loading…</div>
                      ) : upcoming.length === 0 ? (
                        <div className='text-sm text-muted-foreground'>No upcoming events found.</div>
                      ) : (
                        upcoming.map((e) => (
                          <Link
                            key={e.id}
                            to={`/events/${e.id}`}
                            className='flex items-start gap-3 rounded-lg border bg-background p-3 hover:bg-muted/30'
                          >
                            <div className='mt-0.5 size-2 rounded-full bg-amber-500/80' />
                            <div className='min-w-0'>
                              <div className='truncate text-sm font-medium'>{e.title}</div>
                              <div className='mt-1 text-xs text-muted-foreground'>
                                {e.startAt ? e.startAt.toLocaleString() : e.startText}
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
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

