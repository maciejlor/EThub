import { getCurrentUser } from '@/lib/driver-storage';
import { getAccessibleRoutes } from '@/lib/auth';
import { APP_SIDEBAR } from '@/constants';

export function getFilteredSidebar() {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    // Return minimal sidebar for non-authenticated users
    return {
      ...APP_SIDEBAR,
      navMain: APP_SIDEBAR.navMain.map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.url === '/' || 
          item.url === '/members' || 
          item.url === '/download' || 
          item.url === '/jobs' || 
          item.url === '/calendar' || 
          item.url === '/ranking' || 
          item.url === '/faq' || 
          item.url === '/loa-requests'
        )
      }))
    };
  }

  // Get accessible routes based on user role
  const accessibleRoutes = getAccessibleRoutes(currentUser);
  
  // Filter sidebar items based on accessible routes
  const filteredNavMain = APP_SIDEBAR.navMain.map(section => {
    const filteredItems = section.items.filter(item => {
      // Check if the route is accessible
      const isAccessible = accessibleRoutes.some(route => 
        route === item.url || item.url.startsWith(route)
      );
      
      // Additional department-based checks
      if (!isAccessible) return false;
      
      // Check department access for specific routes
      if (item.url.startsWith('/hr/') && currentUser.department !== 'HR' && currentUser.role !== 'Admin') {
        return false;
      }
      
      if (item.url.startsWith('/event/') && currentUser.department !== 'Event' && currentUser.role !== 'Admin') {
        return false;
      }
      
      if (item.url.startsWith('/admin/') && currentUser.department !== 'Admin' && currentUser.role !== 'Admin') {
        return false;
      }
      
      return true;
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
  
  if (!currentUser) {
    // Only allow public routes for non-authenticated users
    const publicRoutes = ['/', '/members', '/download', '/jobs', '/calendar', 'ranking', '/faq', '/loa-requests'];
    return publicRoutes.some(route => path === route || path.startsWith(route));
  }

  // Admin can access everything
  if (currentUser.role === 'Admin') {
    return true;
  }

  // Check department-based access
  if (path.startsWith('/hr/') && currentUser.department !== 'HR') {
    return false;
  }
  
  if (path.startsWith('/event/') && currentUser.department !== 'Event') {
    return false;
  }
  
  if (path.startsWith('/admin/') && currentUser.department !== 'Admin') {
    return false;
  }

  // Check role-based permissions
  const accessibleRoutes = getAccessibleRoutes(currentUser);
  return accessibleRoutes.some(route => path === route || path.startsWith(route));
}
