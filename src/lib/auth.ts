import { getCurrentUser, getRoles, type UserEntry, type Permission } from './driver-storage';

export function hasPermission(user: UserEntry | null, permission: Permission): boolean {
  if (!user) return false;
  const roles = getRoles();
  let role = roles.find(r => r.id === user.role);
  if (!role) role = roles.find(r => r.name === user.role);
  if (!role) return false;
  return role.permissions.includes(permission);
}

export function canAccessRoute(user: UserEntry | null, path: string): boolean {
  if (!user) return false;

  const roles = getRoles();
  let role = roles.find(r => r.id === user.role);
  if (!role) role = roles.find(r => r.name === user.role);
  if (!role) return false;

  // HR routes
  if (path.startsWith('/hr/')) {
    if (path.includes('/loa')) return role.permissions.includes('manage_loa') || role.permissions.includes('manage_hr');
    if (path.includes('/attendance')) return role.permissions.includes('manage_attendance') || role.permissions.includes('manage_hr');
    if (path.includes('/blacklist')) return role.permissions.includes('manage_blacklist') || role.permissions.includes('manage_hr');
    if (path.includes('/left-drivers')) return role.permissions.includes('manage_left_drivers') || role.permissions.includes('manage_hr');
    // Default fallback for other HR routes
    return role.permissions.includes('manage_hr');
  }

  // Event routes
  if (path.startsWith('/event/')) {
    return role.permissions.includes('manage_events');
  }

  // Admin routes
  if (path.startsWith('/admin/')) {
    if (path.includes('/roles')) return role.permissions.includes('manage_roles');
    if (path.includes('/members')) return role.permissions.includes('manage_users');
    if (path.includes('/history')) return role.permissions.includes('view_audit_logs');
    // Default admin access
    return role.permissions.includes('manage_settings') || role.name === 'Admin';
  }

  // Other routes (Main, Game, Drivers sections) are accessible to anyone logged in
  return true;
}

export function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

