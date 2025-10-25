import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier?: 'Premium' | 'Enterprise';
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children, requiredTier }) => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!user || !subscriptionStatus) {
        setIsLoading(false);
        return;
      }

      if (!subscriptionStatus.subscribed) {
        navigate('/pricing');
        return;
      }

      if (requiredTier) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.error("Could not verify user role.");
          navigate('/dashboard');
          return;
        }

        const userRole = userDoc.data().role;
        const tierLevels: Record<string, number> = { user: 0, premium: 1, enterprise: 2, admin: 3 };
        const requiredLevel = tierLevels[requiredTier.toLowerCase()];

        if (tierLevels[userRole] >= requiredLevel) {
          setIsAuthorized(true);
        } else {
          navigate('/pricing');
        }
      } else {
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };

    checkAuthorization();
  }, [user, subscriptionStatus, requiredTier, navigate]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return isAuthorized ? <>{children}</> : null;
};

export default SubscriptionGuard;