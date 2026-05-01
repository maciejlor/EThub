import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import type { TruckersmpAttendingEvent } from '@/lib/truckersmp';
import { fetchVtcAttendingEvents } from '@/lib/truckersmp';

export function EventDetailsPage() {
  const params = useParams();
  const eventId = useMemo(() => Number(params.id), [params.id]);

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
        setError(e instanceof Error ? e.message : 'Failed to load event');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const event = useMemo(() => events.find((e) => e.id === eventId), [events, eventId]);

  return (
    <SidebarProvider open={false}>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main>
          <Page>
            <div className='flex flex-col gap-6'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <h1 className='text-xl font-semibold lg:text-2xl'>Event details</h1>
                  <p className='text-sm text-muted-foreground'>TruckersMP event #{params.id}</p>
                </div>
                <Button asChild variant='outline'>
                  <Link to='/events'>Back to events</Link>
                </Button>
              </div>

              {error && (
                <div className='rounded-xl border bg-card p-4 text-sm text-destructive'>
                  {error}
                </div>
              )}

              {loading ? (
                <div className='rounded-xl border bg-card p-6 text-sm text-muted-foreground'>
                  Loading…
                </div>
              ) : !event ? (
                <div className='rounded-xl border bg-card p-6 text-sm text-muted-foreground'>
                  Event not found in attending list.
                </div>
              ) : (
                <div className='grid gap-6 lg:grid-cols-[360px_1fr]'>
                  <div className='overflow-hidden rounded-xl border bg-card'>
                    {event.coverImage ? (
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className='aspect-[16/9] w-full object-cover'
                        loading='lazy'
                      />
                    ) : (
                      <div className='aspect-[16/9] w-full bg-muted' />
                    )}
                    <div className='p-4'>
                      <div className='text-sm font-medium'>{event.title}</div>
                      <div className='mt-2 text-sm text-muted-foreground'>
                        {event.startAt ? event.startAt.toLocaleString() : event.startText}
                      </div>
                      {event.game && (
                        <div className='mt-1 text-sm text-muted-foreground'>{event.game}</div>
                      )}
                      <div className='mt-4 flex gap-2'>
                        <Button asChild className='w-full'>
                          <a href={event.url} target='_blank' rel='noreferrer'>
                            Open on TruckersMP
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className='rounded-xl border bg-card p-6'>
                    <h2 className='font-semibold'>About</h2>
                    <p className='mt-2 text-sm text-muted-foreground'>
                      This page is generated from your VTC “Events Attending” list. If you want,
                      I can extend it to scrape the full event page (server, route, description,
                      meetup time, etc.).
                    </p>
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

