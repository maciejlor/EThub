import { CalendarIcon, ClockIcon, MapPinIcon, BoxIcon, DiscIcon } from 'lucide-react';
import { truckyJobDistanceKm, type TruckyJob } from '@/lib/trucky';

function dlcLabel(job: TruckyJob): string | null {
  if (job.dlc) {
    if (typeof job.dlc === 'string' && job.dlc.trim()) return job.dlc;
    if (Array.isArray(job.dlc)) return job.dlc.join(', ');
    if (typeof job.dlc === 'object' && (job.dlc as any)?.name) return (job.dlc as any).name;
  }
  const extra = job as unknown as Record<string, unknown>;
  for (const k of ['required_dlc', 'dlc_name', 'required_dlcs']) {
    const v = extra[k];
    if (typeof v === 'string' && v.trim()) return v;
    if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v.join(', ');
  }
  return null;
}

function statusAccent(status?: string): string {
  const s = status?.toLowerCase() || '';
  if (
    s.includes('delivered') ||
    s.includes('done') ||
    s.includes('completed') ||
    s.includes('finished')
  )
    return 'ring-1 ring-green-500/40 border-green-500/20';
  if (s.includes('cancel') || s.includes('declin') || s.includes('fail') || s.includes('abort'))
    return 'ring-1 ring-red-500/40 border-red-500/20';
  if (s.includes('pending') || s.includes('progress') || s.includes('active'))
    return 'ring-1 ring-yellow-500/40 border-yellow-500/20';
  return 'border-border/80';
}

export function JobListCard({
  job,
  onNavigate,
}: {
  job: TruckyJob;
  onNavigate: (id: number) => void;
}) {
  const ref = job.start_date || job.created_at;
  const refDate = ref ? new Date(ref) : null;
  const dateStr = refDate
    ? refDate.toLocaleDateString(undefined, { dateStyle: 'medium' })
    : '—';
  const timeStr = refDate
    ? refDate.toLocaleTimeString(undefined, { timeStyle: 'short' })
    : '—';
  const rawDlc = dlcLabel(job) ?? job.map ?? job.game ?? '—';
  const displayDlc = typeof rawDlc === 'string' ? rawDlc : JSON.stringify(rawDlc);
  const distance = truckyJobDistanceKm(job);

  return (
    <article
      role='button'
      tabIndex={0}
      aria-label={`Job: ${job.cargo_name}, ${job.source_city_name} to ${job.destination_city_name}`}
      onClick={() => onNavigate(job.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate(job.id);
        }
      }}
      className={`
        rounded-2xl border bg-card shadow-sm overflow-hidden text-left cursor-pointer
        transition-all hover:shadow-md hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
        ${statusAccent(job.status)}
      `}
    >
      <div className='relative h-32 sm:h-36 overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/35 via-muted/60 to-muted/90' />
        <div className='absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_30%_-10%,white,transparent_55%)]' />
        <div className='absolute bottom-4 left-4 right-4'>
          <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60'>Delivery</p>
          <h2 className='font-bold text-xl sm:text-2xl leading-tight tracking-tight text-foreground line-clamp-2 mt-1.5'>
            {job.cargo_name}
          </h2>
        </div>
      </div>

      <div className='px-4 pt-4 pb-4 space-y-2'>
        <div className='flex items-center gap-2 text-sm'>
          <CalendarIcon size={13} className='text-primary shrink-0' />
          <span className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wide'>Date</span>
          <span className='ml-auto font-semibold text-xs'>{dateStr}</span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <ClockIcon size={13} className='text-primary shrink-0' />
          <span className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wide'>Time</span>
          <span className='ml-auto font-semibold text-xs'>{timeStr}</span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <MapPinIcon size={13} className='text-primary shrink-0' />
          <span className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wide'>City</span>
          <span className='ml-auto font-semibold text-xs text-right max-w-[65%]'>
            {job.source_city_name}{' '}
            <span className='text-muted-foreground/50 font-normal'>→</span>{' '}
            {job.destination_city_name}
          </span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <DiscIcon size={13} className='text-primary shrink-0' />
          <span className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wide'>DLC</span>
          <span className='ml-auto font-semibold text-xs text-right max-w-[60%]'>{displayDlc}</span>
        </div>
      </div>

      <div className='px-4 py-3 border-t border-border/60 bg-muted/20 flex items-center gap-3'>
        <div className='size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 overflow-hidden'>
          {job.driver?.avatar_url || job.driver?.avatar ? (
            <img
              src={job.driver.avatar_url || job.driver.avatar}
              alt={job.driver?.name ?? 'Driver'}
              className='w-full h-full object-cover'
            />
          ) : (
            job.driver?.name?.charAt(0) || '?'
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-[11px] font-bold truncate'>{job.driver?.name ?? 'Unknown'}</p>
          <p className='text-[10px] text-muted-foreground flex items-center gap-1'>
            <BoxIcon size={10} />
            <span>{distance} km</span>
            {job.status && (
              <>
                <span className='text-muted-foreground/40'>·</span>
                <span className='capitalize truncate'>{job.status}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
