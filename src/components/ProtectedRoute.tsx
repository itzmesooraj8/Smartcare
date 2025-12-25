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

  const hasToken = !!localStorage.getItem('smartcare_token');

  // If the route is public (requireAuth === false), allow access when not authenticated.
  if (!requireAuth) {
    // If user is already authenticated, redirect to dashboard
    if (user || hasToken) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  }

  // For protected routes: ensure there's a user or token
  if (!user && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles provided, enforce role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}