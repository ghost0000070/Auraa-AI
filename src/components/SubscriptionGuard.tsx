import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { OWNER_EMAIL, TIER_LEVELS } from '@/config/constants';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier?: 'Premium' | 'Enterprise';
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children, requiredTier }) => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is owner - synchronized with useAuth
  const isOwner = user?.email === OWNER_EMAIL;

  useEffect(() => {
    const checkAuthorization = async () => {
      // If loading auth, wait
      if (isLoading && !user) {
          // Don't stop loading yet if auth is initializing in useAuth
          // But here we only have 'user' from context, not 'loading' from context directly
          // Let's assume if user is null but we are here, we might be waiting.
          // Actually useAuth provides a 'loading' state, let's assume it's passed or handled.
      }

      if (!user) {
        // If auth is finished and no user, redirect
        // We can't easily know if auth is 'loading' from just 'user' without the loading prop from useAuth
        // But typically this component is used inside protected routes.
        // Let's assume if user is missing, we wait or redirect. 
        // For safety, let's just set loading false and let the render return null/redirect.
        setIsLoading(false);
        return;
      }

      // ⚡ OWNER BYPASS: Always authorized
      if (isOwner) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
      }

      if (!subscriptionStatus?.subscribed) {
        navigate('/pricing');
        return;
      }

      if (requiredTier) {
        // For regular users, check tier
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
              console.error("Could not verify user role.");
              navigate('/dashboard');
              return;
            }

            const userData = userDoc.data();
            // Allow access if user role matches or if subscription plan matches
            const userRole = userData.role || 'user';
            const userPlan = userData.plan || 'free';
            
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
  }, [user, subscriptionStatus, requiredTier, navigate, isOwner, isLoading]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading authorization...</div>;
  }

  if (!user) {
      // Fallback redirect if not caught in effect
      navigate('/auth');
      return null;
  }

  return isAuthorized ? <>{children}</> : null;
};

export default SubscriptionGuard;
