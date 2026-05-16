import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchTruckyJobDetails, truckyJobDistanceKm, type TruckyJob } from '@/lib/trucky';

import { ArrowLeftIcon, MapPinIcon, TruckIcon, PackageIcon, RulerIcon } from 'lucide-react';

export function JobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<TruckyJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [steamAvatar, setSteamAvatar] = useState<string | null>(null);

  useEffect(() => {
    const steamId = job?.driver?.steam_profile?.steam_id;
    if (steamId) {
      fetch(`http://localhost:3000/api/auth/steam-lookup?id=${steamId}`)
        .then(res => res.json())
        .then(data => {
          if (data?.avatar) setSteamAvatar(data.avatar);
        })
        .catch(console.error);
    }
  }, [job?.driver?.steam_profile?.steam_id]);

  useEffect(() => {
    const loadJob = async () => {
      try {
        if (id) {
          const data = await fetchTruckyJobDetails(parseInt(id, 10));
          setJob(data);
        }
      } catch (error) {
        console.error('Failed to load job details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [id]);

  const formatTimelineDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${mins}:${secs}`;
  };

  const formatDateUTC = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${mins} (UTC)`;
  };

  const formatTruckName = (j: any) => {
    if (!j) return 'Standard Truck';
    const v = j.vehicle || j.truck || j.vehicle_info || j.truck_info;
    let b = j.vehicle_brand || j.truck_brand || v?.brand || v?.make || v?.brand_name || v?.name;
    let m = j.vehicle_model_name || j.truck_model || v?.model || v?.model_name || v?.name || j.truck_name;

    if (!b && (String(m).toLowerCase() === 's')) b = 'Scania';
    if (!b && (String(m).toLowerCase().includes('fh'))) b = 'Volvo';
    if (!b && (String(m).toLowerCase().includes('actros'))) b = 'Mercedes-Benz';

    if (b && m) {
      const brandStr = String(b).trim();
      const modelStr = String(m).trim();
      const combined = modelStr.toLowerCase().includes(brandStr.toLowerCase()) 
        ? modelStr 
        : `${brandStr} ${modelStr}`;
      return combined.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    if (j.truck_name) return j.truck_name.replace(/[._]/g, ' ').split(' ').map((w: any) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return b || m || 'Standard Truck';
  };

  const calculateDuration = (start?: string, end?: string) => {
    const sStr = start || job?.start_date || job?.created_at;
    const eStr = end || job?.stop_date || (job as any).ended_at || (job as any).finished_at;
    
    if (!sStr || !eStr) return null;
    const s = new Date(sStr);
    const e = new Date(eStr);
    const diff = e.getTime() - s.getTime();
    if (isNaN(diff) || diff < 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main>
          <Page>

            
            <div className='mt-8 mb-6'>
              <Button variant='ghost' asChild className='-ml-2'>
                <Link to='/jobs'>
                  <ArrowLeftIcon className='mr-2 size-4' />
                  Back to Jobs
                </Link>
              </Button>
            </div>

            <div className='grid gap-6 lg:grid-cols-3'>
              {/* Main Job Info */}
              <div className='lg:col-span-2 space-y-6'>
                <div className='bg-background rounded-2xl border p-8 shadow-sm'>
                  <div className='flex items-start justify-between mb-8'>
                    <h2 className='text-2xl font-black tracking-tight'>Job #{job.id}</h2>
                    <div className='flex flex-col items-end'>
                      <Badge variant={(job.status?.toLowerCase() || '').includes('done') || (job.status?.toLowerCase() || '').includes('deliver') ? 'default' : 'secondary'} className='uppercase font-bold tracking-widest mb-1.5'>
                        {job.status || 'Unknown'}
                      </Badge>
                      {job.stop_date && (
                        <div className='text-[11px] font-bold tracking-tight text-muted-foreground uppercase'>
                          {(job.status?.toLowerCase() || '').includes('cancel') || (job.status?.toLowerCase() || '').includes('fail') ? 'Ended' : 'Completed'} | {formatDateUTC(job.stop_date)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='grid gap-8 md:grid-cols-2'>
                    <div className='space-y-6'>
                      <div>
                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2'>
                          <MapPinIcon className='size-3' /> Route
                        </p>
                        <div className='flex items-center gap-4 text-lg font-semibold'>
                          <span>{job.source_city_name}</span>
                          <span className='text-muted-foreground'>→</span>
                          <span>{job.destination_city_name}</span>
                        </div>
                        <p className='text-sm text-muted-foreground mt-1'>{job.source_company_name} to {job.destination_company_name}</p>
                      </div>

                      <div>
                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2'>
                          <PackageIcon className='size-3' /> Cargo
                        </p>
                        <div className='text-lg font-semibold'>{job.cargo_name}</div>
                        <p className='text-sm text-muted-foreground mt-1'>Weight: {Math.round(job.cargo_weight / 1000)} tons</p>
                      </div>
                    </div>

                    <div className='space-y-6'>
                      <div>
                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2'>
                          <RulerIcon className='size-3' /> Distance
                        </p>
                        <div className='text-2xl font-black tracking-tight'>{truckyJobDistanceKm(job)} km</div>
                        <p className='text-sm text-muted-foreground mt-1'>Planned: {Math.round(job.planned_distance_km)} km</p>
                      </div>

                      <div>
                        <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2'>
                          <TruckIcon className='size-3' /> Vehicle Info
                        </p>
                        <div className='text-lg font-semibold'>
                          {formatTruckName(job)}
                        </div>
                        <p className='text-sm text-muted-foreground mt-1'>
                          Trailer: {job.trailer_name || job.trailer_body_type || 'Company Trailer'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details Placeholder */}
                <div className='bg-background rounded-2xl border p-8 shadow-sm'>
                  <h3 className='text-lg font-semibold mb-4'>Delivery Timeline</h3>
                  <div className='space-y-6 relative before:absolute before:inset-0 before:ml-1 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent'>
                    <div className='relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active'>
                      <div className='flex items-center justify-center w-6 h-6 rounded-full border-4 border-background bg-emerald-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow' />
                      <div className='w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded border border-muted bg-muted/20'>
                        <div className='flex items-center justify-between mb-1'>
                          <h4 className='font-bold text-sm'>Started</h4>
                          <span className='text-xs text-muted-foreground'>{formatDateUTC(job.start_date || job.created_at)}</span>
                        </div>
                        <p className='text-xs text-muted-foreground'>Job accepted and delivery started.</p>
                      </div>
                    </div>

                    {(job.status?.toLowerCase() || '').includes('progress') || (job.status?.toLowerCase() || '').includes('pending') ? (
                      <div className='relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active'>
                        <div className='flex items-center justify-center w-6 h-6 rounded-full border-4 border-background bg-yellow-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow animate-pulse' />
                        <div className='w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded border border-yellow-500/20 bg-yellow-500/10'>
                          <div className='flex items-center justify-between mb-1'>
                            <h4 className='font-bold text-sm text-yellow-500'>In Progress</h4>
                            <span className='text-xs text-yellow-500/70'>Current</span>
                          </div>
                          <p className='text-xs text-muted-foreground'>Driving towards {job.destination_city_name}.</p>
                        </div>
                      </div>
                    ) : null}

                    {(job.status?.toLowerCase() || '').includes('cancel') || (job.status?.toLowerCase() || '').includes('fail') || (job.status?.toLowerCase() || '').includes('decline') ? (
                      <div className='relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active'>
                        <div className='flex items-center justify-center w-6 h-6 rounded-full border-4 border-background bg-red-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow' />
                        <div className='w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded border border-red-500/20 bg-red-500/10'>
                          <div className='flex items-center justify-between mb-1'>
                            <h4 className='font-bold text-sm text-red-500'>Cancelled</h4>
                            <div className='flex flex-col'>
                              <span className='text-xs text-red-500/70'>{formatDateUTC(job.stop_date || (job as any).ended_at || (job as any).finished_at || job.created_at)}</span>
                              {(job.stop_date || (job as any).ended_at) && (
                                <span className='text-[10px] text-muted-foreground mt-0.5'>Duration: {calculateDuration(job.start_date, job.stop_date || (job as any).ended_at)}</span>
                              )}
                            </div>
                          </div>
                          <p className='text-xs text-muted-foreground'>Delivery was cancelled or abandoned.</p>
                        </div>
                      </div>
                    ) : null}

                    {(job.status?.toLowerCase() || '').includes('done') || (job.status?.toLowerCase() || '').includes('completed') || (job.status?.toLowerCase() || '').includes('finished') || (job.status?.toLowerCase() || '').includes('delivered') ? (
                      <div className='relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active'>
                        <div className='flex items-center justify-center w-6 h-6 rounded-full border-4 border-background bg-emerald-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow' />
                        <div className='w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded border border-emerald-500/20 bg-emerald-500/10'>
                          <div className='flex items-center justify-between mb-1'>
                            <h4 className='font-bold text-sm text-emerald-500'>Delivered</h4>
                            <div className='flex flex-col'>
                              <span className='text-xs text-emerald-500/70'>{formatDateUTC(job.stop_date || (job as any).ended_at || (job as any).finished_at || job.created_at)}</span>
                              {(job.stop_date || (job as any).ended_at) && (
                                <span className='text-[10px] text-muted-foreground mt-0.5'>Duration: {calculateDuration(job.start_date, job.stop_date || (job as any).ended_at)}</span>
                              )}
                            </div>
                          </div>
                          <p className='text-xs text-muted-foreground'>Successfully delivered to {job.destination_company_name}.</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className='space-y-6'>
                <div className='bg-background rounded-2xl border p-6 shadow-sm'>
                  <h3 className='text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4'>Driver</h3>
                  <div className='flex items-center gap-3'>
                    <div className='size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden'>
                      {steamAvatar || job.driver?.avatar_url || job.driver?.avatar ? (
                        <img src={steamAvatar || job.driver?.avatar_url || job.driver?.avatar} alt={job.driver?.steam_profile?.steam_username || job.driver?.name} className='w-full h-full object-cover' />
                      ) : (
                        (job.driver?.steam_profile?.steam_username?.charAt(0) || job.driver?.name?.charAt(0) || '?')
                      )}
                    </div>
                    <div>
                      <div className='font-bold text-foreground'>{job.driver?.steam_profile?.steam_username || job.driver?.name || 'Unknown Driver'}</div>
                      <div className='text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5 flex items-center gap-1'>
                        Member
                      </div>
                    </div>
                  </div>
                </div>

                <div className='bg-background rounded-2xl border p-6 shadow-sm'>
                  <h3 className='text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4'>Job Statistics</h3>
                  <div className='space-y-4'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Top Speed</span>
                      <span className='font-bold'>{job.top_speed || (job as any).max_speed_kmh || (job as any).max_speed || 0} km/h</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Fuel Used</span>
                      <span className='font-bold'>{Math.round(job.fuel_consumed || (job as any).fuel_used_l || (job as any).fuel_used || 0)} L</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Revenue</span>
                      <span className='font-bold'>€{job.revenue?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Debug info - only visible in dev */}
                <div className='bg-background rounded-2xl border p-6 shadow-sm opacity-20 hover:opacity-100 transition-opacity'>
                  <h3 className='text-[10px] font-bold uppercase text-muted-foreground mb-2'>Debug Keys</h3>
                  <div className='text-[10px] font-mono break-all text-muted-foreground'>
                    {Object.keys(job).join(', ')}
                    <br />
                    Vehicle Keys: {job.vehicle ? Object.keys(job.vehicle).join(', ') : 'No Vehicle Object'}
                    <br />
                    Truck Keys: {job.truck ? Object.keys(job.truck).join(', ') : 'No Truck Object'}
                  </div>
                </div>
              </div>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
