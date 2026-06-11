export interface TruckersmpEvent {
  id: number;
  name: string;
  game: string;
  start_at: string;       // Format: "YYYY-MM-DD HH:MM:SS" (UTC, no timezone marker)
  meetup_at?: string;     // Format: "YYYY-MM-DD HH:MM:SS" (UTC, no timezone marker)
  banner?: string;
  server: {
    id?: number;
    name: string;
  };
  departure: {
    city: string;
    location: string;
  };
  // NOTE: The TruckersMP API returns 'arrive' (not 'arrival') for the destination
  arrive?: {
    city: string;
    location: string;
  };
  // Keep arrival as optional alias for backwards compat
  arrival?: {
    city: string;
    location: string;
  };
  url?: string;
  event_type?: { key?: string; name: string };
  dlcs?: Record<string, string> | unknown[];
  attendances?: { confirmed: number; unsure: number; vtcs: number };
  ups?: number;
  description?: string;
  vtc?: { id?: number; name: string; logo?: string };
  slug?: string;
  language?: string;
  featured?: string;
  voice_link?: string;
  external_link?: string;
  created_at?: string;
  updated_at?: string;
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
    const res = await fetch(`/api/truckersmp/vtc/${vtcId}`);
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
    // TruckersMP returns dates as "YYYY-MM-DD HH:MM:SS" (UTC, no timezone marker)
    // Convert to ISO format so browsers parse it correctly as UTC
    let safeStartAt = found.start_at || '';
    if (safeStartAt && !safeStartAt.includes('T') && safeStartAt.includes(' ')) {
      safeStartAt = safeStartAt.replace(' ', 'T') + 'Z';
    }
    // API uses 'arrive' for destination (not 'arrival')
    const arrivalCity =
      found.arrive?.city || found.arrival?.city || 'To be determined';
    const participants = found.attendances?.confirmed ?? 0;
    eventsMap.set(Number(found.id), {
      id: Number(found.id),
      name: cleanEventName(found.name || 'Convoy'),
      startDate: safeStartAt,
      bannerUrl: found.banner || '',
      participants,
      game: found.game === 'ATS' ? 'ATS' : 'ETS2',
      server: found.server?.name || 'Event Server',
      departureCity: found.departure?.city || 'To be determined',
      arrivalCity,
    });
  }

  try {
    // In dev: vite proxy rewrites /api/truckersmp/* → https://api.truckersmp.com/v2/*
    // In prod: Vercel serverless functions at /api/truckersmp/vtc/[id]/events.js
    const hostedUrl    = `/api/truckersmp/vtc/${vtcId}/events`;
    const attendingUrl = `/api/truckersmp/vtc/${vtcId}/events?type=attending`;

    console.log(`[TMP] Fetching hosted events: ${hostedUrl}`);
    console.log(`[TMP] Fetching attending events: ${attendingUrl}`);

    // Fetch both in parallel
    const [hostedRes, attendingRes] = await Promise.allSettled([
      fetch(hostedUrl),
      fetch(attendingUrl),
    ]);

    if (hostedRes.status === 'fulfilled') {
      const r = hostedRes.value;
      console.log(`[TMP] Hosted events HTTP status: ${r.status}`);
      if (r.ok) {
        const data = await r.json();
        console.log('[TMP] Hosted events API error field:', data.error, '| response is array:', Array.isArray(data.response));
        if (!data.error && Array.isArray(data.response)) {
          console.log(`[TMP] Processing ${data.response.length} hosted events`);
          (data.response as TruckersmpEvent[]).forEach(processEvent);
        } else {
          console.warn('[TMP] Hosted events unexpected format:', JSON.stringify(data).slice(0, 200));
        }
      } else {
        const text = await r.text().catch(() => '');
        console.error(`[TMP] Hosted events failed with HTTP ${r.status}:`, text.slice(0, 200));
      }
    } else {
      console.error('[TMP] Hosted events fetch rejected:', hostedRes.reason);
    }

    if (attendingRes.status === 'fulfilled') {
      const r = attendingRes.value;
      console.log(`[TMP] Attending events HTTP status: ${r.status}`);
      if (r.ok) {
        const data = await r.json();
        console.log('[TMP] Attending events API error field:', data.error, '| response is array:', Array.isArray(data.response));
        if (!data.error && Array.isArray(data.response)) {
          console.log(`[TMP] Processing ${data.response.length} attending events`);
          (data.response as TruckersmpEvent[]).forEach(processEvent);
        } else {
          console.warn('[TMP] Attending events unexpected format:', JSON.stringify(data).slice(0, 200));
        }
      } else {
        const text = await r.text().catch(() => '');
        console.error(`[TMP] Attending events failed with HTTP ${r.status}:`, text.slice(0, 200));
      }
    } else {
      console.error('[TMP] Attending events fetch rejected:', attendingRes.reason);
    }

    const result = Array.from(eventsMap.values());
    console.log(`[TMP] Total unique events fetched: ${result.length}`);
    if (result.length > 0) {
      console.log('[TMP] Sample event:', JSON.stringify(result[0]));
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch {
      // ignore storage quota errors
    }

    return result;
  } catch (e) {
    console.error('[TMP] Failed to fetch events:', e);
  }

  // Fallback to fresh cache if fetch fails
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      console.log('[TMP] Returning cached events');
      return JSON.parse(cached);
    }
  } catch {
    // ignore
  }

  return [];
}


const eventCache = new Map<number, { data: TruckersmpEvent; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // Increase to 1 hour for better performance

/**
 * Prefetches multiple events in the background to populate the cache.
 */
export function prefetchEvents(ids: number[]) {
  ids.forEach(id => {
    // Only fetch if not already in cache or expired
    const cached = eventCache.get(id);
    if (!cached || (Date.now() - cached.timestamp > CACHE_TTL)) {
      fetchTruckersmpEvent(id).catch(() => {}); // Fire and forget
    }
  });
}

export async function fetchTruckersmpEvent(id: number): Promise<TruckersmpEvent> {
  // Check cache first
  const cached = eventCache.get(id);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  // Try Official TruckersMP API via serverless function
  try {
    const res = await fetch(`/api/truckersmp/events/${id}`);
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

        const result: TruckersmpEvent = {
          id: Number(found.id),
          name: found.name || 'Upcoming Convoy',
          game: found.game === 'ETS2' || found.game === 'ATS' ? found.game : (found.game?.includes('euro') ? 'ETS2' : 'ATS'),
          start_at: safeStartAt,
          meetup_at: safeMeetupAt,
          banner: found.banner || '',
          server: { name: found.server?.name || 'Event Server' },
          departure: { city: found.departure?.city || 'To be determined', location: found.departure?.location || '' },
          // API uses 'arrive' for destination; map to both fields for compatibility
          arrive: { city: found.arrive?.city || 'To be determined', location: found.arrive?.location || '' },
          arrival: { city: found.arrive?.city || 'To be determined', location: found.arrive?.location || '' },
          event_type: { name: found.event_type?.name || 'Convoy' },
          vtc: { name: found.vtc?.name || 'Community Event', logo: '' },
          attendances: found.attendances ?? { confirmed: 0, unsure: 0, vtcs: 0 },
          ups: found.attendances?.confirmed || 0,
          description: found.description || ''
        };

        // Update cache
        eventCache.set(id, { data: result, timestamp: Date.now() });

        return result;
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