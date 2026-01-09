import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/supabase";
import { OWNER_EMAIL, TIER_LEVELS } from '@/config/constants';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier?: 'Premium' | 'Enterprise';
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children, requiredTier }) => {
  const { user, subscriptionStatus, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedRef = useRef(false);

  // Check if user is owner - synchronized with useAuth
  const isOwner = user?.email === OWNER_EMAIL;

  useEffect(() => {
    // Prevent running multiple times for the same user state
    if (authLoading) {
      return; // Wait for auth to finish loading
    }

    const checkAuthorization = async () => {
      // Skip if we've already checked for this user
      if (hasCheckedRef.current) {
        return;
      }

      if (!user) {
        // Auth finished loading but no user - redirect to auth
        setIsLoading(false);
        navigate('/auth');
        return;
      }

      hasCheckedRef.current = true;

      // ⚡ OWNER BYPASS: Always authorized
      if (isOwner) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      if (!subscriptionStatus?.subscribed) {
        setIsLoading(false);
        navigate('/pricing');
        return;
      }

      if (requiredTier) {
        // For regular users, check tier
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('role, subscription_tier')
            .eq('id', user.id)
            .single();

          if (error || !userData) {
            console.error("Could not verify user role.");
            setIsLoading(false);
            navigate('/dashboard');
            return;
          }

          // Allow access if user role matches or if subscription plan matches
          const userRole = userData.role || 'user';
          const userPlan = userData.subscription_tier || 'free';
          
          const requiredLevel = TIER_LEVELS[requiredTier.toLowerCase()] || 0;
          const currentRoleLevel = TIER_LEVELS[userRole.toLowerCase()] || 0;
          const currentPlanLevel = TIER_LEVELS[userPlan.toLowerCase()] || 0;

          // Use the higher of role or plan level
          const effectiveLevel = Math.max(currentRoleLevel, currentPlanLevel);

          if (effectiveLevel >= requiredLevel) {
            setIsAuthorized(true);
          } else {
            navigate('/pricing');
          }
        } catch (e) {
          console.error("Error checking tier", e);
          navigate('/pricing');
        }
      } else {
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };

    checkAuthorization();
  }, [user, subscriptionStatus, requiredTier, navigate, isOwner, authLoading]);

  // Reset the check ref if user changes
  useEffect(() => {
    hasCheckedRef.current = false;
  }, [user?.id]);

  if (isLoading || authLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading authorization...</div>;
  }

  if (!user) {
    // Already redirected in effect, return null
    return null;
  }

  return isAuthorized ? <>{children}</> : null;
};

export default SubscriptionGuard;
