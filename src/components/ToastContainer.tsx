import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast, type Toast, type ToastType } from '@/lib/toast';
import { XIcon, InfoIcon, CheckCircle2Icon, AlertTriangleIcon, XCircleIcon } from 'lucide-react';

/* ─── per-type style maps ────────────────────────────────────────── */
const TYPE_MAP: Record<
  ToastType,
  { icon: React.ElementType; iconBg: string; iconColor: string; bar: string }
> = {
  info: {
    icon: InfoIcon,
    iconBg: 'bg-indigo-600/20',
    iconColor: 'text-indigo-400',
    bar: 'bg-indigo-500',
  },
  success: {
    icon: CheckCircle2Icon,
    iconBg: 'bg-emerald-600/20',
    iconColor: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  warning: {
    icon: AlertTriangleIcon,
    iconBg: 'bg-amber-600/20',
    iconColor: 'text-amber-400',
    bar: 'bg-amber-500',
  },
  error: {
    icon: XCircleIcon,
    iconBg: 'bg-red-700/20',
    iconColor: 'text-red-400',
    bar: 'bg-red-600',
  },
};

/* ─── single toast card ──────────────────────────────────────────── */
function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { icon: Icon, iconBg, iconColor, bar } = TYPE_MAP[toast.type];
  const duration = toast.duration ?? 4000;

  // slide-in state
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // progress-bar animation driven by CSS; we restart it via key
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!barRef.current || duration <= 0) return;
    const el = barRef.current;
    el.style.transition = 'none';
    el.style.width = '100%';
    requestAnimationFrame(() => {
      el.style.transition = `width ${duration}ms linear`;
      el.style.width = '0%';
    });
  }, [duration]);

  return (
    <div
      className="pointer-events-auto"
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      }}
    >
      <div
        className="relative w-80 overflow-hidden rounded-xl border border-white/5 bg-[#141414] shadow-2xl"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 1.5px 0 rgba(255,255,255,0.04) inset' }}
      >
        {/* main row */}
        <div className="flex items-start gap-3 px-4 py-3.5">
          {/* icon bubble */}
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>

          {/* text */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-tight text-white truncate">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-0.5 text-[11.5px] leading-snug text-zinc-400 line-clamp-2">
                {toast.message}
              </p>
            )}
          </div>

          {/* close */}
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-1 mt-0.5 shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* progress bar */}
        {duration > 0 && (
          <div className="h-[2px] w-full bg-white/5">
            <div ref={barRef} className={`h-full ${bar}`} style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── portal container ───────────────────────────────────────────── */
export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return createPortal(
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-2"
      style={{ maxWidth: '320px', width: '100%' }}
    >
      {toasts.map(t => (
        <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>,
    document.body
  );
}
