import { getCurrentUser, type UserEntry } from './driver-storage';

export type UserRole =
  | 'Admin'
  | 'Overseer'
  | 'HR Manager'
  | 'Event Manager'
  | 'HR Team'
  | 'Event Assistant'
  | 'Driver'
  | 'HR Staff'
  | 'Event Staff'
  | 'Senior Staff';
export type Department = 'HR' | 'Event' | 'Admin' | 'None';

export interface Permission {
  resource: string;
  action: string;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Admin': [
    { resource: '*', action: '*' }, // Full access to everything
  ],
  'Overseer': [
    { resource: '*', action: '*' }, // Full access to everything
  ],
  'HR Manager': [
    { resource: 'hr', action: '*' }, // Full HR department access
    { resource: 'drivers', action: '*' }, // Full driver management
    { resource: 'loa', action: '*' }, // LOA management (accept/reject)
    { resource: 'attendance', action: '*' }, // Attendance logs (create/delete)
    { resource: 'blacklist', action: '*' }, // Blacklist drivers
    { resource: 'dashboard', action: 'read' },
    { resource: 'members', action: 'read' },
    { resource: 'download', action: 'read' },
    { resource: 'jobs', action: 'read' },
    { resource: 'events', action: 'read' },
    { resource: 'ranking', action: 'read' },
    { resource: 'faq', action: 'read' },
    { resource: 'loa-requests', action: 'create' }, // Can create LOA requests
    { resource: 'history', action: 'read' },
  ],
  'Event Manager': [
    { resource: 'events', action: '*' }, // Full event department access
    { resource: 'event-invites', action: '*' }, // Event invites (add/create/delete/changes)
    { resource: 'blacklist-vtc', action: '*' }, // Event blacklist
    { resource: 'dashboard', action: 'read' },
    { resource: 'members', action: 'read' },
    { resource: 'download', action: 'read' },
    { resource: 'jobs', action: 'read' },
    { resource: 'events', action: 'read' },
    { resource: 'ranking', action: 'read' },
    { resource: 'faq', action: 'read' },
    { resource: 'loa-requests', action: 'create' }, // Can create LOA requests
    { resource: 'history', action: 'read' },
  ],
  'HR Team': [
    { resource: 'dashboard', action: 'read' },
    { resource: 'members', action: 'read' },
    { resource: 'download', action: 'read' },
    { resource: 'jobs', action: 'read' },
    { resource: 'events', action: 'read' },
    { resource: 'ranking', action: 'read' },
    { resource: 'faq', action: 'read' },
    { resource: 'loa-requests', action: 'create' }, // Can create LOA requests
    { resource: 'history', action: 'read' },
  ],
  'HR Staff': [
    { resource: 'dashboard', action: 'read' },
    { resource: 'members', action: 'read' },
    { resource: 'download', action: 'read' },
    { resource: 'jobs', action: 'read' },
    { resource: 'events', action: 'read' },
    { resource: 'ranking', action: 'read' },
    { resource: 'faq', action: 'read' },
    { resource: 'loa-requests', action: 'create' }, // Can create LOA requests
    { resource: 'history', action: 'read' },
  ],
  'Event Assistant': [
    { resource: 'dashboard', action: 'read' },
    { resource: 'members', action: 'read' },
    { resource: 'download', action: 'read' },
    { resource: 'jobs', action: 'read' },
    { resource: 'events', action: 'read' },
    { resource: 'ranking', action: 'read' },
    { resource: 'faq', action: 'read' },
    { resource: 'loa-requests', action: 'create' }, // Can create LOA requests
    { resource: 'history', action: 'read' },
  ],
  'Event Staff': [
    { resource: 'dashboard', action: 'read' },
    { resource: 'members', action: 'read' },
    { resource: 'download', action: 'read' },
    { resource: 'jobs', action: 'read' },
    { resource: 'events', action: 'read' },
    { resource: 'ranking', action: 'read' },
    { resource: 'faq', action: 'read' },
    { resource: 'loa-requests', action: 'create' }, // Can create LOA requests
    { resource: 'history', action: 'read' },
  ],
  'Senior Staff': [
    { resource: 'dashboard', action: 'read' },
    { resource: 'members', action: 'read' },
    { resource: 'download', action: 'read' },
    { resource: 'jobs', action: 'read' },
    { resource: 'events', action: 'read' },
    { resource: 'ranking', action: 'read' },
    { resource: 'faq', action: 'read' },
    { resource: 'loa-requests', action: 'create' }, // Can create LOA requests
    { resource: 'history', action: 'read' },
  ],
  'Driver': [
    { resource: 'dashboard', action: 'read' },
    { resource: 'members', action: 'read' },
    { resource: 'download', action: 'read' },
    { resource: 'jobs', action: 'read' },
    { resource: 'events', action: 'read' },
    { resource: 'ranking', action: 'read' },
    { resource: 'faq', action: 'read' },
    { resource: 'loa-requests', action: 'create' }, // Can create LOA requests
    { resource: 'history', action: 'read' },
  ],
};

