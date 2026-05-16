import { useEffect, useMemo, useState } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { DashboardCard } from '@/components/DashboardCard';
import { StatCard } from '@/components/StatCard';
import {
  fetchTruckyCompanyJobsAll,
  aggregateDriverRankingsFromJobs,
  completedDeliveryMonthsFromJobs,
  type TruckyJob,
} from '@/lib/trucky';

const RANKING_COMPANY_ID = 44349;
import { TrophyIcon, RouteIcon, BriefcaseIcon, ChevronDownIcon } from 'lucide-react';

type SortKey = 'jobs' | 'distance';

const MEDAL_GRADIENT = [
  'from-yellow-400 to-amber-500 shadow-amber-400/40',
  'from-slate-300 to-slate-400 shadow-slate-300/40',
  'from-amber-600 to-amber-800 shadow-amber-600/30',
];
const RANK_ROW_BG = [
  'bg-yellow-400/5 border border-yellow-400/20 hover:bg-yellow-400/10',
  'bg-slate-300/5 border border-slate-300/20 hover:bg-slate-300/10',
  'bg-amber-700/5 border border-amber-700/20 hover:bg-amber-700/10',
];
const RANK_VALUE_COLOR = [
  'text-yellow-400',
  'text-slate-300',
  'text-amber-500',
];

