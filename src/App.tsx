/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

/**
 * Component
 */
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DashboardPage } from '@/pages/Dashboard';
import { CalendarPage } from '@/pages/Calendar';
import { LoginPage } from '@/pages/Login';
import { CalendarEventPage } from '@/pages/CalendarEvent.tsx';
import { JobsPage } from '@/pages/Jobs';
import { JobDetailsPage } from '@/pages/JobDetails';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { DownloadPage } from '@/pages/DownloadPage';
import { RankingPage } from '@/pages/Ranking';
import { ConvoyAttendancePage } from '@/pages/ConvoyAttendance';
import { FAQPage } from '@/pages/FAQ';
import { LoaRequestsPage } from '@/pages/LoaRequestsPage';
import { LoaManagementPage } from '@/pages/LoaManagementPage';
import { BlacklistDriverPage } from '@/pages/BlacklistDriverPage';
import { DriverManagePage } from '@/pages/DriverManagePage';
import { LeftDriversPage } from '@/pages/LeftDriversPage';
import { EventInvitesPage } from '@/pages/EventInvitesPage';
import { BlacklistVTCsPage } from '@/pages/BlacklistVTCsPage';
import { BlacklistStaffPage } from '@/pages/BlacklistStaffPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { AllMembersPage } from '@/pages/AllMembersPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/Profile';
import { ProfileUserPage } from '@/pages/ProfileUser';
import { DiscordCallbackPage } from '@/pages/DiscordCallbackPage';
import { SteamCallbackPage } from '@/pages/SteamCallbackPage';
import { getCurrentUser } from '@/lib/driver-storage';
import { useEffect } from 'react';
import { startSync } from '@/lib/sync';
import { canAccessRoute } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { ToastContainer } from '@/components/ToastContainer';

// Authentication check component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('ethub_authenticated') === 'true';
  const currentUser = getCurrentUser();
  const location = useLocation();

  if (!isAuthenticated || !currentUser || !currentUser.isActive || currentUser.isPending) {
    // If not authenticated or not in all members list (active and approved), deny access
    localStorage.removeItem('ethub_authenticated');
    localStorage.removeItem('ethub_discord_user');
    localStorage.removeItem('ethub_auth_method');
    localStorage.removeItem('ethub_login_time');
    localStorage.removeItem('ethub_current_user_id');
    return <Navigate to="/login" replace />;
  }

  // Check department/role access rules
  if (!canAccessRoute(currentUser, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App = () => {
  // Start multi-browser sync once after mount — safe, non-blocking
  useEffect(() => { startSync(); }, []);

  return (
    <ToastProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ToastContainer />
          <Routes>
          {/* Public */}
          <Route path='/login' element={<LoginPage />} />
          <Route path='/auth/discord/callback' element={<DiscordCallbackPage />} />
          <Route path='/auth/steam/callback' element={<SteamCallbackPage />} />

          {/* Protected — common */}
          <Route path='/' element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path='/jobs' element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
          <Route path='/jobs/:id' element={<ProtectedRoute><JobDetailsPage /></ProtectedRoute>} />
          <Route path='/calendar' element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path='/calendar/:id' element={<ProtectedRoute><CalendarEventPage /></ProtectedRoute>} />
          <Route path='/events' element={<Navigate to='/calendar' replace />} />
          <Route path='/events/:id' element={<Navigate to='/calendar/:id' replace />} />
          <Route path='/members' element={<ProtectedRoute><AllMembersPage /></ProtectedRoute>} />
          <Route path='/download' element={<ProtectedRoute><DownloadPage /></ProtectedRoute>} />
          <Route path='/ranking' element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
          <Route path='/faq' element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
          <Route path='/loa-requests' element={<ProtectedRoute><LoaRequestsPage /></ProtectedRoute>} />

          {/* HR Department */}
          <Route path='/hr/loa-management' element={<ProtectedRoute><LoaManagementPage /></ProtectedRoute>} />
          <Route path='/hr/attendance-logs' element={<ProtectedRoute><ConvoyAttendancePage /></ProtectedRoute>} />
          <Route path='/hr/blacklist-driver' element={<ProtectedRoute><BlacklistDriverPage /></ProtectedRoute>} />
          <Route path='/hr/driver-manage' element={<ProtectedRoute><DriverManagePage /></ProtectedRoute>} />
          <Route path='/hr/left-drivers' element={<ProtectedRoute><LeftDriversPage /></ProtectedRoute>} />
          <Route path='/hr/applications' element={<ProtectedRoute><PlaceholderPage title='HR Applications' description='Review and process new driver applications.' /></ProtectedRoute>} />

          {/* Event Department */}
          <Route path='/event/calendar-manage' element={<ProtectedRoute><PlaceholderPage title='Event Calendar Manage' description='Manage the VTC event calendar.' /></ProtectedRoute>} />
          <Route path='/event/invites' element={<ProtectedRoute><EventInvitesPage /></ProtectedRoute>} />
          <Route path='/event/blacklist-vtcs' element={<ProtectedRoute><BlacklistVTCsPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path='/admin/members' element={<ProtectedRoute><AllMembersPage /></ProtectedRoute>} />
          <Route path='/admin/allmembers' element={<Navigate to='/admin/members' replace />} />
          <Route path='/admin/blacklist-staff' element={<ProtectedRoute><BlacklistStaffPage /></ProtectedRoute>} />
          <Route path='/admin/history' element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path='/admin/history-logs' element={<ProtectedRoute><PlaceholderPage title='History' description='View audit logs and history.' /></ProtectedRoute>} />

          <Route path='/settings' element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path='/profile' element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path='/profile/users/:id' element={<ProtectedRoute><ProfileUserPage /></ProtectedRoute>} />

          <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </ThemeProvider>
      </LanguageProvider>
    </ToastProvider>
  );
};
