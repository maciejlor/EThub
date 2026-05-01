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

export const App = () => {
  return (
    <ThemeProvider>
      <Routes>
        <Route path='/' element={<DashboardPage />} />
        <Route path='/calendar' element={<CalendarPage />} />
        <Route path='/calendar/:id' element={<CalendarEventPage />} />
        <Route path='/events' element={<Navigate to='/calendar' replace />} />
        <Route path='/events/:id' element={<Navigate to='/calendar/:id' replace />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </ThemeProvider>
  );
};
