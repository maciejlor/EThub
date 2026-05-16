/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

/**
 * Components
 */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserIcon, SettingsIcon, LogOutIcon, PlusIcon } from 'lucide-react';
import Avatar from 'react-avatar';

/**
 * Custom modules
 */
import { SidebarMenuButton } from '@/components/ui/sidebar';

/**
 * Constants
 */
import { APP_SIDEBAR } from '@/constants';

export const UserMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <Avatar
            src={APP_SIDEBAR.curProfile.src}
            size='32px'
            round='8px'
          />

          <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='truncate font-semibold'>
              {APP_SIDEBAR.curProfile.name}
            </span>
            <span className='truncate text-xs text-muted-foreground'>
              {APP_SIDEBAR.curProfile.email}
            </span>
          </div>

          <div className='ml-auto size-4 group-data-[collapsible=icon]:hidden opacity-50' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side='right'
        align='end'
        className='w-60'
      >
        {APP_SIDEBAR.userMenu.itemsPrimary.map((item) => (
            <DropdownMenuItem key={item.title}>
              <item.Icon />

              <span>{item.title}</span>

              {item.kbd && (
                <DropdownMenuShortcut>{item.kbd}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Account</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
            <UserIcon className='mr-2 h-4 w-4' />
            View Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
            <SettingsIcon className='mr-2 h-4 w-4' />
            Account Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={() => {
              localStorage.removeItem('ethub_authenticated');
              localStorage.removeItem('ethub_discord_user');
              localStorage.removeItem('ethub_auth_method');
              localStorage.removeItem('ethub_login_time');
              window.location.href = '/login';
            }}
            className='text-red-600 focus:text-red-700'
          >
            <LogOutIcon className='mr-2 h-4 w-4' />
            Sign out
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
            >
              <PlusIcon />

              <span>Add account</span>
            </Button>
          </DropdownMenuItem>

        <DropdownMenuSeparator />

          {APP_SIDEBAR.userMenu.itemsSecondary.map((item) => (
            <DropdownMenuItem key={item.title}>
              <item.Icon />

              <span>{item.title}</span>

              {item.kbd && (
                <DropdownMenuShortcut>{item.kbd}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
