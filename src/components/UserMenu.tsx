/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

/**
 * Components
 */
import Avatar from 'react-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * Assets
 */
import { PlusIcon } from 'lucide-react';

/**
 * Constants
 */
import { APP_SIDEBAR } from '@/constants';

export const UserMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className='relative'>
          <Avatar
            src={APP_SIDEBAR.curProfile.src}
            size='32px'
            round='8px'
          />

          <div className='absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-sidebar ring-1'></div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side='right'
        align='end'
        className='w-60'
      >
        <DropdownMenuGroup>
          {APP_SIDEBAR.userMenu.itemsPrimary.map((item) => (
            <DropdownMenuItem key={item.title}>
              <item.Icon />

              <span>{item.title}</span>

              {item.kbd && (
                <DropdownMenuShortcut>{item.kbd}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup
          value={APP_SIDEBAR.curProfile.email}
          className='space-y-1'
        >
          <DropdownMenuLabel>Switch account</DropdownMenuLabel>

          {APP_SIDEBAR.allProfiles.map((profile) => (
            <DropdownMenuRadioItem
              key={profile.email}
              value={profile.email}
              className='data-[state=checked]:bg-secondary'
            >
              <div className='grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-2'>
                <div className='relative'>
                  <Avatar
                    src={profile.src}
                    size='36px'
                    round='8px'
                  />

                  <div className='absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-sidebar ring-1'></div>
                </div>

                <div>
                  <h3 className='text-sm font-semibold'>{profile.name}</h3>

                  <p className='text-sm text-muted-foreground truncate'>
                    {profile.email}
                  </p>
                </div>
              </div>
            </DropdownMenuRadioItem>
          ))}

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
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {APP_SIDEBAR.userMenu.itemsSecondary.map((item) => (
            <DropdownMenuItem key={item.title}>
              <item.Icon />

              <span>{item.title}</span>

              {item.kbd && (
                <DropdownMenuShortcut>{item.kbd}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
