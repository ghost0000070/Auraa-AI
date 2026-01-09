
import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, onAuthStateChanged } from '@/supabase';
import { errorTracker } from '@/lib/errorTracking';
import { OWNER_EMAIL, OWNER_UID } from '@/config/constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSubscriber: boolean;
  hasBusinessProfile: boolean;
  subscriptionStatus: {
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
  } | null;
  checkSubscription: () => Promise<void>;
  checkBusinessProfile: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
  } | null>(null);

  const checkBusinessProfile = useCallback(async (): Promise<boolean> => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      setHasBusinessProfile(false);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      const hasProfile = !error && !!data;
      setHasBusinessProfile(hasProfile);
      return hasProfile;
    } catch {
      setHasBusinessProfile(false);
      return false;
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      setSubscriptionStatus(null);
      return;
    }

    try {
      // Check if user is admin from user_metadata or database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        setSubscriptionStatus(null);
        setIsAdmin(false);
        return;
      }

      if (userData) {
        // Check if user is owner by env vars OR database role
        const isOwnerByEnv = currentUser.id === OWNER_UID || currentUser.email === OWNER_EMAIL;
        const isUserAdmin = isOwnerByEnv || userData.role === 'admin' || userData.role === 'owner';
        setIsAdmin(isUserAdmin);
        
        // Admin/Owner has unlimited access
        if (isUserAdmin) {
          setSubscriptionStatus({
            subscribed: true,
            subscription_tier: 'unlimited',
            subscription_end: '2099-12-31T23:59:59Z',
          });
        } else {
          setSubscriptionStatus({
            subscribed: userData.is_active || false,
            subscription_tier: userData.subscription_tier || null,
            subscription_end: userData.subscription_ends_at || null,
          });
        }
      } else {
        setSubscriptionStatus(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      errorTracker.captureError(error as Error, {
        tags: { component: 'useAuth', function: 'checkSubscription' },
        user: { id: currentUser?.id },
      });
      setSubscriptionStatus(null);
    }
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSubscriptionStatus(null);
      setIsAdmin(false);
      setHasBusinessProfile(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await Promise.all([checkSubscription(), checkBusinessProfile()]);
      } else {
        setSubscriptionStatus(null);
        setIsAdmin(false);
        setHasBusinessProfile(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [checkSubscription, checkBusinessProfile]);

  const isSubscriber = isAdmin || subscriptionStatus?.subscribed || false;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      isSubscriber,
      hasBusinessProfile,
      subscriptionStatus,
      checkSubscription,
      checkBusinessProfile,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
