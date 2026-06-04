import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Card } from '@/components/ui/card';
import { fetchTruckersmpEvent, type TruckersmpEvent } from '@/lib/truckersmp';
import {
  ArrowLeftIcon, MapPinIcon, GamepadIcon,
  GlobeIcon, CalendarIcon, ExternalLinkIcon, ClockIcon,
} from 'lucide-react';

/* ─── Time helpers ──────────────────────────────────────────────────────── */

const formatBannerTime = (iso?: string) => {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'TBD';
  const weekday = d.toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const month   = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const day     = d.getUTCDate().toString();
  const time    = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
  return `${weekday}, ${month} ${day} · ${time} UTC`;
};

const formatDetailTime = (iso?: string) => {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'TBD';
  return d.toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  }) + ' UTC';
};

/* ─── Rich Markdown renderer ────────────────────────────────────────────── */
/**
 * Renders TruckersMP-style event description Markdown:
 *  - [![alt](img)](href)  → clickable image link
 *  - ![alt](url)          → image
 *  - [text](url)          → link
 *  - **text**             → bold
 *  - *text*               → italic
 *  - >text                → blockquote
 *  - ---+ (3 or more -)   → horizontal rule
 *  - blank lines          → paragraph breaks
 */

let _mdKey = 0;
const k = () => _mdKey++;

