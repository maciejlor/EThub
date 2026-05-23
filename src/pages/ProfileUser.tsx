import { useEffect, useState } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserIcon, TruckIcon, MapPin, Package, Calendar, ChevronDown } from 'lucide-react';
import { getUsers, type UserEntry } from '@/lib/driver-storage';
import { fetchTruckyJobsPage, isTruckyJobForUser, type TruckyJob } from '@/lib/trucky';
import { useParams, useNavigate } from 'react-router-dom';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso?: string) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProfileUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const users = getUsers();
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
  const [userJobs, setUserJobs] = useState<TruckyJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadJobs = async (page: number) => {
    if (!user) return;

    try {
      setJobsLoading(true);
      setJobsError(null);
      const result = await fetchTruckyJobsPage(44349, page, 5);

      const filteredJobs = result.jobs.filter((job: TruckyJob) => isTruckyJobForUser(job, {
        displayName: user.displayName,
        username: user.username,
        steamUsername: user.steamUsername,
        steamId: user.steamId,
        truckyId: user.truckyId,
      }));

      // Sort by date (newest first)
      const sortedJobs = filteredJobs.sort((a, b) => {
        const dateA = new Date(a.start_date || a.created_at);
        const dateB = new Date(b.start_date || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setUserJobs(sortedJobs);
      setTotalJobs(result.total);
      setTotalPages(result.lastPage);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobsError('Failed to load jobs from Trucky');
      setUserJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    setCurrentPage(1);
    loadJobs(1);
  }, [user?.id]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    loadJobs(page);
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
                    <div className="text-sm opacity-90">@{user.username}</div>
                    <div className="mt-2 text-sm">Member since: {formatDate(user.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4">
                  <Badge className="text-sm border">{user.role}</Badge>
                  {user.rankTitle && <div className="text-sm text-muted-foreground">{user.rankTitle} {user.rankLevel ? `· Level ${user.rankLevel}` : ''}</div>}
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
                    <div className="text-lg font-bold">{formatDateTime(user.lastLogin)}</div>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground">Profile Links</div>
                    <div className="text-sm">
                      {user.discordId ? (
                        <a href={`https://discord.com/users/${user.discordId}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">Discord</a>
                      ) : '—'}
                      <span className="mx-2">•</span>
                      {user.steamId ? (
                        <a href={user.steamId.startsWith('http') ? user.steamId : `https://steamcommunity.com/profiles/${user.steamId}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">Steam</a>
                      ) : '—'}
                    </div>
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
                  ) : userJobs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No jobs found for this user.</div>
                  ) : (
                    <>
                      <div className="text-sm text-muted-foreground mb-4">
                        Showing {userJobs.length} of {totalJobs} total jobs (filtered for this user)
                      </div>
                      <div className="space-y-3">
                        {userJobs.map((job) => {
                          const status = job.status?.toLowerCase() || '';
                          let statusColor: "default" | "secondary" | "destructive" | "outline" = 'secondary';
                          let gradientClass = '';

                          if (status.includes('delivered') || status.includes('completed') || status.includes('finished') || status.includes('done')) {
                            statusColor = 'default';
                            gradientClass = 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/30';
                          } else if (status.includes('cancel') || status.includes('fail') || status.includes('abort')) {
                            statusColor = 'destructive';
                            gradientClass = 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30';
                          } else if (status.includes('progress') || status.includes('active') || status.includes('pending') || status.includes('ongoing')) {
                            statusColor = 'outline';
                            gradientClass = 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/30';
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
                                    <span>{formatDate(job.start_date || job.created_at)}</span>
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
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || jobsLoading}
                            variant="outline"
                            size="sm"
                          >
                            Previous
                          </Button>
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                disabled={jobsLoading}
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          <Button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || jobsLoading}
                            variant="outline"
                            size="sm"
                          >
                            Next
                          </Button>
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
