export interface TruckyJob {
  id: number;
  source_city_name: string;
  destination_city_name: string;
  cargo_name: string;
  cargo_weight?: number;
  cargo_mass?: number;
  cargo_mass_t?: number;
  real_distance_km?: number;
  planned_distance_km: number;
  status: string;
  source_company_name: string;
  destination_company_name: string;
  
  // Vehicle & Truck Info
  truck_name?: string;
  vehicle_brand_name?: string;
  vehicle_model_name?: string;
  vehicle_in_game_brand_id?: string;
  vehicle_in_game_id?: string;
  
  // Trailer Info
  trailer_name?: string;
  trailer_body_type?: string;
  owned_trailer_id?: number;
  
  // Dates & Times
  start_date?: string;
  started_at?: string;
  created_at: string;
  stop_date?: string;
  completed_at?: string;
  canceled_at?: string;
  ended_at?: string;
  finished_at?: string;
  
  // Stats
  top_speed?: number;
  max_speed?: number;
  max_speed_kmh?: number;
  fuel_consumed?: number;
  fuel_used_l?: number;
  fuel_used?: number;
  revenue?: number;
  income?: number;
  
  // Objects
  driver?: {
    name: string;
    avatar_url?: string;
    avatar?: string;
    steam_profile?: {
      steam_id: string;
      steam_username: string;
    };
  };
  vehicle?: Record<string, unknown>;
  truck?: Record<string, unknown>;
  
  game?: string;
  map?: string;
  dlc?: string | { name?: string };
}

export interface TruckyDriverRank {
  name: string;
  avatar?: string;
  jobs: number;
  distance: number;
}

export interface TruckyVtcStats {
  jobs_count: number;
  distance_km: number;
  fuel_consumed_liters: number;
  revenue: number;
  // Add other fields as needed
  [key: string]: unknown;
}

export interface TruckyVtcInfo {
  id: number;
  name: string;
  owner: {
    id: number;
    username: string;
  };
  members_count: number;
  // Add other fields as needed
  [key: string]: unknown;
}

export async function fetchTruckyVtcStats(companyId: number): Promise<TruckyVtcStats> {
  const res = await fetch(`/trucky-api/api/v1/company/${companyId}/stats/aggregated`, {
    headers: {
      'X-ACCESS-TOKEN': '7d0705583b7a02f99ff6301f12b6c3ff5c585250f13fac7205cd7e153d8ff5d2'
    }
  });
  if (!res.ok) throw new Error(`Failed to load Trucky stats for VTC ${companyId} (${res.status})`);
  const data = await res.json();
  return data;
}

export async function fetchTruckyVtcInfo(companyId: number): Promise<TruckyVtcInfo> {
  const res = await fetch(`/trucky-api/api/v1/company/${companyId}`, {
    headers: {
      'X-ACCESS-TOKEN': '7d0705583b7a02f99ff6301f12b6c3ff5c585250f13fac7205cd7e153d8ff5d2'
    }
  });
  if (!res.ok) throw new Error(`Failed to load Trucky VTC info for ${companyId} (${res.status})`);
  const data = await res.json();
  return data.response || data;
}

export async function fetchTruckyJobs(companyId: number, limit: number = 10): Promise<TruckyJob[]> {
  const res = await fetch(`/trucky-api/api/v1/company/${companyId}/jobs?limit=${limit}`, {
    headers: {
      'X-ACCESS-TOKEN': '7d0705583b7a02f99ff6301f12b6c3ff5c585250f13fac7205cd7e153d8ff5d2'
    }
  });
  if (!res.ok) throw new Error(`Failed to load Trucky jobs for VTC ${companyId} (${res.status})`);
  const data = await res.json();
  return data.response?.data || data.data || [];
}

export async function fetchTruckyJobDetails(jobId: number): Promise<TruckyJob> {
  const res = await fetch(`/trucky-api/api/v1/job/${jobId}`, {
    headers: {
      'X-ACCESS-TOKEN': '7d0705583b7a02f99ff6301f12b6c3ff5c585250f13fac7205cd7e153d8ff5d2'
    }
  });
  if (!res.ok) throw new Error(`Failed to load Trucky job details for ${jobId} (${res.status})`);
  const data = await res.json();
  return data.response || data;
}

/** Delivered / completed jobs only — excludes cancelled, failed, and in-progress. */
export function isTruckyJobCountedForRankings(job: TruckyJob): boolean {
  const s = job.status?.toLowerCase() ?? '';
  if (
    s.includes('cancel') ||
    s.includes('declin') ||
    s.includes('fail') ||
    s.includes('abort')
  ) {
    return false;
  }
  if (s.includes('pending') || s.includes('progress') || s.includes('active')) {
    return false;
  }
  if (s.includes('incomplete')) return false;
  return (
    s.includes('delivered') ||
    s.includes('done') ||
    s.includes('completed') ||
    s.includes('finished')
  );
}

/** Prefer real driven km when the API sends a number (including 0); only then fall back to planned. */
export function truckyJobDistanceKm(job: TruckyJob): number {
  const r = job.real_distance_km;
  if (typeof r === 'number' && !Number.isNaN(r)) return Math.round(r);
  const p = job.planned_distance_km;
  if (typeof p === 'number' && !Number.isNaN(p)) return Math.round(p);
  return 0;
}

const TRUCKY_FETCH_HEADERS = {
  'X-ACCESS-TOKEN': '7d0705583b7a02f99ff6301f12b6c3ff5c585250f13fac7205cd7e153d8ff5d2',
};

