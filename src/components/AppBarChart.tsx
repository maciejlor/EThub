import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ChartConfig } from '@/components/ui/chart';
import type { TruckyJob } from '@/lib/trucky';

const chartConfig = {
  jobs: { label: 'Jobs', color: 'var(--chart-2)' },
  distance: { label: 'Distance (km)', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  jobs?: TruckyJob[];
}

export const AppBarChart = ({ jobs = [] }: Props) => {
  const isMobile = useIsMobile();

  const chartData = useMemo(() => {
    if (jobs.length === 0) {
      // Fallback static preview data
      return SHORT_MONTHS.map(month => ({ month, jobs: 0, distance: 0 }));
    }

    const now = new Date();
    const year = now.getFullYear();

    const byMonth: Record<number, { jobs: number; distance: number }> = {};
    for (let i = 0; i < 12; i++) byMonth[i] = { jobs: 0, distance: 0 };

    for (const job of jobs) {
      const date = new Date(job.stop_date || job.created_at);
      if (date.getFullYear() !== year) continue;
      const m = date.getMonth();
      byMonth[m].jobs += 1;
      byMonth[m].distance += Math.round(job.real_distance_km || job.planned_distance_km || 0);
    }

    return SHORT_MONTHS.map((month, i) => ({
      month,
      jobs: byMonth[i].jobs,
      distance: byMonth[i].distance,
    }));
  }, [jobs]);

  const hasData = jobs.length > 0;

  return (
    <div>
      {!hasData && (
        <p className='text-xs text-muted-foreground mb-2 italic'>Showing preview — live data will appear once jobs are loaded.</p>
      )}
      <ChartContainer config={chartConfig} className='h-[320px] w-full'>
        <BarChart accessibilityLayer data={chartData} barSize={isMobile ? 10 : 20} barGap={4}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey='month' tickLine={false} tickMargin={8} axisLine={false} />
          {!isMobile && <YAxis tickLine={false} axisLine={false} />}
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey='jobs' fill='var(--color-jobs)' radius={[6,6,0,0]} />
          <Bar dataKey='distance' fill='var(--color-distance)' radius={[6,6,0,0]} />
        </BarChart>
      </ChartContainer>
      <div className='flex items-center gap-4 mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
        <span className='flex items-center gap-1'><span className='size-2 rounded-full inline-block bg-[var(--chart-2)]' />Jobs</span>
        <span className='flex items-center gap-1'><span className='size-2 rounded-full inline-block bg-[var(--chart-1)]' />Distance (km)</span>
      </div>
    </div>
  );
};
