import { useEffect, useState } from 'react';
import {
  CalendarIcon,
  TrophyIcon,
  LayersIcon,
  MapIcon,
  ArrowRightIcon
} from 'lucide-react';

import { type UpcomingEvent, fetchTruckersmpEvent } from '@/lib/truckersmp';
import { DashboardCard } from '@/components/DashboardCard';
import defaultBanner from '@/assets/Eteventhub.png';
import { useLanguage } from '@/components/LanguageProvider';

interface TmpEventDetail {
  name: string;
  banner?: string;
  startAt: string;
  url: string;
  game: string;
  server: string;
  routeSource: string;
  routeDest: string;
}

export function UpcomingConvoyCard({ events = [] }: { events: UpcomingEvent[] }) {
  const { t } = useLanguage();
  const [detail, setDetail] = useState<TmpEventDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const safeEvents = Array.isArray(events) ? events : [];

  const sortedEvents = [...safeEvents]
    .filter(e =>
      e.startDate &&
      new Date(e.startDate) > new Date(now.getTime() - 4 * 60 * 60 * 1000)
    )
    .sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  const next = sortedEvents[0] || safeEvents[0];

  useEffect(() => {
    if (!next?.id) return;

    setLoading(true);

    fetchTruckersmpEvent(next.id)
      .then(r => {
        if (r) {
          const departure = r.departure;
          const arrival = r.arrive || r.arrival;

          setDetail({
            name: r.name || next.name || 'Convoy',
            banner: r.banner || next.bannerUrl || undefined,
            startAt: r.start_at || next.startDate || '',
            url: `https://truckersmp.com/events/${next.id}`,
            game: r.game || next.game || 'ETS2',
            server: r.server?.name || next.server || t('To be determined'),
            routeSource: departure?.city ? `${departure.city}${departure.location ? ` (${departure.location})` : ''}` : next.departureCity || 'TBD',
            routeDest: arrival?.city ? `${arrival.city}${arrival.location ? ` (${arrival.location})` : ''}` : next.arrivalCity || 'TBD',
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch event metadata:', err);
        setLoading(false);
      });
  }, [next?.id]);

  if (!next && !loading) {
    return (
      <DashboardCard title='' description='' className='h-[600px]' hideHeader>
        <div className='flex flex-col items-center justify-center h-full text-muted-foreground/50'>
          <CalendarIcon className='size-16 mb-6 opacity-50' />
          <p className='text-xl font-bold tracking-tight'>
            {t('No upcoming convoys')}
          </p>
        </div>
      </DashboardCard>
    );
  }

  if (loading) {
    return (
      <DashboardCard title='' description='' className='h-[600px]' noPadding hideHeader>
        <div className='w-full h-full animate-pulse flex flex-col'>
          <div className='h-60 bg-muted/20 shrink-0' />
          <div className='p-8 space-y-8 flex-1'>
            <div className='h-8 bg-muted/20 rounded-lg w-3/4 mx-auto' />
            <div className='space-y-6 mt-12'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='h-6 bg-muted/20 rounded w-1/2 mx-auto' />
              ))}
            </div>
          </div>
        </div>
      </DashboardCard>
    );
  }

  const d = detail;
  const displayName = d?.name ?? next?.name ?? 'Convoy';
  let rawDateStr = d?.startAt || next?.startDate;
  if (rawDateStr && !rawDateStr.toUpperCase().includes('UTC') && !rawDateStr.toUpperCase().includes('Z') && !rawDateStr.includes('+')) {
    rawDateStr += ' UTC';
  }
  const parsedDate = rawDateStr ? new Date(rawDateStr) : null;

  const displayDate = (parsedDate && !isNaN(parsedDate.getTime()))
    ? `${parsedDate.toLocaleString('en-GB', { day: 'numeric', month: 'short' })}, ${parsedDate.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false })} UTC`
    : (rawDateStr || t('To be determined'));

  const gameTitle = (d?.game || next?.game) === 'ATS' 
    ? t('American Truck Simulator') 
    : t('Euro Truck Simulator 2');

  const banner = d?.banner || next?.bannerUrl || defaultBanner;

  return (
    <DashboardCard title='' description='' className='h-[600px]' noPadding hideFooter hideHeader>
      <div className='flex flex-col relative group h-full w-full overflow-hidden transition-all duration-500 rounded-b-xl'>
        {/* 1. Banner */}
        <div className='relative aspect-[21/9] shrink-0 bg-muted/10 overflow-hidden'>
          <img
            src={banner}
            alt={displayName}
            className='absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10' />
        </div>

        {/* Content Section */}
        <div className='flex flex-1 flex-col p-5 relative z-20 bg-background'>
          {/* 2. <Name Convoy> */}
          <a 
            href={d?.url || `https://truckersmp.com/events/${next?.id}`} 
            target='_blank' 
            rel='noopener noreferrer'
            className='block'
          >
            <h3 className='text-foreground text-lg font-bold tracking-tight mb-4 leading-tight line-clamp-2 text-center hover:text-primary transition-colors cursor-pointer'>
              {displayName}
            </h3>
          </a>

          <div className='space-y-3 flex-1 flex flex-col justify-center px-1'>
            {/* 3. Date */}
            <InfoRow icon={CalendarIcon} text={displayDate} />
            
            {/* 4. Game */}
            <InfoRow icon={TrophyIcon} text={gameTitle} />
            
            {/* 5. Server */}
            <InfoRow icon={LayersIcon} text={d?.server || next?.server || t('To be determined')} />
            
            {/* 6. Route */}
            <InfoRow 
              icon={MapIcon} 
              text={`${d?.routeSource || next?.departureCity || 'TBD'} → ${d?.routeDest || next?.arrivalCity || 'TBD'}`} 
            />
          </div>

          <div className='mt-4 pt-4 border-t flex justify-center'>
            <a
              href={d?.url || `https://truckersmp.com/events/${next?.id}`}
              target='_blank'
              rel='noopener noreferrer'
              className='group/link inline-flex items-center gap-3 text-primary font-bold uppercase tracking-[0.2em] text-[10px] hover:text-primary/80 transition-all bg-primary/10 px-5 py-2.5 rounded-xl'
            >
              {t('View info')}
              <ArrowRightIcon className='size-3.5 transition-transform group-hover/link:translate-x-1' />
            </a>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

function InfoRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className='flex items-center gap-4 text-muted-foreground'>
      <div className='p-2 rounded-lg bg-primary/10 text-primary shrink-0'>
        <Icon className='size-5' strokeWidth={2.5} />
      </div>
      <span className='text-[15px] font-bold tracking-tight truncate text-foreground'>
        {text}
      </span>
    </div>
  );
}
