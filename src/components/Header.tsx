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
 * Hooks
 */
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Assets
 */
import { Logo } from '@/assets/Logo';
import { MenuIcon } from 'lucide-react';

export const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className='flex justify-between gap-1 items-center py-3 ps-4 pe-2 border-b lg:hidden'>
      <Logo />

      <div className='ml-auto'>
        <ThemeToggle />
      </div>

      <Button
        variant='ghost'
        size='icon'
        onClick={toggleSidebar}
        aria-label='Toggle mobile menu'
      >
        <MenuIcon />
      </Button>
    </header>
  );
};
