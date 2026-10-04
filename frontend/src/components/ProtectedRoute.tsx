// src/components/ProtectedRoute.tsx
// Enforces authentication and optional role-based access.
// Redirects unauthenticated users to /login and wrong-role users to their home.

import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, only users with this role (uppercase) can access this route */
  requiredRole?: 'LECTURER' | 'STUDENT' | 'ADMIN';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const userRole = getUserRole();
    if (userRole !== requiredRole) {
      // Redirect to the user's appropriate home instead of showing a blank page
      const fallback = userRole === 'STUDENT' ? '/student' : '/dashboard';
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
}
