import { useEffect, useState, useMemo } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { useNavigate } from 'react-router-dom';
import { fetchTruckyJobsPage, type TruckyJob } from '@/lib/trucky';
import { Button } from '@/components/ui/button';

const COMPANY_ID = 44349;
const PAGE_SIZE = 12;
const PAGE_WINDOW = 7;

function visiblePageRange(current: number, total: number): number[] {
  if (!Number.isFinite(current) || !Number.isFinite(total)) return [1];
  const safeTotal = Math.max(1, Math.floor(total));
  const safeCurrent = Math.min(Math.max(1, Math.floor(current)), safeTotal);
  if (safeTotal <= PAGE_WINDOW) return Array.from({ length: safeTotal }, (_, i) => i + 1);
  let start = Math.max(1, safeCurrent - Math.floor(PAGE_WINDOW / 2));
  const end = Math.min(safeTotal, start + PAGE_WINDOW - 1);
  start = Math.max(1, end - PAGE_WINDOW + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function JobsPage() {
  const [jobs, setJobs] = useState<TruckyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      setLoading(true);
      try {
        const r = await fetchTruckyJobsPage(COMPANY_ID, currentPage, PAGE_SIZE);
        if (cancelled) return;
        const safeLastPage = Number.isFinite(r.lastPage) ? Math.max(1, Math.floor(r.lastPage)) : 1;
        const safeTotal = Number.isFinite(r.total) ? Math.max(0, Math.floor(r.total)) : 0;
        setJobs(r.jobs);
        setLastPage(safeLastPage);
        setTotalCount(safeTotal);
        if (currentPage > safeLastPage) {
          setCurrentPage(safeLastPage);
        }
      } catch (error) {
        console.error('Failed to load jobs:', error);
        if (!cancelled) {
          setLoadError('Could not load jobs from Trucky. Try again later.');
          setJobs([]);
          setLastPage(1);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  const pageNumbers = useMemo(
    () => visiblePageRange(currentPage, lastPage),
    [currentPage, lastPage]
  );

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <SidebarProvider className='bg-background'>
      <AppSidebar />

      <SidebarInset className='bg-background'>
        <Header />

        <main className='bg-background'>
          <Page>
            <div className='mt-8 p-6 md:p-8'>
              <div className='mb-8 flex items-start justify-between'>
                <div>
                  <h2 className='text-xl font-bold text-white tracking-tight leading-tight'>Detail informations of jobs</h2>
                  <p className='text-sm text-gray-400 mt-1'>
                    Latest deliveries logged in Trucky.
                  </p>
                </div>
                <Button 
                  variant='outline'
                  className='bg-[#0f0f0f] hover:bg-[#1a1a1a] text-white border-gray-800/50 text-xs px-4 rounded-md'
                  onClick={() => setCurrentPage(1)}
                >
                  View all jobs
                </Button>
              </div>

              {loadError && (
                <div
                  role='alert'
                  className='mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500'
                >
                  {loadError}
                </div>
              )}

              {loading ? (
                <div className='space-y-4'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className='h-16 rounded border border-gray-800/50 bg-gray-900/20 animate-pulse' />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className='rounded border border-gray-800/50 px-6 py-20 text-center text-gray-500 text-sm'>
                  {loadError ? 'No job data loaded.' : 'No jobs found in the logs.'}
                </div>
              ) : (
                <>
                  <div className='w-full overflow-x-auto rounded-xl border border-gray-800/50'>
                    <table className='w-full text-left text-sm text-gray-400'>
                      <thead className='bg-[#0a0a0a] text-xs uppercase text-gray-500 font-bold tracking-wider'>
                        <tr>
                          <th className='px-6 py-4'>#</th>
                          <th className='px-6 py-4'>Driver</th>
                          <th className='px-6 py-4'>Route</th>
                          <th className='px-6 py-4'>Cargo</th>
                          <th className='px-6 py-4 text-right'>Distance</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-800/50'>
                        {jobs.map((job, index) => {
                          const status = job.status?.toLowerCase() || '';
                          let rowStyle = 'hover:bg-white/5 cursor-pointer transition-colors';
                          let indicatorStyle = 'border-l-4 border-transparent';
                          
                          if (status.includes('delivered') || status.includes('done') || status.includes('completed')) {
                            rowStyle += ' bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]';
                            indicatorStyle = 'border-l-4 border-emerald-500';
                          } else if (status.includes('cancel') || status.includes('fail') || status.includes('decline')) {
                            rowStyle += ' bg-red-500/[0.02] hover:bg-red-500/[0.05]';
                            indicatorStyle = 'border-l-4 border-red-500';
                          } else if (status.includes('progress') || status.includes('pending')) {
                            rowStyle += ' bg-yellow-500/[0.02] hover:bg-yellow-500/[0.05]';
                            indicatorStyle = 'border-l-4 border-yellow-500';
                          }

                          // Get distance
                          const r = job.real_distance_km;
                          const p = job.planned_distance_km;
                          const distance = typeof r === 'number' && !Number.isNaN(r) ? Math.round(r) : (typeof p === 'number' && !Number.isNaN(p) ? Math.round(p) : 0);

                          return (
                            <tr 
                              key={job.id} 
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              className={rowStyle}
                            >
                              <td className={`px-6 py-4 whitespace-nowrap text-gray-500 ${indicatorStyle}`}>
                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='flex items-center gap-3'>
                                  <div className='size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0'>
                                    {job.driver?.avatar_url || job.driver?.avatar ? (
                                      <img src={job.driver.avatar_url || job.driver.avatar} alt={job.driver.name} className='w-full h-full object-cover' />
                                    ) : (
                                      <span className='text-xs font-bold text-primary'>{(job.driver?.name || '?').charAt(0)}</span>
                                    )}
                                  </div>
                                  <span className='font-bold text-gray-200'>{job.driver?.name || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-gray-300 font-medium'>
                                {job.source_city_name} <span className='text-gray-600 mx-1'>→</span> {job.destination_city_name}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-gray-400 text-xs'>
                                {job.cargo_name}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-right font-black text-gray-200'>
                                {distance} <span className='text-gray-500 font-normal text-xs ml-1'>km</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {lastPage > 1 && (
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8 pt-8 border-t border-muted/10'>
                      <p className='text-xs text-muted-foreground font-medium'>
                        Showing <span className='text-foreground'>{rangeStart}</span> to{' '}
                        <span className='text-foreground'>{rangeEnd}</span> of{' '}
                        <span className='text-foreground'>{totalCount}</span> entries
                      </p>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8 px-2 rounded-lg border-muted/20 hover:bg-muted/50 transition-all text-xs font-bold'
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className='flex flex-wrap items-center gap-1'>
                          {pageNumbers[0] > 1 && (
                            <>
                              <button
                                type='button'
                                onClick={() => setCurrentPage(1)}
                                className='size-8 rounded-lg text-xs font-bold transition-all hover:bg-muted/50 text-muted-foreground'
                              >
                                1
                              </button>
                              {pageNumbers[0] > 2 && (
                                <span className='px-1 text-xs text-muted-foreground'>…</span>
                              )}
                            </>
                          )}
                          {pageNumbers.map((page) => (
                            <button
                              key={page}
                              type='button'
                              onClick={() => setCurrentPage(page)}
                              className={`size-8 rounded-lg text-xs font-bold transition-all ${
                                currentPage === page
                                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                  : 'hover:bg-muted/50 text-muted-foreground'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          {pageNumbers[pageNumbers.length - 1] < lastPage && (
                            <>
                              {pageNumbers[pageNumbers.length - 1] < lastPage - 1 && (
                                <span className='px-1 text-xs text-muted-foreground'>…</span>
                              )}
                              <button
                                type='button'
                                onClick={() => setCurrentPage(lastPage)}
                                className='size-8 rounded-lg text-xs font-bold transition-all hover:bg-muted/50 text-muted-foreground'
                              >
                                {lastPage}
                              </button>
                            </>
                          )}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8 px-2 rounded-lg border-muted/20 hover:bg-muted/50 transition-all text-xs font-bold'
                          onClick={() => setCurrentPage((prev) => Math.min(lastPage, prev + 1))}
                          disabled={currentPage === lastPage}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
