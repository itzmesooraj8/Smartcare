import VideoCallPage from "./pages/VideoCallPage";
            <Route 
              path="/video-call" 
              element={
                <ProtectedRoute allowedRoles={['doctor', 'patient']}>
                  <VideoCallPage />
                </ProtectedRoute>
              } 
            />
import LabResultsCenter from "./pages/LabResultsCenter";
import DoctorMessagesPage from "./pages/DoctorMessagesPage";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chatbot from "./components/Chatbot";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import DoctorsPage from "./pages/DoctorsPage";
import ContactPage from "./pages/ContactPage";
import AppointmentBookingPage from "./pages/AppointmentBookingPage";
import AppointmentPage from "./pages/AppointmentPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";
import DoctorProfilePage from "./pages/DoctorProfilePage";
import FinancialHub from "./pages/FinancialHub";
import ResourcesCenter from "./pages/ResourcesCenter";
// Ensure the file exists or update the path if necessary
// import PatientProfilePage from "./pages/PatientProfilePage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import PatientsPage from "./pages/PatientsPage";
import ReportsAnalyticsPage from "./pages/ReportsAnalyticsPage";
import NotFound from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";

const queryClient = new QueryClient();

const App = () => (
  <>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/doctors/:id" element={<DoctorProfilePage />} />
              <Route path="/contact" element={<ContactPage />} />
              
              {/* Auth Routes */}
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <LoginPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <RegisterPage />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/appointments" 
                element={
                  <ProtectedRoute>
                    <AppointmentPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/book-appointment" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <AppointmentBookingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patient-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/lab-results" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <LabResultsCenter />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/doctor-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Additional Protected Routes */}
              <Route 
                path="/financial-hub" 
                element={
                  <ProtectedRoute>
                    <FinancialHub />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resources" 
                element={
                  <ProtectedRoute>
                    <ResourcesCenter />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patients" 
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <PatientsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports-analytics" 
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <ReportsAnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/medical-records" 
                element={
                  <ProtectedRoute>
                    <MedicalRecordsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorMessagesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute allowedRoles={['admin','patient']}>
                    <MessagesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />

              {/* Error Pages */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Chatbot />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </>
);

export default App;
