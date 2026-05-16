import type { ReactNode } from 'react';
import type { LoaStatus } from '@/lib/loa-storage';

/** Matches dashboard job table rows (DashboardTable getStatusClass). */
function loaRowStatusClass(status: LoaStatus): string {
  if (status === 'approved')
    return 'bg-gradient-to-l from-green-500/10 to-transparent hover:from-green-500/20 border-r-2 border-r-green-500';
  if (status === 'rejected')
    return 'bg-gradient-to-l from-red-500/10 to-transparent hover:from-red-500/20 border-r-2 border-r-red-500';
  return 'bg-gradient-to-l from-yellow-500/10 to-transparent hover:from-yellow-500/20 border-r-2 border-r-yellow-500';
}

function defaultEyebrow(status: LoaStatus): string {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending review';
}

export function LoaRequestCard({
  status,
  headerTitle,
  headerEyebrow,
  children,
  footer,
  className,
}: {
  status: LoaStatus;
  headerTitle: string;
  headerEyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const eyebrow = headerEyebrow ?? defaultEyebrow(status);
  return (
    <article
      className={[
        'group rounded-xl border border-muted/15 bg-background text-left shadow-sm overflow-hidden transition-colors',
        loaRowStatusClass(status),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className='px-4 py-4 sm:px-5 sm:py-5'>
        <p className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40'>
          {eyebrow}
        </p>
        <h2 className='text-sm font-bold text-foreground/90 mt-1.5 transition-colors group-hover:text-primary'>
          {headerTitle}
        </h2>
        <div className='mt-3 text-sm space-y-2'>{children}</div>
      </div>
      {footer != null && (
        <div className='border-t border-muted/15 px-4 py-3 sm:px-5 bg-muted/10'>{footer}</div>
      )}
    </article>
  );
}
