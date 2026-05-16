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
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { APP_SIDEBAR } from '@/constants';
import { useState, useEffect } from 'react';

import { 
  getCurrentUser,
  type UserEntry
} from '@/lib/driver-storage';

export const UserMenu = () => {
  const [user, setUser] = useState<UserEntry | null>(null);

  useEffect(() => {
    const current = getCurrentUser();
    if (current) {
      setUser(current);
    }
  }, []);

  const displayName = user?.displayName || user?.discordUsername || user?.username || 'Member';
  const avatarUrl = user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + displayName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <img 
            src={avatarUrl}
            className='size-8 rounded-lg object-cover'
            alt={displayName}
          />

          <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='truncate font-semibold'>
              {displayName}
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
        {/* Primary Items (Profile & Settings) only once */}
        {APP_SIDEBAR.userMenu.itemsPrimary.map((item) => (
          <DropdownMenuItem 
            key={item.title}
            onClick={() => window.location.href = item.url}
          >
            <item.Icon className='mr-2 h-4 w-4' />
            <span>{item.title}</span>
            {item.kbd && (
              <DropdownMenuShortcut>{item.kbd}</DropdownMenuShortcut>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Secondary Items (Sign out) */}
        {APP_SIDEBAR.userMenu.itemsSecondary.map((item) => (
          <DropdownMenuItem 
            key={item.title}
            onClick={() => {
              if (item.title === 'Sign out') {
                localStorage.removeItem('ethub_authenticated');
                localStorage.removeItem('ethub_discord_user');
                localStorage.removeItem('ethub_auth_method');
                localStorage.removeItem('ethub_login_time');
                window.location.href = '/login';
              }
            }}
          >
            <item.Icon className='mr-2 h-4 w-4' />
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
