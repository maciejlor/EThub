/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

/**
 * Components
 */
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartTooltipContent,
} from '@/components/ui/chart';

/**
 * Hooks
 */
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Types
 */
import type { ChartConfig } from '@/components/ui/chart';

/**
 * Constants
 */
import { VENDOR_BREAKDOWN } from '@/constants';

const chartConfig = {
  eu: { label: 'EU', color: 'var(--chart-1)' },
  us: { label: 'US', color: 'var(--chart-2)' },
  asia: { label: 'Asia', color: 'var(--chart-3)' },
} satisfies ChartConfig;

export const AppBarChart = () => {
  const isMobile = useIsMobile();

  return (
    <ChartContainer
      config={chartConfig}
      className='h-70 lg:h-52 w-full'
    >
      <BarChart
        accessibilityLayer
        data={VENDOR_BREAKDOWN}
        barSize={isMobile ? 12 : 30}
      >
        <ChartTooltip content={<ChartTooltipContent />} />

        <CartesianGrid vertical={false} />

        <Bar
          dataKey='asia'
          stackId='a'
          fill='var(--color-asia)'
        />

        <Bar
          dataKey='us'
          stackId='a'
          fill='var(--color-us)'
        />

        <Bar
          dataKey='eu'
          stackId='a'
          fill='var(--color-eu)'
          radius={[8, 8, 0, 0]}
        />

        <XAxis
          dataKey='month'
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />

        {!isMobile && (
          <YAxis
            tickLine={false}
            axisLine={false}
          />
        )}

        {!isMobile && (
          <ChartLegend
            content={
              <p className='font-semibold text-muted-foreground mt-2'>Month</p>
            }
          />
        )}
      </BarChart>
    </ChartContainer>
  );
};
