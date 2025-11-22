import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
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

    // ⚡ OWNER OVERRIDE: Automatically grant Admin & Enterprise status to the site owner
    // This ensures you have full access regardless of database state.
    if (auth.currentUser.email === 'ghostspooks@icloud.com') {
        setSubscriptionStatus({
            subscribed: true,
            subscription_tier: 'Enterprise (Owner)',
            subscription_end: null,
        });
        setIsAdmin(true);
        return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSubscriptionStatus({
          subscribed: userData.is_active || false,
          subscription_tier: userData.plan || null,
          subscription_end: userData.current_period_end || null,
        });
        // Check if user has admin role in Firestore
        setIsAdmin(userData.role === 'admin'); 
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

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      subscriptionStatus,
      checkSubscription,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
