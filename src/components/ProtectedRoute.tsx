import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

type Props = {
  children: React.ReactNode;
  requireAuth?: boolean; // default true
  allowedRoles?: Array<'patient' | 'doctor' | 'admin'>;
};

export default function ProtectedRoute({ children, requireAuth = true, allowedRoles }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If the route is public (requireAuth === false), allow access when not authenticated.
  if (!requireAuth) {
    if (user) {
      const role = user.role;
      const dest = role === 'patient' ? '/patient/dashboard' : role === 'doctor' ? '/doctor/dashboard' : role === 'admin' ? '/admin-dashboard' : '/dashboard';
      return <Navigate to={dest} replace />;
    }
    return <>{children}</>;
  }

  // For protected routes: ensure authenticated user profile is present
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles provided, enforce role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}