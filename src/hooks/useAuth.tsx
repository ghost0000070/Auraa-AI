import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase'; // Correctly import Firebase auth and Firestore db

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

  const checkSubscription = async () => {
    if (!user) {
      setSubscriptionStatus(null);
      setIsAdmin(false);
      return;
    }

    try {
      // 1. Check for admin claims from the user's ID token
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.admin) {
        setIsAdmin(true);
        setSubscriptionStatus({
          subscribed: true,
          subscription_tier: 'Enterprise (Admin)',
          subscription_end: null,
        });
        return;
      }
      setIsAdmin(false);
      
      // 2. Fetch subscription status from the 'subscribers' collection
      const subscriberDocRef = doc(db, 'subscribers', user.uid);
      const subscriberDoc = await getDoc(subscriberDocRef);

      if (subscriberDoc.exists()) {
        const data = subscriberDoc.data();
        setSubscriptionStatus({
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end?.toDate()?.toLocaleDateString() || null,
        });
      } else {
        setSubscriptionStatus({ subscribed: false, subscription_tier: null, subscription_end: null });
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscriptionStatus({ subscribed: false, subscription_tier: null, subscription_end: null });
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
    setSubscriptionStatus(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await checkSubscription();
      } else {
        setIsAdmin(false);
        setSubscriptionStatus(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
