import React, { Suspense, useEffect, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
const queryClient = new QueryClient();
const PageLoader = (): JSX.Element => (
  <div style={{ minHeight: '100vh' }} className="flex items-center justify-center">
    Loading...
  </div>
);

// Core pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import DoctorsPage from './pages/DoctorsPage';
import ContactPage from './pages/ContactPage';
import AppointmentBookingPage from './pages/AppointmentBookingPage';
import AppointmentPage from './pages/AppointmentPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfilePage from './pages/DoctorProfilePage';
import FinancialHub from './pages/FinancialHub';
import ResourcesCenter from './pages/ResourcesCenter';
import LabResultsCenter from './pages/LabResultsCenter';
import DoctorMessagesPage from './pages/DoctorMessagesPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PatientsPage from './pages/PatientsPage';
import ReportsAnalyticsPage from './pages/ReportsAnalyticsPage';
import NotFound from './pages/NotFound';
import UnauthorizedPage from './pages/UnauthorizedPage';
import Chatbot from './pages/Chatbot';

// Lazy / heavy pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MedicalRecordsPage = lazy(() => import('./pages/MedicalRecordsPage'));
const VideoCallPage = lazy(() => import('./pages/VideoCallPage'));
const WaitingRoom = lazy(() => import('./pages/WaitingRoom'));

const App = (): JSX.Element => {
  useEffect(() => {
    document.title = 'SmartCare';
  }, []);

  const LoggedOutRedirect = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    if (user) {
      const dest = user.role === 'patient' ? '/patient/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : user.role === 'admin' ? '/admin-dashboard' : '/dashboard';
      return <Navigate to={dest} replace />;
    }
    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Chatbot />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/doctors" element={<DoctorsPage />} />
                <Route path="/doctors/:id" element={<DoctorProfilePage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Auth */}
                <Route path="/login" element={<LoggedOutRedirect><LoginPage /></LoggedOutRedirect>} />
                <Route path="/register" element={<LoggedOutRedirect><RegisterPage /></LoggedOutRedirect>} />

                {/* Protected */}
                <Route path="/video-call" element={<ProtectedRoute allowedRoles={['doctor','patient']}><VideoCallPage /></ProtectedRoute>} />
                <Route path="/waiting-room" element={<ProtectedRoute allowedRoles={['doctor','patient']}><WaitingRoom /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/appointments" element={<ProtectedRoute><AppointmentPage /></ProtectedRoute>} />
                <Route path="/book-appointment" element={<ProtectedRoute allowedRoles={['patient']}><AppointmentBookingPage /></ProtectedRoute>} />

                {/* Patient */}
                <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
                <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={['patient']}><AppointmentPage /></ProtectedRoute>} />
                <Route path="/patient/medical-records" element={<ProtectedRoute allowedRoles={['patient']}><MedicalRecordsPage /></ProtectedRoute>} />
                <Route path="/patient/messages" element={<ProtectedRoute allowedRoles={['patient']}><MessagesPage /></ProtectedRoute>} />
                <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['patient']}><ProfilePage /></ProtectedRoute>} />
                <Route path="/patient/settings" element={<ProtectedRoute allowedRoles={['patient']}><SettingsPage /></ProtectedRoute>} />
                <Route path="/patient/video-call" element={<ProtectedRoute allowedRoles={['patient']}><VideoCallPage /></ProtectedRoute>} />
                <Route path="/patient/lab-results" element={<ProtectedRoute allowedRoles={['patient']}><LabResultsCenter /></ProtectedRoute>} />

                {/* Admin / Doctor */}
                <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/patients" element={<ProtectedRoute allowedRoles={['doctor']}><PatientsPage /></ProtectedRoute>} />
                <Route path="/reports-analytics" element={<ProtectedRoute allowedRoles={['doctor']}><ReportsAnalyticsPage /></ProtectedRoute>} />
                <Route path="/doctor/messages" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorMessagesPage /></ProtectedRoute>} />
                <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />

                {/* Misc Protected */}
                <Route path="/financial-hub" element={<ProtectedRoute><FinancialHub /></ProtectedRoute>} />
                <Route path="/resources" element={<ProtectedRoute><ResourcesCenter /></ProtectedRoute>} />
                <Route path="/medical-records" element={<ProtectedRoute><MedicalRecordsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                {/* Errors */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
