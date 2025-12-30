import React, { Suspense, useEffect, lazy } from 'react';
import LoadingScreen from './components/LoadingScreen';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
const queryClient = new QueryClient();
// Removed PageLoader / LoadingSpinner to make Suspense transitions instant

// Lazy-load major routes to reduce initial bundle
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const DoctorsPage = lazy(() => import('./pages/DoctorsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AppointmentBookingPage = lazy(() => import('./pages/AppointmentBookingPage'));
const AppointmentPage = lazy(() => import('./pages/AppointmentPage'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const DoctorProfilePage = lazy(() => import('./pages/DoctorProfilePage'));
const FinancialHub = lazy(() => import('./pages/FinancialHub'));
const ResourcesCenter = lazy(() => import('./pages/ResourcesCenter'));
const LabResultsCenter = lazy(() => import('./pages/LabResultsCenter'));
const DoctorMessagesPage = lazy(() => import('./pages/DoctorMessagesPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PatientsPage = lazy(() => import('./pages/PatientsPage'));
const ReportsAnalyticsPage = lazy(() => import('./pages/ReportsAnalyticsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
// Chatbot widget (small floating UI) — import the component, not the page wrapper
const Chatbot = React.lazy(() => import('@/components/Chatbot'));
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy / heavy pages (already heavy)
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
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <React.Suspense fallback={<LoadingScreen />}>
              <Chatbot />
            </React.Suspense>
            <BrowserRouter>
              <Suspense fallback={<LoadingScreen />}>
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
                <Route path="/appointments" element={<ProtectedRoute allowedRoles={['patient','doctor']}><AppointmentPage /></ProtectedRoute>} />
                <Route path="/book-appointment" element={<ProtectedRoute allowedRoles={['patient']}><AppointmentBookingPage /></ProtectedRoute>} />

                {/* Patient */}
                <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
                <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={['patient']}><AppointmentPage /></ProtectedRoute>} />
                <Route path="/patient/medical-records" element={<ProtectedRoute allowedRoles={['patient','doctor']}><MedicalRecordsPage /></ProtectedRoute>} />
                <Route path="/patient/messages" element={<ProtectedRoute allowedRoles={['patient','doctor']}><MessagesPage /></ProtectedRoute>} />
                <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['patient']}><ProfilePage /></ProtectedRoute>} />
                <Route path="/patient/settings" element={<ProtectedRoute allowedRoles={['patient','doctor']}><SettingsPage /></ProtectedRoute>} />
                <Route path="/patient/video-call" element={<ProtectedRoute allowedRoles={['patient','doctor']}><VideoCallPage /></ProtectedRoute>} />
                <Route path="/patient/lab-results" element={<ProtectedRoute allowedRoles={['patient','doctor']}><LabResultsCenter /></ProtectedRoute>} />

                {/* Admin / Doctor */}
                <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/patients" element={<ProtectedRoute allowedRoles={['doctor']}><PatientsPage /></ProtectedRoute>} />
                <Route path="/reports-analytics" element={<ProtectedRoute allowedRoles={['doctor']}><ReportsAnalyticsPage /></ProtectedRoute>} />
                <Route path="/doctor/messages" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorMessagesPage /></ProtectedRoute>} />
                <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />

                {/* Misc Protected */}
                <Route path="/financial-hub" element={<ProtectedRoute><FinancialHub /></ProtectedRoute>} />
                <Route path="/resources" element={<ProtectedRoute><ResourcesCenter /></ProtectedRoute>} />
                <Route path="/medical-records" element={<ProtectedRoute allowedRoles={['doctor','patient']}><MedicalRecordsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute allowedRoles={['doctor','patient']}><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute allowedRoles={['doctor','patient']}><SettingsPage /></ProtectedRoute>} />
                {/* Shared aliases */}
                <Route path="/messages" element={<ProtectedRoute allowedRoles={['doctor','patient']}><MessagesPage /></ProtectedRoute>} />
                <Route path="/teleconsultation" element={<ProtectedRoute allowedRoles={['doctor','patient']}><VideoCallPage /></ProtectedRoute>} />
                <Route path="/lab-results" element={<ProtectedRoute allowedRoles={['doctor','patient']}><LabResultsCenter /></ProtectedRoute>} />

                {/* Errors */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