const JOBS_PAGE_FETCH_LIMIT = 20;
const JOBS_FETCH_CONCURRENCY = 8;

/** Same job id can appear on multiple API pages; keep one row so km/jobs are not doubled. */
export function dedupeTruckyJobsById(jobs: TruckyJob[]): TruckyJob[] {
  const map = new Map<number, TruckyJob>();
  for (const job of jobs) {
    const id = Number(job.id);
    if (!Number.isFinite(id)) continue;
    map.set(id, job);
  }
  return Array.from(map.values());
}

export interface TruckyJobsPageResult {
  jobs: TruckyJob[];
  lastPage: number;
  total: number;
  currentPage: number;
}

/** One API page — use on /jobs so the UI does not load every page at once. */
export async function fetchTruckyJobsPage(
  companyId: number,
  page: number,
  limit: number = JOBS_PAGE_FETCH_LIMIT
): Promise<TruckyJobsPageResult> {
  const res = await fetch(
    `/trucky-api/api/v1/company/${companyId}/jobs?limit=${limit}&page=${page}`,
    { headers: TRUCKY_FETCH_HEADERS }
  );
  if (!res.ok) throw new Error(`Failed to load jobs (${res.status})`);
  const data = await res.json();
  const r = data.response ?? data;
  const jobs: TruckyJob[] = r.data ?? data.data ?? [];
  const lastPage = Math.max(1, Number(r.last_page ?? data.last_page ?? 1));
  const total =
    typeof r.total === 'number'
      ? r.total
      : typeof data.total === 'number'
        ? data.total
        : lastPage * limit;
  const currentPage = Math.max(1, Number(r.current_page ?? page));
  return { jobs: dedupeTruckyJobsById(jobs), lastPage, total, currentPage };
}

export async function fetchTruckyCompanyJobsAll(companyId: number): Promise<TruckyJob[]> {
  const first = await fetch(
    `/trucky-api/api/v1/company/${companyId}/jobs?limit=${JOBS_PAGE_FETCH_LIMIT}&page=1`,
    {
      headers: TRUCKY_FETCH_HEADERS,
    }
  );
  if (!first.ok) throw new Error(`Failed to load jobs (${first.status})`);
  const firstData = await first.json();
  const r0 = firstData.response ?? firstData;
  const lastPage: number = Math.max(1, Number(r0.last_page ?? firstData.last_page ?? 1));

  const combined: TruckyJob[] = [...(r0.data || firstData.data || [])];
  const pageNumbers = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);

  for (let i = 0; i < pageNumbers.length; i += JOBS_FETCH_CONCURRENCY) {
    const chunk = pageNumbers.slice(i, i + JOBS_FETCH_CONCURRENCY);
    const chunkJson = await Promise.all(
      chunk.map((p) =>
        fetch(`/trucky-api/api/v1/company/${companyId}/jobs?limit=${JOBS_PAGE_FETCH_LIMIT}&page=${p}`, {
          headers: TRUCKY_FETCH_HEADERS,
        }).then((res) => res.json())
      )
    );
    for (const d of chunkJson) {
      const r = d.response ?? d;
      combined.push(...(r.data || d.data || []));
    }
  }

  return dedupeTruckyJobsById(combined);
}

/** Months (YYYY-MM) that have at least one completed job, newest first. */
export function completedDeliveryMonthsFromJobs(jobs: TruckyJob[]): string[] {
  const set = new Set<string>();
  for (const j of jobs) {
    if (!isTruckyJobCountedForRankings(j)) continue;
    const date = j.start_date || j.created_at;
    if (!date) continue;
    const d2 = new Date(date);
    if (Number.isNaN(d2.getTime())) continue;
    set.add(`${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}`);
  }
  return Array.from(set).sort().reverse();
}

export function aggregateDriverRankingsFromJobs(
  allJobs: TruckyJob[],
  monthYear?: { year: number; month: number }
): TruckyDriverRank[] {
  const map = new Map<string, TruckyDriverRank>();
  for (const job of allJobs) {
    if (!isTruckyJobCountedForRankings(job)) continue;
    if (monthYear) {
      const ref = job.start_date || job.created_at;
      if (!ref) continue;
      const d = new Date(ref);
      if (d.getFullYear() !== monthYear.year || d.getMonth() + 1 !== monthYear.month) continue;
    }
    const name = job.driver?.name || 'Unknown';
    const existing = map.get(name) ?? {
      name,
      avatar: job.driver?.avatar_url || job.driver?.avatar,
      jobs: 0,
      distance: 0,
    };
    existing.jobs++;
    existing.distance += truckyJobDistanceKm(job);
    map.set(name, existing);
  }
  return Array.from(map.values());
}

/** VTC-wide completed jobs count and summed distance (same rules as driver rankings). */
export async function fetchTruckyCompletedDeliveryTotals(
  companyId: number
): Promise<{ jobs: number; distanceKm: number }> {
  const allJobs = await fetchTruckyCompanyJobsAll(companyId);
  let jobs = 0;
  let distanceKm = 0;
  for (const job of allJobs) {
    if (!isTruckyJobCountedForRankings(job)) continue;
    jobs++;
    distanceKm += truckyJobDistanceKm(job);
  }
  return { jobs, distanceKm };
}

export async function fetchTruckyDriverRankings(
  companyId: number,
  monthYear?: { year: number; month: number }
): Promise<TruckyDriverRank[]> {
  const allJobs = await fetchTruckyCompanyJobsAll(companyId);
  return aggregateDriverRankingsFromJobs(allJobs, monthYear);
}