// Department-based access control
export const DEPARTMENT_ACCESS: Record<Department, string[]> = {
  'HR': [
    '/hr/loa-management',
    '/hr/attendance-logs',
    '/hr/blacklist-driver',
    '/hr/driver-manage',
    '/hr/applications',
  ],
  'Event': [
    '/event/calendar-manage',
    '/event/invites',
    '/event/blacklist-vtcs',
  ],
  'Admin': [
    '/admin/members',
    '/admin/blacklist-staff',
    '/admin/history',
  ],
  'None': [],
};

export function hasPermission(user: UserEntry | null, resource: string, action: string): boolean {
  if (!user) return false;
  
  const permissions = ROLE_PERMISSIONS[user.role] ?? [];
  
  // Check for wildcard permissions
  const hasWildcard = permissions.some(p => p.resource === '*' && p.action === '*');
  if (hasWildcard) return true;
  
  // Check for specific resource permission
  const hasResourcePermission = permissions.some(p => 
    (p.resource === resource || p.resource === '*') && 
    (p.action === action || p.action === '*')
  );
  
  return hasResourcePermission;
}

export function canAccessDepartment(user: UserEntry | null, path: string): boolean {
  if (!user) return false;
  
  // Admin can access everything
  if (user.role === 'Admin') return true;
  
  // Check department-based access
  const departmentPaths = DEPARTMENT_ACCESS[user.department];
  return departmentPaths.some((allowedPath: string) => path.startsWith(allowedPath));
}

export function canAccessRoute(user: UserEntry | null, path: string): boolean {
  if (!user) return false;
  
  // Admin can access everything
  if (user.role === 'Admin') return true;

  // HR Department restricted routes
  if (path.startsWith('/hr/')) {
    return user.department === 'HR';
  }

  // Event Department restricted routes
  if (path.startsWith('/event/')) {
    return user.department === 'Event';
  }

  // Admin restricted routes
  if (path.startsWith('/admin/')) {
    return false;
  }

  // Other routes (Main, Game, Drivers sections) are accessible to Driver and above
  return true;
}

export function getAccessibleRoutes(user: UserEntry | null): string[] {
  if (!user) return [];
  
  // Admin gets all routes
  if (user.role === 'Admin') {
    return [
      '/', // Dashboard
      '/members',
      '/download',
      '/jobs',
      '/calendar',
      '/ranking',
      '/faq',
      '/loa-requests',
      '/hr/loa-management',
      '/hr/attendance-logs',
      '/hr/blacklist-driver',
      '/hr/driver-manage',
      '/hr/applications',
      '/event/calendar-manage',
      '/event/invites',
      '/event/blacklist-vtcs',
      '/admin/members',
      '/admin/blacklist-staff',
      '/admin/history',
    ];
  }
  
  // Get department routes
  const departmentRoutes = DEPARTMENT_ACCESS[user.department] || [];
  
  // Add common routes
  const commonRoutes = ['/', '/members', '/download', '/jobs', '/calendar', '/ranking', '/faq', '/loa-requests'];
  
  // Add role-specific routes
  const roleSpecificRoutes = [];
  if (user.role === 'HR Manager') {
    roleSpecificRoutes.push('/hr/loa-management', '/hr/attendance-logs', '/hr/blacklist-driver', '/hr/driver-manage', '/hr/applications');
  } else if (user.role === 'Event Manager') {
    roleSpecificRoutes.push('/event/calendar-manage', '/event/invites', '/event/blacklist-vtcs');
  }
  
  return [...commonRoutes, ...departmentRoutes, ...roleSpecificRoutes];
}

export function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    // Redirect to login or show access denied
    window.location.href = '/login';
    return false;
  }
  return true;
}

export function requireRole(requiredRole: UserRole) {
  const user = getCurrentUser();
  if (!user || user.role !== requiredRole) {
    // Redirect or show access denied
    return false;
  }
  return true;
}

export function requireDepartment(requiredDepartment: Department) {
  const user = getCurrentUser();
  if (!user || user.department !== requiredDepartment) {
    // Redirect or show access denied
    return false;
  }
  return true;
}

export function requirePermission(resource: string, action: string) {
  const user = getCurrentUser();
  return hasPermission(user, resource, action);
}
