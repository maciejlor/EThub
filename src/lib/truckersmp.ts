export interface TruckersmpEvent {
  id: number;
  name: string;
  game: string;
  start_at: string;
  banner?: string;
  server: {
    name: string;
  };
  departure: {
    city: string;
    location: string;
  };
  arrival: {
    city: string;
    location: string;
  };
  arrive?: {
    city: string;
    location: string;
  };
  url?: string;
  event_type?: { name: string };
  dlc?: { name: string };
  ups?: number;
  description?: string;
  vtc?: { name: string; logo?: string };
}

export interface UpcomingEvent {
  id: number;
  name: string;
  startDate: string;
  bannerUrl: string;
  participants: number;
  game: string;
  server?: string;
  departureCity?: string;
  arrivalCity?: string;
}



function cleanEventName(name?: string) {
  if (!name) return 'Upcoming Convoy';
  const clean = name.trim();
  const bad = ['event', 'truckersmp event', 'vtc event', 'community event'];
  if (bad.includes(clean.toLowerCase())) return 'Upcoming Convoy';
  return clean;
}



export async function fetchTruckersmpVtcInfo(vtcId: number) {
  try {
    const res = await fetch(`/tmp-api/v2/vtc/${vtcId}`);
    if (res.ok) {
      const data = await res.json();
      if (!data.error && data.response) {
        return { members_count: data.response.members_count || 0 };
      }
    }
  } catch (e) {
    console.warn('TruckersMP VTC API failed', e);
  }
  return null;
}

export async function fetchUpcomingEvents(vtcId: number): Promise<UpcomingEvent[]> {
  const eventsMap = new Map<number, UpcomingEvent>();
  try {
    const STORAGE_KEY = 'ethub_cached_events_v1';
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const cachedEvents: UpcomingEvent[] = JSON.parse(cached);
        for (const e of cachedEvents) {
          eventsMap.set(e.id, e);
        }
      }
    } catch {
      // Ignore cache errors
    }

    const [apiRes, htmlRes] = await Promise.allSettled([
      fetch(`/tmp-api/v2/vtc/${vtcId}/events`),
      fetch(`/tmp-api/v2/vtc/${vtcId}/events/attending`)
    ]);

    // 1. Process Official API Data (All Past & Upcoming Hosted Events - 100% Accurate Time)
    if (apiRes.status === 'fulfilled' && apiRes.value.ok) {
      const data = await apiRes.value.json();
      if (!data.error && Array.isArray(data.response)) {
        (data.response as TruckersmpEvent[]).forEach((found) => {
          let safeStartAt = found.start_at || found.meetup_at || '';
          if (safeStartAt && !safeStartAt.includes('T') && safeStartAt.includes(' ')) {
            safeStartAt = safeStartAt.replace(' ', 'T') + 'Z';
          }
          eventsMap.set(Number(found.id), {
            id: Number(found.id),
            name: found.name || 'Upcoming Convoy',
            startDate: safeStartAt,
            bannerUrl: found.banner || '',
            participants: found.attendances?.confirmed || 0,
            game: found.game === 'ATS' ? 'ATS' : 'ETS2',
            server: found.server?.name || 'Event Server',
            departureCity: found.departure?.city || 'To be determined',
            arrivalCity: found.arrive?.city || 'To be determined'
          });
        });
      }
    }

    // 2. Process Official API Data for Attending Events (More reliable than scraper, includes 80+ events)
    if (htmlRes.status === 'fulfilled' && htmlRes.value.ok) {
      const data = await htmlRes.value.json();
      if (!data.error && Array.isArray(data.response)) {
        (data.response as TruckersmpEvent[]).forEach((found) => {
          const id = Number(found.id);
          
          let safeStartAt = found.start_at || found.meetup_at || '';
          if (safeStartAt && !safeStartAt.includes('T') && safeStartAt.includes(' ')) {
            safeStartAt = safeStartAt.replace(' ', 'T') + 'Z';
          }

          eventsMap.set(id, {
            id: id,
            name: cleanEventName(found.name || 'Upcoming Convoy'),
            startDate: safeStartAt,
            bannerUrl: found.banner || '',
            participants: found.attendances?.confirmed || 0,
            game: found.game === 'ATS' ? 'ATS' : 'ETS2',
            server: found.server?.name || 'Event Server',
            departureCity: found.departure?.city || 'To be determined',
            arrivalCity: found.arrive?.city || 'To be determined'
          });
        });
      }
    }

    const mergedEvents = Array.from(eventsMap.values());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedEvents));
    } catch (e) {
      console.warn('Failed to save cached events:', e);
    }

    return mergedEvents;
  } catch (e) {
    console.error('Failed to fetch merged events list:', e);
  }
  
  // Return cached events if fetch fails
  try {
    const cached = localStorage.getItem('ethub_cached_events_v1');
    if (cached) return JSON.parse(cached);
  } catch {
    // Ignore cache errors
  }

  return [];
}

export async function fetchTruckersmpEvent(id: number): Promise<TruckersmpEvent> {
  // Try Official TruckersMP API via Vite Proxy
  try {
    const res = await fetch(`/tmp-api/v2/events/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (!data.error && data.response) {
        const found = data.response;
        
        // Safely parse start_at string to ensure it's treated as UTC across all browsers
        // "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SSZ"
        let safeStartAt = found.start_at || found.meetup_at || '';
        if (safeStartAt && !safeStartAt.includes('T') && safeStartAt.includes(' ')) {
          safeStartAt = safeStartAt.replace(' ', 'T') + 'Z';
        }

        return {
          id: Number(found.id),
          name: found.name || 'Upcoming Convoy',
          game: found.game === 'ETS2' || found.game === 'ATS' ? found.game : (found.game?.includes('euro') ? 'ETS2' : 'ATS'),
          start_at: safeStartAt,
          banner: found.banner || '',
          server: { name: found.server?.name || 'Event Server' },
          departure: { city: found.departure?.city || 'To be determined', location: found.departure?.location || '' },
          arrival: { city: found.arrive?.city || 'To be determined', location: found.arrive?.location || '' },
          arrive: { city: found.arrive?.city || 'To be determined', location: found.arrive?.location || '' },
          event_type: { name: found.event_type?.name || 'Convoy' },
          vtc: { name: found.vtc?.name || 'Community Event', logo: '' },
          ups: found.attendances?.confirmed || 0,
          description: found.description || ''
        };
      }
    }
  } catch (e) {
    console.warn('TruckersMP API failed', e);
  }

  // 2. Final Fallback
  return null as unknown as TruckersmpEvent;
}

export type TruckersmpAttendingEvent = UpcomingEvent;

/** Alias used by Calendar.tsx */
export const fetchVtcAttendingEvents = fetchUpcomingEvents;