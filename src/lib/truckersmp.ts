export interface TruckersmpEvent {
  id: number;
  name: string;
  game: string;
  start_at: string;
  meetup_at?: string;
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
  // Use v2 key to bust any stale v1 cache
  const STORAGE_KEY = 'ethub_cached_events_v2';
  const eventsMap = new Map<number, UpcomingEvent>();

  function processEvent(found: TruckersmpEvent) {
    let safeStartAt = found.start_at || '';
    if (safeStartAt && !safeStartAt.includes('T') && safeStartAt.includes(' ')) {
      safeStartAt = safeStartAt.replace(' ', 'T') + 'Z';
    }
    const arrivalCity =
      found.arrive?.city || found.arrival?.city || 'To be determined';
    eventsMap.set(Number(found.id), {
      id: Number(found.id),
      name: cleanEventName(found.name || 'Convoy'),
      startDate: safeStartAt,
      bannerUrl: found.banner || '',
      participants: (found as any).attendances?.confirmed || 0,
      game: found.game === 'ATS' ? 'ATS' : 'ETS2',
      server: found.server?.name || 'Event Server',
      departureCity: found.departure?.city || 'To be determined',
      arrivalCity,
    });
  }

  try {
    // Fetch both: events hosted BY the VTC, and events the VTC is attending
    const [hostedRes, attendingRes] = await Promise.allSettled([
      fetch(`/tmp-api/v2/vtc/${vtcId}/events`),
      fetch(`/tmp-api/v2/vtc/${vtcId}/events/attending`),
    ]);

    if (hostedRes.status === 'fulfilled' && hostedRes.value.ok) {
      const data = await hostedRes.value.json();
      if (!data.error && Array.isArray(data.response)) {
        (data.response as TruckersmpEvent[]).forEach(processEvent);
      }
    }

    if (attendingRes.status === 'fulfilled' && attendingRes.value.ok) {
      const data = await attendingRes.value.json();
      if (!data.error && Array.isArray(data.response)) {
        (data.response as TruckersmpEvent[]).forEach(processEvent);
      }
    }

    const result = Array.from(eventsMap.values());

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch {
      // ignore storage quota errors
    }

    return result;
  } catch (e) {
    console.error('Failed to fetch events:', e);
  }

  // Fallback to fresh cache if fetch fails
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // ignore
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
        
        // Safely parse start_at and meetup_at strings to ensure they're treated as UTC across all browsers
        // "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SSZ"
        let safeStartAt = found.start_at || '';
        if (safeStartAt && !safeStartAt.includes('T') && safeStartAt.includes(' ')) {
          safeStartAt = safeStartAt.replace(' ', 'T') + 'Z';
        }

        let safeMeetupAt = found.meetup_at || '';
        if (safeMeetupAt && !safeMeetupAt.includes('T') && safeMeetupAt.includes(' ')) {
          safeMeetupAt = safeMeetupAt.replace(' ', 'T') + 'Z';
        }

        // Fallback: If meetup_at is missing, set it to 1 hour before start_at
        if (!safeMeetupAt && safeStartAt) {
          const startDt = new Date(safeStartAt);
          startDt.setUTCHours(startDt.getUTCHours() - 1);
          safeMeetupAt = startDt.toISOString();
        }

        return {
          id: Number(found.id),
          name: found.name || 'Upcoming Convoy',
          game: found.game === 'ETS2' || found.game === 'ATS' ? found.game : (found.game?.includes('euro') ? 'ETS2' : 'ATS'),
          start_at: safeStartAt,
          meetup_at: safeMeetupAt,
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