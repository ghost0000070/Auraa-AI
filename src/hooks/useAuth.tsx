import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { isOwnerAccount } from '@/lib/auth-helpers';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSubscriber: boolean;
  subscriptionStatus: {
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
  } | null;
  checkSubscription: () => Promise<void>;
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
  } | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!auth.currentUser) {
      setSubscriptionStatus(null);
      return;
    }

    try {
      // Refresh ID token to ensure it's sent with all Firestore requests
      await auth.currentUser.getIdToken(true);
      // Wait for token to be attached to SDK
      await new Promise(resolve => setTimeout(resolve, 500));

      // Owner account has unrestricted access
      if (isOwnerAccount(auth.currentUser)) {
        setSubscriptionStatus({
          subscribed: true,
          subscription_tier: 'unlimited',
          subscription_end: '2099-12-31T23:59:59Z',
        });
        setIsAdmin(true);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSubscriptionStatus({
          subscribed: userData.is_active || false,
          subscription_tier: userData.plan || null,
          subscription_end: userData.current_period_end || null,
        });
        // Check if user has admin role in Firestore
        setIsAdmin(userData.role === 'admin' || userData.role === 'owner'); 
      } else {
        setSubscriptionStatus(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      setSubscriptionStatus(null);
    }
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setSubscriptionStatus(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // CRITICAL: Wait before setting user state to ensure Firestore SDK initializes auth
        // This prevents components from attempting Firestore queries before token is attached
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        await checkSubscription();
      } else {
        setSubscriptionStatus(null);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, [checkSubscription]);

  const isSubscriber = isAdmin || subscriptionStatus?.subscribed || false;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      isSubscriber,
      subscriptionStatus,
      checkSubscription,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
