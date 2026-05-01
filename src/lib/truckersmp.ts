export type TruckersmpAttendingEvent = {
  id: number;
  title: string;
  startText: string;
  startAt: Date | null;
  game?: string;
  url: string;
  coverImage?: string;
};

function parseStartDate(text: string): Date | null {
  const v = text.trim();
  if (!v) return null;
  const parsed = Date.parse(v);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

export function parseVtcAttendingEventsFromHtml(html: string): TruckersmpAttendingEvent[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // The attending page repeats event links. Images are a stable anchor per card.
  const imgs = Array.from(doc.querySelectorAll<HTMLImageElement>('img.vtc-event-img'));
  const events: TruckersmpAttendingEvent[] = [];

  for (const img of imgs) {
    const link = img.closest('a') as HTMLAnchorElement | null;
    const href = link?.getAttribute('href') || '';
    const m = href.match(/\/events\/(\d+)-/);
    if (!m) continue;
    const id = Number(m[1]);
    if (!Number.isFinite(id)) continue;

    const card = img.closest('.h-100') ?? img.closest('.shadow-effect-1') ?? img.parentElement;
    const title =
      card?.querySelector('h4 a')?.textContent?.trim() ||
      img.getAttribute('alt')?.trim() ||
      `Event ${id}`;

    const dateEl = card?.querySelector('i.fa-calendar-alt')?.closest('p');
    const startText = dateEl?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

    const gameEl = card?.querySelector('i.fa-gamepad')?.closest('p');
    const game = gameEl?.textContent?.replace(/\s+/g, ' ').trim() ?? undefined;

    const url = href.startsWith('http') ? href : `https://truckersmp.com${href}`;
    const coverImage = img.getAttribute('src') || undefined;

    events.push({
      id,
      title,
      startText: startText.replace(/^Starting date\s*/i, ''),
      startAt: parseStartDate(startText.replace(/^Starting date\s*/i, '')),
      game,
      url,
      coverImage,
    });
  }

  // De-dupe by id (page includes duplicates).
  const byId = new Map<number, TruckersmpAttendingEvent>();
  for (const e of events) byId.set(e.id, e);

  return Array.from(byId.values()).sort((a, b) => {
    const at = a.startAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const bt = b.startAt?.getTime() ?? Number.POSITIVE_INFINITY;
    return at - bt;
  });
}

export async function fetchVtcAttendingEvents(vtcSlug: string): Promise<TruckersmpAttendingEvent[]> {
  // Prefer proxy to avoid CORS in dev.
  const res = await fetch(`/truckersmp/vtc/${vtcSlug}/events/attending`, {
    headers: { Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`Failed to load attending events (${res.status})`);
  const html = await res.text();
  return parseVtcAttendingEventsFromHtml(html);
}

export async function fetchTruckersmpEvent(id: number): Promise<any> {
  const res = await fetch(`https://api.truckersmp.com/v2/events/${id}`);
  if (!res.ok) throw new Error(`Failed to load event ${id} (${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error(data.response || 'Failed to load event');
  return data.response;
}

