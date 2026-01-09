import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireBusinessProfile?: boolean;
}

export const ProtectedRoute = ({ children, requireBusinessProfile = true }: ProtectedRouteProps) => {
  const { user, loading, hasBusinessProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to onboarding if user doesn't have a business profile
  // Skip this check if we're already on the onboarding page or if not required
  if (requireBusinessProfile && !hasBusinessProfile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
