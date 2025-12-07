import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Still determining session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 rounded-lg shadow-md bg-white/60 backdrop-blur">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  // If specific roles are required but user doesn't have the right role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If the user is authenticated but unauthorized, send to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // If user is logged in but trying to access auth pages
  if (!requireAuth && user && (location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;