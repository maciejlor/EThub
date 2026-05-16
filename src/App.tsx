/**
 * @copyright 2025 codewithsadee
 * @license Apache-2.0
 */

/**
 * Component
 */
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '@/pages/Dashboard';
import { CalendarPage } from '@/pages/Calendar';
import { LoginPage } from '@/pages/Login';
import { CalendarEventPage } from '@/pages/CalendarEvent.tsx';
import { JobsPage } from '@/pages/Jobs';
import { JobDetailsPage } from '@/pages/JobDetails';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
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
import { ViewProfilePage } from '@/pages/ViewProfilePage';
import { DiscordCallbackPage } from '@/pages/DiscordCallbackPage';

// Authentication check component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('ethub_authenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export const App = () => {
  return (
    <ThemeProvider>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/auth/discord/callback' element={<DiscordCallbackPage />} />
        <Route path='/' element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path='/jobs' element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
        <Route path='/jobs/:id' element={<ProtectedRoute><JobDetailsPage /></ProtectedRoute>} />
        <Route path='/calendar' element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path='/calendar/:id' element={<ProtectedRoute><CalendarEventPage /></ProtectedRoute>} />
        <Route path='/events' element={<Navigate to='/calendar' replace />} />
        <Route path='/events/:id' element={<Navigate to='/calendar/:id' replace />} />
        {/* New Pages mapped to Placeholder */}
        <Route path='/members' element={<ProtectedRoute><PlaceholderPage title='Members' description='Manage all VTC members here.' /></ProtectedRoute>} />
        <Route path='/download' element={<ProtectedRoute><PlaceholderPage title='Download' description='Download center for VTC resources and mods.' /></ProtectedRoute>} />
        <Route path='/ranking' element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
        <Route path='/faq' element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
        <Route path='/jobs' element={<JobsPage />} />
        <Route path='/jobs/:id' element={<JobDetailsPage />} />
        <Route path='/calendar' element={<CalendarPage />} />
        <Route path='/calendar/:id' element={<CalendarEventPage />} />
        <Route path='/events' element={<Navigate to='/calendar' replace />} />
        <Route path='/events/:id' element={<Navigate to='/calendar/:id' replace />} />
        {/* New Pages mapped to Placeholder */}
        <Route path='/members' element={<PlaceholderPage title='Members' description='Manage all VTC members here.' />} />
        <Route path='/download' element={<PlaceholderPage title='Download' description='Download center for VTC resources and mods.' />} />
        <Route path='/ranking' element={<RankingPage />} />
        <Route path='/faq' element={<FAQPage />} />
        <Route path='/loa-requests' element={<LoaRequestsPage />} />
        
        {/* HR Department */}
        <Route path='/hr/loa-management' element={<LoaManagementPage />} />
        <Route path='/hr/attendance-logs' element={<ConvoyAttendancePage />} />
        <Route path='/hr/blacklist-driver' element={<BlacklistDriverPage />} />
        <Route path='/hr/driver-manage' element={<DriverManagePage />} />
        <Route path='/hr/left-drivers' element={<LeftDriversPage />} />
        <Route path='/hr/applications' element={<PlaceholderPage title='HR Applications' description='Review and process new driver applications.' />} />

        {/* Event Department */}
        <Route path='/event/calendar-manage' element={<PlaceholderPage title='Event Calendar Manage' description='Manage the VTC event calendar.' />} />
        <Route path='/event/invites' element={<EventInvitesPage />} />
        <Route path='/event/blacklist-vtcs' element={<BlacklistVTCsPage />} />

        {/* Admin */}
        <Route path='/admin/members' element={<AllMembersPage />} />
        <Route path='/admin/blacklist-staff' element={<BlacklistStaffPage />} />
        <Route path='/admin/history' element={<HistoryPage />} />
        <Route path='/admin/history-logs' element={<PlaceholderPage title='History' description='View audit logs and history.' />} />
        <Route path='/settings' element={<SettingsPage />} />
        <Route path='/profile' element={<ViewProfilePage />} />
        <Route path='/profile/:userId' element={<ViewProfilePage />} />

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </ThemeProvider>
  );
};
