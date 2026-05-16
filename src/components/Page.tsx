/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

/**
 * Components
 */
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * Assets
 */
import { SearchIcon, Settings2Icon, DownloadIcon } from 'lucide-react';

export const Page = ({ children }: React.PropsWithChildren) => {
  return <div className='px-4 py-8 md:p-8'>{children}</div>;
};

export const PageHeader = ({ name = 'Sadee' }: { name?: string }) => {
  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:justify-between'>
      <div>
        <h1 className='text-xl font-semibold lg:text-2xl'>Welcome back, {name}</h1>
        <p className='text-sm text-muted-foreground'>Here's your Daily Dashboard Overview.</p>
      </div>

      <div className='flex gap-3'>
        <div className='flex max-lg:hidden'>
          <ThemeToggle />

          <Button
            variant='ghost'
            size='icon'
            aria-label='Search'
          >
            <SearchIcon />
          </Button>
        </div>

        <div className='flex items-center gap-3'>
          <Button variant='outline'>
            <Settings2Icon />

            <span>Customize</span>
          </Button>

          <Button variant='outline'>
            <DownloadIcon />

            <span>Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
