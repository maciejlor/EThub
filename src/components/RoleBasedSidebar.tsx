import { getCurrentUser } from '@/lib/driver-storage';
import { canAccessRoute as authCanAccessRoute } from '@/lib/auth';
import { APP_SIDEBAR } from '@/constants';

export function getFilteredSidebar() {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return {
      ...APP_SIDEBAR,
      navMain: []
    };
  }

  // Filter sidebar items based on canAccessRoute
  const filteredNavMain = APP_SIDEBAR.navMain.map(section => {
    const filteredItems = section.items.filter(item => {
      // Allow placeholder/coming soon URLs (starts with '#')
      if (item.url === '#') return true;
      return authCanAccessRoute(currentUser, item.url);
    });

    return {
      ...section,
      items: filteredItems
    };
  }).filter(section => section.items.length > 0); // Remove empty sections

  return {
    ...APP_SIDEBAR,
    navMain: filteredNavMain
  };
}

export function canAccessRoute(path: string): boolean {
  const currentUser = getCurrentUser();
  return authCanAccessRoute(currentUser, path);
}
