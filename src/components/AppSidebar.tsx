/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

/**
 * Custom modules
 */
import { cn } from '@/lib/utils';

/**
 * Components
 */
import Avatar from 'react-avatar';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserMenu } from '@/components/UserMenu';
import { Link } from 'react-router-dom';

/**
 * Hooks
 */
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Assets
 */
import { 
  ChevronRightIcon,
  LogOutIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as React from 'react';

/**
 * Constants
 */
import { APP_SIDEBAR } from '@/constants';
import { getFilteredSidebar } from './RoleBasedSidebar';
import { useLanguage } from '@/components/LanguageProvider';

export const AppSidebar = () => {
  const { state, isMobile } = useSidebar();
  const { t } = useLanguage();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    'Human Resources Department': true,
    'Event Department': true,
    'Admin': true
  });

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const filteredSidebar = getFilteredSidebar();

  return (
    <Sidebar
      variant='floating'
      collapsible='icon'
    >
      {/* Sidebar Header */}
      <SidebarHeader>
        <div className="flex flex-col gap-2 p-2">
          <SidebarMenu>
            <SidebarMenuItem className="group/menu-item relative px-0.5 max-lg:p-2">
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src="/ethub.png"
                  alt="ET logo" 
                  className={cn(
                    "h-8 w-auto transition-all duration-300",
                    state === 'collapsed' && !isMobile ? "h-6" : "h-7"
                  )} 
                />
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent>
        {filteredSidebar.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className='px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden'>
              {t(group.title)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.isCollapsible ? (() => {
                  const GroupIcon = group.items[0].Icon;
                  const isCollapsed = state === 'collapsed' && !isMobile;

                  if (isCollapsed) {
                    return (
                      <SidebarMenuItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton tooltip={t((group as any).shortTitle || group.title)}>
                              <GroupIcon />
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side='right'
                            align='start'
                            className='min-w-48'
                          >
                            <div className='px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70'>
                              {t((group as any).shortTitle || group.title)}
                            </div>
                            <DropdownMenuSeparator />
                            {group.items.map((subItem) => {
                              const Icon = subItem.Icon;
                              return (
                                <DropdownMenuItem key={subItem.title} asChild>
                                  <Link to={subItem.url} className='flex items-center gap-2 cursor-pointer'>
                                    <Icon className='size-4' />
                                    <span className='text-xs font-medium'>{t(subItem.title)}</span>
                                    {subItem.isComingSoon && (
                                      <Badge variant='secondary' className='ml-auto text-[8px] h-4 px-1 leading-none uppercase font-bold tracking-tighter opacity-70'>
                                        Soon
                                      </Badge>
                                    )}
                                  </Link>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => toggleGroup(group.title)}
                        className='font-semibold text-sm'
                      >
                        <GroupIcon />
                        <span>{t(group.title)}</span>
                        <ChevronRightIcon 
                          className={cn(
                            'ml-auto size-4 transition-transform duration-200',
                            openGroups[group.title] && 'rotate-90'
                          )} 
                        />
                      </SidebarMenuButton>
                      {openGroups[group.title] && (
                        <SidebarMenuSub>
                          {group.items.map((subItem) => {
                            const Icon = subItem.Icon;
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  size='md'
                                  className='font-medium'
                                >
                                  <Link to={subItem.url}>
                                    <Icon className='size-4' />
                                    <span>{t(subItem.title)}</span>
                                    {subItem.isComingSoon && (
                                      <Badge variant='secondary' className='ml-auto text-[8px] h-4 px-1 leading-none uppercase font-bold tracking-tighter opacity-70'>
                                        Soon
                                      </Badge>
                                    )}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                })() : (
                  group.items.map((item) => {
                    const Icon = item.Icon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          tooltip={t(item.title)}
                          asChild
                          className='font-semibold text-sm'
                        >
                          <Link to={item.url}>
                            <Icon />
                            <span>{t(item.title)}</span>
                            {item.isComingSoon && (
                              <Badge variant='secondary' className='ml-auto text-[9px] h-4 px-1.5 leading-none uppercase font-bold tracking-tight opacity-70'>
                                Soon
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}

      {/* Secondary Nav */}
      {isMobile && (
        <SidebarGroup className='mt-auto'>
          <SidebarGroupContent>
            <SidebarMenu>
              {APP_SIDEBAR.secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={t(item.title)}
                    asChild
                  >
                    <Link to={item.url}>
                      <item.Icon />
                      <span>{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className={cn(isMobile && 'border-t')}>
        <SidebarMenu>
          <SidebarMenuItem className={cn(isMobile && 'p-2')}>
            {isMobile ? (
              <div className='flex justify-between items-start gap-2'>
                <div className='grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-2'>
                  <div className='relative'>
                    <Avatar
                      src={APP_SIDEBAR.curProfile.src}
                      size='36px'
                      round='8px'
                    />

                    <div className='absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-sidebar ring-1'></div>
                  </div>

                  <div>
                    <h3 className='text-sm font-semibold'>
                      {APP_SIDEBAR.curProfile.name}
                    </h3>

                    <p className='text-sm text-muted-foreground truncate'>
                      {APP_SIDEBAR.curProfile.email}
                    </p>
                  </div>
                </div>

                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Logout'
                >
                  <LogOutIcon />
                </Button>
              </div>
            ) : (
              <div className='flex items-center gap-1 group-data-[collapsible=icon]:flex-col'>
                <UserMenu />
                <SidebarTrigger className='ml-auto group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:rotate-180 transition-transform duration-200' />
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
