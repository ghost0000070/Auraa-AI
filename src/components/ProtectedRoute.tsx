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
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>;
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