export function RankingPage() {
  const [sort, setSort] = useState<SortKey>('jobs');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [allJobs, setAllJobs] = useState<TruckyJob[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      try {
        const jobs = await fetchTruckyCompanyJobsAll(RANKING_COMPANY_ID);
        if (!cancelled) setAllJobs(jobs);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setLoadError('Could not load job data for rankings.');
          setAllJobs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const monthYear = useMemo(
    () =>
      timeFilter === 'all'
        ? undefined
        : { year: Number(timeFilter.split('-')[0]), month: Number(timeFilter.split('-')[1]) },
    [timeFilter]
  );

  const availableMonths = useMemo(
    () => (allJobs?.length ? completedDeliveryMonthsFromJobs(allJobs) : []),
    [allJobs]
  );

  const rankings = useMemo(
    () => (allJobs ? aggregateDriverRankingsFromJobs(allJobs, monthYear) : []),
    [allJobs, monthYear]
  );

  const sorted = useMemo(() =>
    [...rankings].sort((a, b) => b[sort] - a[sort]).slice(0, 50),
    [rankings, sort]
  );

  function monthLabel(val: string) {
    const [year, month] = val.split('-');
    return new Date(Number(year), Number(month) - 1, 1)
      .toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }

  const topDriverByJobs = useMemo(() =>
    [...rankings].sort((a, b) => b.jobs - a.jobs)[0], [rankings]);
  const topDriverByDist = useMemo(() =>
    [...rankings].sort((a, b) => b.distance - a.distance)[0], [rankings]);
  const totalJobs = useMemo(() => rankings.reduce((s, d) => s + d.jobs, 0), [rankings]);
  const totalDist = useMemo(() => rankings.reduce((s, d) => s + d.distance, 0), [rankings]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main>
          <Page>

            <div className='flex flex-col gap-1'>
              <h1 className='text-xl font-semibold lg:text-2xl'>Driver rankings</h1>
              <p className='text-sm text-muted-foreground'>
                Each job is counted once. Distance is the sum of km on completed jobs only (not the same as
                counting all job rows or cancelled runs). Cancelled or unfinished jobs are excluded.
              </p>
            </div>

            {loadError && (
              <div
                role='alert'
                className='mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'
              >
                {loadError}
              </div>
            )}

            <div className='grid gap-6 mt-8 sm:grid-cols-2 lg:grid-cols-4'>
              <StatCard
                title='Top driver (jobs)'
                value={topDriverByJobs?.name ?? '—'}
                subtitle={loading ? undefined : `${topDriverByJobs?.jobs ?? 0} completed deliveries`}
                icon={BriefcaseIcon}
                loading={loading}
              />
              <StatCard
                title='Top driver (distance)'
                value={topDriverByDist?.name ?? '—'}
                subtitle={loading ? undefined : `${(topDriverByDist?.distance ?? 0).toLocaleString()} km on completed jobs`}
                icon={RouteIcon}
                loading={loading}
              />
              <StatCard
                title='Period jobs'
                value={loading ? 0 : totalJobs.toLocaleString()}
                subtitle={
                  timeFilter === 'all'
                    ? 'Completed deliveries (all time)'
                    : `${monthLabel(timeFilter)} · completed only`
                }
                icon={BriefcaseIcon}
                loading={loading}
              />
              <StatCard
                title='Period distance'
                value={loading ? '0 km' : `${totalDist.toLocaleString()} km`}
                subtitle={
                  timeFilter === 'all'
                    ? 'Distance on completed jobs'
                    : `${monthLabel(timeFilter)} · completed only`
                }
                icon={RouteIcon}
                loading={loading}
              />
            </div>

            <div className='py-8'>
            <DashboardCard
              title='Leaderboard'
              description='Top 50 drivers by completed jobs or distance. Month filter applies instantly — each job counted once (duplicates from the API are removed).'
              hideFooter
              hideMenu
            >
              {/* Controls inside card */}
              <div className='flex flex-wrap items-center gap-3 mb-6 pt-2'>
                {/* Sort Toggle */}
                <div className='flex items-center bg-muted/30 border border-muted/30 rounded-xl p-1 gap-1'>
                  <button
                    onClick={() => setSort('jobs')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      sort === 'jobs'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BriefcaseIcon className='size-3' />
                    Jobs
                  </button>
                  <button
                    onClick={() => setSort('distance')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      sort === 'distance'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <RouteIcon className='size-3' />
                    Distance
                  </button>
                </div>

                {/* Month selector */}
                <div className='relative'>
                  <select
                    value={timeFilter}
                    onChange={e => setTimeFilter(e.target.value)}
                    className='appearance-none bg-muted/30 border border-muted/30 rounded-xl px-4 py-2 pr-8 text-xs font-bold text-foreground cursor-pointer hover:bg-muted/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30'
                  >
                    <option value='all'>All Time</option>
                    {availableMonths.map(m => (
                      <option key={m} value={m}>{monthLabel(m)}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className='absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none' />
                </div>
              </div>

              {/* Table Header */}
              <div className='grid grid-cols-[40px_40px_1fr_90px_90px] gap-3 px-3 mb-2'>
                <div />
                <div />
                <div className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40'>Driver</div>
                <div className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-right'>Jobs</div>
                <div className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-right'>Distance</div>
              </div>

              {/* Rows */}
              {loading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className='h-14 rounded-xl bg-muted/20 animate-pulse border border-muted/10' />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className='py-20 text-center text-sm text-muted-foreground'>
                  No job data for this period.
                </div>
              ) : (
                <div className='space-y-2'>
                  {sorted.map((driver, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;
                    const rowBg = isTop3 ? RANK_ROW_BG[rank - 1] : 'hover:bg-foreground/[0.02] border border-transparent';
                    const valColor = isTop3 ? RANK_VALUE_COLOR[rank - 1] : 'text-foreground';

                    return (
                      <div
                        key={`${driver.name}-${index}`}
                        className={`grid grid-cols-[40px_40px_1fr_90px_90px] gap-3 items-center px-3 py-3 rounded-xl transition-all ${rowBg}`}
                      >
                        {/* Rank badge */}
                        <div className='flex items-center justify-center'>
                          {isTop3 ? (
                            <div className={`size-8 rounded-lg bg-gradient-to-br ${MEDAL_GRADIENT[rank - 1]} flex items-center justify-center shadow-md`}>
                              <TrophyIcon className='size-3.5 text-white' />
                            </div>
                          ) : (
                            <span className='text-xs font-black text-muted-foreground/40 text-center w-full'>{rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className='size-8 rounded-full overflow-hidden border border-muted/20 bg-muted/30 flex items-center justify-center flex-shrink-0'>
                          {driver.avatar ? (
                            <img src={driver.avatar} alt={driver.name} className='w-full h-full object-cover' />
                          ) : (
                            <span className='text-[11px] font-black text-muted-foreground'>{driver.name.charAt(0)}</span>
                          )}
                        </div>

                        {/* Name */}
                        <div className='min-w-0'>
                          <p className='text-sm font-bold truncate text-foreground/90'>{driver.name}</p>
                        </div>

                        {/* Jobs */}
                        <div className='text-right'>
                          <span className={`text-sm font-black tracking-tight ${sort === 'jobs' ? valColor : 'text-muted-foreground/70'}`}>
                            {driver.jobs}
                          </span>
                          {sort === 'jobs' && <span className='text-[10px] font-bold text-muted-foreground/40 ml-1'>job{driver.jobs !== 1 ? 's' : ''}</span>}
                        </div>

                        {/* Distance */}
                        <div className='text-right'>
                          <span className={`text-sm font-black tracking-tight ${sort === 'distance' ? valColor : 'text-muted-foreground/70'}`}>
                            {driver.distance.toLocaleString()}
                          </span>
                          <span className='text-[10px] font-bold text-muted-foreground/40 ml-0.5'>km</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </DashboardCard>
            </div>

          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
