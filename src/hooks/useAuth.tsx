import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
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

// eslint-disable-next-line react-refresh/only-export-components
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
  const [user, setUser] = useState<User | null>({ email: 'ghostspooks@icloud.com' } as User);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
  } | null>({ subscribed: true, subscription_tier: 'Enterprise (Admin)', subscription_end: null });

  const checkSubscription = useCallback(async () => {
    // No-op
  }, []);

  const signOut = async () => {
    // No-op
  };

  useEffect(() => {
    // No-op
  }, []);

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
