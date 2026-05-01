/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page, PageHeader } from '@/components/Page';
import { DashboardCard } from '@/components/DashboardCard';
import { AppBarChart } from '@/components/AppBarChart';
import { AppRadialChart } from '@/components/AppRadialChart';
import { DashboardTable } from '@/components/DashboardTable';
import { TrendingUpIcon } from 'lucide-react';

export function DashboardPage() {
  return (
    <SidebarProvider open={false}>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main>
          <Page>
            <PageHeader />

            <div className='grid gap-6 py-8 lg:grid-cols-[1fr_360px]'>
              <DashboardCard
                title='Vendor breakdown'
                description='Keep track of vendors and their security ratings.'
                buttonText='View full report'
              >
                <AppBarChart />
              </DashboardCard>

              <DashboardCard
                title='Vendor monitored'
                description="You're using 80% of available spots."
                buttonText='Upgrade plan'
              >
                <div className='flex items-start justify-between'>
                  <AppRadialChart />

                  <div className='flex items-center gap-2'>
                    <TrendingUpIcon
                      size={20}
                      className='text-emerald-500 dark:text-emerald-400'
                    />

                    <span className='font-medium text-emerald-500 dark:text-emerald-400'>
                      10%
                    </span>
                  </div>
                </div>

                <div className='mt-6 lg:mt-8'>
                  <p className='font-medium'>You've almost reached your limit</p>

                  <p className='text-muted-foreground'>
                    You have used 80% of your available spots. Upgrade plan to
                    monitor more vendors.
                  </p>
                </div>
              </DashboardCard>
            </div>

            <DashboardTable />
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