function renderMarkdown(raw: string): React.ReactNode[] {
  _mdKey = 0;
  const nodes: React.ReactNode[] = [];

  // Split into lines and process
  const lines = raw.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) { i++; continue; }

    // Horizontal rule: 3+ dashes (possibly mixed with spaces)
    if (/^-[\s-]{2,}$/.test(trimmed) || /^-{3,}$/.test(trimmed)) {
      nodes.push(
        <hr key={k()} style={{
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          margin: '20px 0',
        }} />
      );
      i++;
      continue;
    }

    // Blockquote lines: > text (can span multiple consecutive > lines)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      nodes.push(
        <blockquote key={k()} style={{
          borderLeft: '3px solid rgba(99,102,241,0.4)',
          paddingLeft: '16px',
          margin: '12px 0',
          color: '#b0b8c8',
        }}>
          {quoteLines.map(ql => (
            <span key={k()} style={{ display: 'block', lineHeight: '1.75' }}>
              {parseInline(ql)}
            </span>
          ))}
        </blockquote>
      );
      continue;
    }

    // Standalone image line: ![alt](url)  or linked image: [![alt](img)](href)
    const linkedImgMatch = trimmed.match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)$/);
    if (linkedImgMatch) {
      nodes.push(
        <a key={k()} href={linkedImgMatch[3]} target='_blank' rel='noopener noreferrer'
           style={{ display: 'block', margin: '10px 0' }}>
          <img src={linkedImgMatch[2]} alt={linkedImgMatch[1]}
               style={{ maxWidth: '100%', borderRadius: '10px', display: 'block',
                        border: '1px solid rgba(255,255,255,0.08)',
                        transition: 'opacity 0.2s' }}
               onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
               onMouseLeave={e => (e.currentTarget.style.opacity = '1')} />
        </a>
      );
      i++;
      continue;
    }

    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      nodes.push(
        <div key={k()} style={{ margin: '10px 0' }}>
          <img src={imgMatch[2]} alt={imgMatch[1]}
               style={{ maxWidth: '100%', borderRadius: '10px', display: 'block',
                        border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
      );
      i++;
      continue;
    }

    // Normal text line — collect consecutive non-special lines into a paragraph
    const paraLines: string[] = [];
    while (i < lines.length) {
      const pl = lines[i].trim();
      if (!pl) break;
      if (/^-[\s-]{2,}$/.test(pl) || /^-{3,}$/.test(pl)) break;
      if (pl.startsWith('>')) break;
      if (/^\[?!\[/.test(pl)) break;  // image or linked-image line
      paraLines.push(pl);
      i++;
    }

    if (paraLines.length > 0) {
      nodes.push(
        <p key={k()} style={{ margin: '10px 0', lineHeight: '1.8', color: '#b0b8c8' }}>
          {paraLines.map((pl, idx) => (
            <span key={k()}>
              {idx > 0 && <br />}
              {parseInline(pl)}
            </span>
          ))}
        </p>
      );
    }
  }

  return nodes;
}

/**
 * Parse inline markdown tokens: linked images, images, links, bold, italic.
 * Handles nested content like [![](img)](url) inline too.
 */
function parseInline(text: string): React.ReactNode[] {
  // Order: linked image → image → link → bold → italic
  const pattern = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)|!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]*)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Text before match
    if (match.index > last) {
      nodes.push(<span key={k()}>{text.slice(last, match.index)}</span>);
    }

    if (match[1] !== undefined || match[2] !== undefined ? match[0].startsWith('[![') : false) {
      // Linked image: [![alt](img)](href)
      nodes.push(
        <a key={k()} href={match[3]} target='_blank' rel='noopener noreferrer'
           style={{ display: 'inline-block' }}>
          <img src={match[2]} alt={match[1]}
               style={{ maxWidth: '100%', borderRadius: '10px', display: 'block',
                        border: '1px solid rgba(255,255,255,0.08)',
                        transition: 'opacity 0.2s' }}
               onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
               onMouseLeave={e => (e.currentTarget.style.opacity = '1')} />
        </a>
      );
    } else if (match[4] !== undefined) {
      // Image: ![alt](url)
      nodes.push(
        <img key={k()} src={match[5]} alt={match[4]}
             style={{ maxWidth: '100%', borderRadius: '10px', display: 'block',
                      margin: '6px 0', border: '1px solid rgba(255,255,255,0.08)' }} />
      );
    } else if (match[6] !== undefined) {
      // Link: [text](url)
      nodes.push(
        <a key={k()} href={match[7]} target='_blank' rel='noopener noreferrer'
           style={{ color: '#818cf8', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
          {match[6]}
        </a>
      );
    } else if (match[8] !== undefined) {
      // Bold: **text**
      nodes.push(<strong key={k()} style={{ color: '#fff', fontWeight: 700 }}>{match[8]}</strong>);
    } else if (match[9] !== undefined) {
      // Italic: *text*
      nodes.push(<em key={k()} style={{ color: '#c4c9d4', fontStyle: 'italic' }}>{match[9]}</em>);
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(<span key={k()}>{text.slice(last)}</span>);
  }

  return nodes;
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export function CalendarEventPage() {
  const params  = useParams();
  const eventId = useMemo(() => Number(params.id), [params.id]);

  const [eventData, setEventData] = useState<TruckersmpEvent | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    fetchTruckersmpEvent(eventId)
      .then(setEventData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  const departure = eventData?.departure?.city || 'TBD';
  const arrival   = eventData?.arrival?.city || eventData?.arrive?.city || 'TBD';
  const gameLabel = eventData?.game?.includes('truck')
    ? (eventData.game.includes('euro') ? 'Euro Truck Simulator 2' : 'American Truck Simulator')
    : (eventData?.game || 'ETS2');
  const gameShort = eventData?.game?.includes('truck')
    ? (eventData.game.includes('euro') ? 'ETS2' : 'ATS')
    : (eventData?.game || 'ETS2');

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main style={{ background: '#050505', minHeight: '100vh', color: '#fff' }}>
          {loading ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Hero Skeleton */}
              <div style={{ height: '380px', background: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: '40px', left: '0', right: '0', maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem', width: '100%' }}>
                  <div className="animate-pulse" style={{ height: '14px', width: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1.5rem' }} />
                  <div className="animate-pulse" style={{ height: '48px', width: '70%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1.5rem' }} />
                  <div className="animate-pulse" style={{ height: '32px', width: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px' }} />
                </div>
              </div>
              
              {/* Content Skeleton */}
              <div style={{ maxWidth: '80rem', margin: '0 auto', width: '100%', padding: '2.5rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '2rem' }}>
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <Card className="animate-pulse" style={{ height: '300px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} />
                    <Card className="animate-pulse" style={{ height: '200px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Card className="animate-pulse" style={{ height: '250px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }} />
                    <div className="animate-pulse" style={{ height: '44px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <Page>
              <div style={{ borderRadius: '1rem', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.1)', padding: '2rem', textAlign: 'center', marginTop: '1.5rem' }}>
                <h3 style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.5rem' }}>Error</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{error}</p>
              </div>
            </Page>
          ) : !eventData ? (
            <Page>
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', marginTop: '1.5rem' }}>Event not found.</div>
            </Page>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

              {/* ── HERO BANNER ─────────────────────────────────────── */}
              <div style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                minHeight: '380px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                borderBottom: '1px solid #111',
              }}>
                {/* Background image */}
                {eventData.banner && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <img
                      src={eventData.banner}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
                    />
                  </div>
                )}

                {/* Multi-layer gradient overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1,
                  background: [
                    'linear-gradient(to bottom, rgba(5,5,5,0.15) 0%, rgba(5,5,5,0.0) 20%, rgba(5,5,5,0.55) 65%, rgba(5,5,5,1) 100%)',
                    'linear-gradient(to right, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.3) 40%, rgba(5,5,5,0) 70%)',
                  ].join(', '),
                }} />

                {/* Coloured accent line at bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  zIndex: 3,
                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%)',
                  opacity: 0.7,
                }} />

                {/* Content */}
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  maxWidth: '80rem',
                  margin: '0 auto',
                  width: '100%',
                  padding: '3rem 1.5rem 2.5rem',
                }}>
                  {/* Back */}
                  <Link
                    to='/calendar'
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#9ca3af',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      textDecoration: 'none',
                      marginBottom: '2.5rem',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                  >
                    <ArrowLeftIcon size={13} />
                    Back to events
                  </Link>

                  {/* Game badge only (no attending) */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 10px',
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      background: 'rgba(99,102,241,0.18)',
                      border: '1px solid rgba(99,102,241,0.35)',
                      borderRadius: '6px',
                      color: '#a5b4fc',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                    }}>
                      {gameShort}
                    </span>
                    {eventData.event_type?.name && (
                      <span style={{
                        padding: '3px 10px',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#d1d5db',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}>
                        {eventData.event_type.name}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 style={{
                    fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                    fontWeight: 900,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    maxWidth: '700px',
                    marginBottom: '1.25rem',
                    textShadow: '0 2px 20px rgba(0,0,0,0.6)',
                  }}>
                    {eventData.name}
                  </h1>

                  {/* Route: City → City */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(0,0,0,0.45)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    marginBottom: '1.25rem',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <MapPinIcon size={13} color='#6366f1' />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.03em' }}>
                      {departure}
                    </span>
                    <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>→</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e5e7eb' }}>
                      {arrival}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600 }}>
                      <CalendarIcon size={14} color='#6b7280' />
                      {formatBannerTime(eventData.start_at)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600 }}>
                      <GlobeIcon size={14} color='#6b7280' />
                      {eventData.server?.name || 'Server TBD'}
                    </div>
                    {eventData.vtc?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>VTC</span>
                        {eventData.vtc.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── MAIN CONTENT ────────────────────────────────────── */}
              <div style={{ maxWidth: '80rem', margin: '0 auto', width: '100%', padding: '2.5rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '2rem' }}>

                  {/* Left: Description + Route */}
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Description */}
                    <Card style={{
                      padding: '2rem',
                      borderRadius: '1rem',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <h2 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Description
                      </h2>
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        {eventData.description
                          ? renderMarkdown(eventData.description)
                          : <span style={{ color: '#4b5563', fontStyle: 'italic' }}>No description provided.</span>
                        }
                      </div>
                    </Card>

                    {/* Route Timeline */}
                    <Card style={{
                      padding: '2rem',
                      borderRadius: '1rem',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <h2 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', marginBottom: '1.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Route
                      </h2>

                      <div style={{ position: 'relative' }}>
                        {/* Gradient vertical bar */}
                        <div style={{
                          position: 'absolute',
                          left: '19px',
                          top: '40px',
                          bottom: '40px',
                          width: '2px',
                          background: 'linear-gradient(to bottom, #6366f1, #06b6d4)',
                          borderRadius: '2px',
                        }} />

                        {/* Departure */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 0 16px rgba(99,102,241,0.4)',
                          }}>
                            <MapPinIcon size={18} color='#fff' />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Departure</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{eventData.departure?.city || 'TBD'}</div>
                            {eventData.departure?.location && (
                              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>{eventData.departure.location}</div>
                            )}
                          </div>
                        </div>

                        {/* Arrival */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 0 16px rgba(6,182,212,0.4)',
                          }}>
                            <MapPinIcon size={18} color='#fff' />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Arrival</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                              {eventData.arrival?.city || eventData.arrive?.city || 'TBD'}
                            </div>
                            {(eventData.arrival?.location || eventData.arrive?.location) && (
                              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                                {eventData.arrival?.location || eventData.arrive?.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Right: Details + Links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Details card */}
                    <Card style={{
                      padding: '1.5rem',
                      borderRadius: '1rem',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        Event Details
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Game */}
                        <DetailRow icon={<GamepadIcon size={15} />} label='Game' value={gameLabel} />

                        {/* Server */}
                        <DetailRow icon={<GlobeIcon size={15} />} label='Server' value={eventData.server?.name || 'TBD'} />

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                        {/* Meetup */}
                        {eventData.meetup_at && (
                          <DetailRow icon={<ClockIcon size={15} />} label='Meetup' value={formatDetailTime(eventData.meetup_at)} />
                        )}

                        {/* Start */}
                        <DetailRow icon={<CalendarIcon size={15} />} label='Start' value={eventData.start_at ? formatDetailTime(eventData.start_at) : 'TBD'} accent />

                        {/* VTC */}
                        {eventData.vtc?.name && (
                          <>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                            <DetailRow icon={<GlobeIcon size={15} />} label='Organiser VTC' value={eventData.vtc.name} />
                          </>
                        )}
                      </div>
                    </Card>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <a
                        href={`https://truckersmp.com/events/${eventId}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '11px 20px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          letterSpacing: '0.02em',
                          boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        View on TruckersMP
                        <ExternalLinkIcon size={14} />
                      </a>

                      {eventData.url && (
                        <a
                          href={eventData.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '11px 20px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#d1d5db',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            transition: 'background 0.2s, border-color 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                          More Info
                          <ExternalLinkIcon size={13} />
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

/* ─── Reusable detail row ────────────────────────────────────────────────── */
function DetailRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px',
        background: accent ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${accent ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent ? '#818cf8' : '#6b7280',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: accent ? '#a5b4fc' : '#e5e7eb', fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  );
}
