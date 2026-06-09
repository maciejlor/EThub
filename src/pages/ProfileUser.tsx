import { useEffect, useState } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserIcon, TruckIcon, MapPin, Package, Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentUser, getUsers, type UserEntry } from '@/lib/driver-storage';
import { fetchTruckyCompanyJobsAll, isTruckyJobForUser, type TruckyJob } from '@/lib/trucky';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

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

function formatDate(iso?: string, locale: string = 'en-US') {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso?: string, locale: string = 'en-US') {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProfileUserPage() {
  const { language } = useLanguage();
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';
  const { id } = useParams();
  const navigate = useNavigate();
  const users = getUsers();
  const currentUser = getCurrentUser();
  let user: UserEntry | null = null;
  if (id) {
    if (/^\d+$/.test(id)) {
      const userNumber = Number(id);
      user = users.find((u) => u.profileNumber === userNumber) || null;
      if (!user) {
        const idx = Math.max(0, userNumber - 1);
        user = users[idx] || null;
      }
    } else {
      user = users.find((u) => u.id === id) || null;
    }
  }

  const profileAvatar = user?.avatar || user?.discordAvatar || user?.steamAvatar;
  const [allCompanyJobs, setAllCompanyJobs] = useState<TruckyJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    (async () => {
      try {
        setJobsLoading(true);
        setJobsError(null);
        setCurrentPage(1);
        const jobs = await fetchTruckyCompanyJobsAll(44349);
        if (!cancelled) {
          setAllCompanyJobs(jobs);
        }
      } catch (error) {
        console.error('Failed to load jobs:', error);
        if (!cancelled) {
          setJobsError('Failed to load jobs from Trucky');
          setAllCompanyJobs([]);
        }
      } finally {
        if (!cancelled) {
          setJobsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const filteredUserJobs = useMemo(() => {
    if (!user) return [];
    const filtered = allCompanyJobs.filter((job: TruckyJob) => isTruckyJobForUser(job, {
      displayName: user.displayName,
      username: user.username,
      steamUsername: user.steamUsername,
      steamId: user.steamId,
      truckyId: user.truckyId,
    }));

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.start_date || a.created_at);
      const dateB = new Date(b.start_date || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [allCompanyJobs, user]);

  const totalJobs = filteredUserJobs.length;
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(totalJobs / itemsPerPage));

  const paginatedUserJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUserJobs.slice(start, start + itemsPerPage);
  }, [filteredUserJobs, currentPage]);

  const pageNumbers = useMemo(
    () => visiblePageRange(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (!user) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background">
          <Header />
          <main className="bg-background">
            <Page>
              <div className="text-center py-16">User not found.</div>
            </Page>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <Header />
        <main className="bg-background">
          <Page>
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="relative w-full h-[320px] md:h-[380px] bg-black">
                {user.coverImage ? (
                  <>
                    <img src={user.coverImage} alt="cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-slate-800" />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute left-8 bottom-6 flex items-center gap-4">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="avatar" className="w-36 h-36 rounded-lg border border-white/30 object-cover" />
                  ) : (
                    <div className="w-36 h-36 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                      <UserIcon className="h-8 w-8" />
                    </div>
                  )}
                  <div className="text-white">
                    <div className="text-3xl font-bold">{user.displayName}</div>

                    <div className="mt-2 text-sm">Member since: {formatDate(user.createdAt, locale)}</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4">
                  <Badge className="text-sm border">{user.role}</Badge>

                  <div className="ml-auto flex gap-2">
                    <Button asChild>
                      <a href={`https://truckersmp.com/players?search=${encodeURIComponent(user.displayName)}`} target="_blank" rel="noreferrer" className="h-9 px-3">TMP</a>
                    </Button>
                    <Button asChild>
                      <a href={user.steamId ? (user.steamId.startsWith('http') ? user.steamId : `https://steamcommunity.com/profiles/${user.steamId}`) : '#'} target="_blank" rel="noreferrer" className="h-9 px-3">Steam</a>
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground">Total Jobs</div>
                    <div className="text-lg font-bold">
                      {jobsLoading ? '…' : totalJobs.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground">Last Login</div>
                    {currentUser && user && currentUser.id === user.id ? (
                      <div className="text-lg font-bold text-green-500 flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Active now
                      </div>
                    ) : (
                      <div className="text-lg font-bold">{formatDateTime(user.lastLogin, locale)}</div>
                    )}
                  </div>

                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TruckIcon className="h-5 w-5" />
                    Jobs from Trucky
                  </h3>
                  {jobsError ? (
                    <div className="text-center py-8 text-red-500">{jobsError}</div>
                  ) : jobsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
                  ) : paginatedUserJobs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No jobs found for this user.</div>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground mb-4">
                        Showing {paginatedUserJobs.length} of {totalJobs} total jobs (filtered for this user)
                      </div>
                      <div className="space-y-3">
                        {paginatedUserJobs.map((job) => {
                          const status = job.status?.toLowerCase() || '';
                          let statusColor: "default" | "secondary" | "destructive" | "outline" = 'secondary';
                          let gradientClass = '';

                          if (status.includes('delivered') || status.includes('completed') || status.includes('finished') || status.includes('done')) {
                            statusColor = 'default';
                            gradientClass = 'bg-gradient-to-l from-green-500/10 to-transparent hover:from-green-500/20 border-r-2 border-r-green-500';
                          } else if (status.includes('cancel') || status.includes('fail') || status.includes('abort')) {
                            statusColor = 'destructive';
                            gradientClass = 'bg-gradient-to-l from-red-500/10 to-transparent hover:from-red-500/20 border-r-2 border-r-red-500';
                          } else if (status.includes('progress') || status.includes('active') || status.includes('pending') || status.includes('ongoing')) {
                            statusColor = 'outline';
                            gradientClass = 'bg-gradient-to-l from-yellow-500/10 to-transparent hover:from-yellow-500/20 border-r-2 border-r-yellow-500';
                          }

                          return (
                            <div
                              key={job.id}
                              className={`p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer ${gradientClass || 'bg-background border-border'}`}
                              onClick={() => navigate(`/jobs/${job.id}`)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium">{job.source_city_name}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="font-medium">{job.destination_city_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <Package className="h-4 w-4 flex-shrink-0" />
                                    <span>{job.cargo_name}</span>
                                    {job.cargo_weight && <span>• {job.cargo_weight}t</span>}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span>{formatDate(job.start_date || job.created_at, locale)}</span>
                                    {job.planned_distance_km && <span>• {job.planned_distance_km.toLocaleString()} km</span>}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <Badge variant={statusColor}>
                                    {job.status || 'Unknown'}
                                  </Badge>
                                  {job.revenue && (
                                    <div className="mt-2 text-sm font-semibold text-green-600">
                                      ${job.revenue.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-6 pt-6 border-t border-muted/10">
                          <p className="text-xs text-muted-foreground font-medium">
                            Showing <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="text-foreground">{Math.min(currentPage * itemsPerPage, totalJobs)}</span> of{' '}
                            <span className="text-foreground">{totalJobs}</span> entries
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 rounded-lg border-muted/20 hover:bg-muted/50 transition-all text-xs font-bold flex items-center"
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="size-3.5 mr-1" />
                              Previous
                            </Button>
                            <div className="flex flex-wrap items-center gap-1">
                              {pageNumbers[0] > 1 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setCurrentPage(1)}
                                    className="size-8 rounded-lg text-xs font-bold transition-all hover:bg-muted/50 text-muted-foreground"
                                  >
                                    1
                                  </button>
                                  {pageNumbers[0] > 2 && (
                                    <span className="px-1 text-xs text-muted-foreground">…</span>
                                  )}
                                </>
                              )}
                              {pageNumbers.map((page) => (
                                <button
                                  key={page}
                                  type="button"
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
                              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                                <>
                                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                                    <span className="px-1 text-xs text-muted-foreground">…</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="size-8 rounded-lg text-xs font-bold transition-all hover:bg-muted/50 text-muted-foreground"
                                  >
                                    {totalPages}
                                  </button>
                                </>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 rounded-lg border-muted/20 hover:bg-muted/50 transition-all text-xs font-bold flex items-center"
                              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                              <ChevronRight className="size-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
