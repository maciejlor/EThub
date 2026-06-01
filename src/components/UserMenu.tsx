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
import { RoleBadge } from '@/components/RoleBadge';
import { useLanguage } from '@/components/LanguageProvider';

import { 
  getCurrentUser,
  subscribeUsersChanges,
  type UserEntry
} from '@/lib/driver-storage';

export const UserMenu = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserEntry | null>(() => getCurrentUser());

  useEffect(() => {
    // Refresh whenever user data changes (e.g. avatar updated, Discord linked)
    const refresh = () => setUser(getCurrentUser());
    const unsub = subscribeUsersChanges(refresh);
    // Also listen to storage events for cross-tab updates
    window.addEventListener('storage', refresh);
    return () => {
      unsub();
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const displayName = user?.displayName || user?.discordUsername || user?.username || t('Member');
  const avatarUrl = user?.avatar || user?.discordAvatar || user?.steamAvatar || null;
  const initials = displayName.slice(0, 2).toUpperCase();
  const userRole = user?.role || 'Member';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl}
              className='size-8 rounded-lg object-cover flex-shrink-0'
              alt={displayName}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className='size-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0'>
              <span className='text-[10px] font-black text-primary'>{initials}</span>
            </div>
          )}

          <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='truncate font-semibold'>
              {displayName}
            </span>
            <div className='mt-1'>
              <RoleBadge role={userRole} />
            </div>
          </div>

          <div className='ml-auto size-4 group-data-[collapsible=icon]:hidden opacity-50' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side='right'
        align='end'
        className='w-60'
      >
        {/* User info header */}
        <DropdownMenuLabel className='flex items-center gap-3 p-3'>
          {avatarUrl ? (
            <img src={avatarUrl} className='size-9 rounded-lg object-cover flex-shrink-0' alt={displayName} />
          ) : (
            <div className='size-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0'>
              <span className='text-xs font-black text-primary'>{initials}</span>
            </div>
          )}
          <div className='min-w-0'>
            <p className='font-semibold text-sm truncate'>{displayName}</p>
            <div className='mt-1'>
              <RoleBadge role={userRole} />
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Primary Items (Profile & Settings) only once */}
        {APP_SIDEBAR.userMenu.itemsPrimary.map((item) => (
          <DropdownMenuItem 
            key={item.title}
            onClick={() => window.location.href = item.url}
          >
            <item.Icon className='mr-2 h-4 w-4' />
            <span>{t(item.title)}</span>
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
            <span>{t(item.title)}</span>
            {item.kbd && (
              <DropdownMenuShortcut>{item.kbd}</DropdownMenuShortcut>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
