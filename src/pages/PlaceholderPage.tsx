import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';

import { WrenchIcon } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description = 'This page is currently under construction.' }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <Header />

        <main>
          <Page>


            <div className='flex flex-col items-center justify-center min-h-[50vh] mt-8 bg-background rounded-2xl border px-6 py-12 shadow-sm text-center'>
              <div className='size-16 rounded-full bg-muted flex items-center justify-center mb-6'>
                <WrenchIcon className='size-8 text-muted-foreground' />
              </div>
              <h1 className='text-2xl font-bold mb-2'>{title}</h1>
              <p className='text-muted-foreground max-w-md'>
                {description}
              </p>
            </div>
          </Page>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
