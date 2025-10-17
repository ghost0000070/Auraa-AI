import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
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
  console.log('[useAuth] Context:', context);
  if (context === undefined) {
    console.error('[useAuth] Context is undefined - AuthProvider not found in component tree');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  console.log('[AuthProvider] Initializing...');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
  } | null>(null);

  const checkSubscription = async (sessionToUse?: Session | null) => {
    const currentSession = sessionToUse || session;
    console.log('[SUBSCRIPTION] checkSubscription called, session exists:', !!currentSession);
    if (!currentSession) {
      console.log('[SUBSCRIPTION] No session, returning early');
      return;
    }

    console.log('[SUBSCRIPTION] Session user:', currentSession.user?.email);

    // Check if user is admin first - admins have unlimited access
    try {
      console.log('[ADMIN] Checking admin status...');
      const { data: adminCheck, error: adminError } = await supabase
        .rpc('is_admin', { user_id: currentSession.user.id });
      
      if (!adminError && adminCheck === true) {
        console.log('[ADMIN] User is admin - granting unlimited access');
        setIsAdmin(true);
        setSubscriptionStatus({
          subscribed: true,
          subscription_tier: 'Enterprise',
          subscription_end: null, // null means unlimited
        });
        return; // Admin gets unlimited access, skip subscription checks
      } else {
        setIsAdmin(false);
      }
    } catch (adminErr) {
      console.warn('[ADMIN] Admin check failed, continuing with subscription check:', adminErr);
      setIsAdmin(false);
    }

    // Early DB check: trust manual/lifetime subscriptions first
    try {
      console.log('[SUBSCRIPTION] Early DB check: subscribers table...');
      const { data: subEarly, error: subEarlyErr } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end')
        .eq('user_id', currentSession.user.id)
        .maybeSingle();
      console.log('[SUBSCRIPTION] Early DB check result:', { subEarly, subEarlyErr });
      if (!subEarlyErr && subEarly?.subscribed) {
        setSubscriptionStatus({
          subscribed: true,
          subscription_tier: subEarly.subscription_tier,
          subscription_end: subEarly.subscription_end,
        });
        console.log('[SUBSCRIPTION] Early DB says subscribed. Skipping edge function.');
        return;
      }
    } catch (earlyErr) {
      console.warn('[SUBSCRIPTION] Early DB check failed (will continue with edge function):', earlyErr);
    }

    interface SubscriptionFunctionResponse {
      subscribed: boolean;
      subscription_tier: string | null;
      subscription_end: string | null;
    }
    const isValidResponse = (d: unknown): d is SubscriptionFunctionResponse =>
      !!d && typeof (d as { subscribed?: unknown }).subscribed === 'boolean';

    try {
      console.log('[SUBSCRIPTION] Calling check-subscription function...');
      const headers = currentSession?.access_token
        ? { Authorization: `Bearer ${currentSession.access_token}` }
        : undefined;
      const { data, error } = await supabase.functions.invoke('check-subscription', { headers });
      console.log('[SUBSCRIPTION] check-subscription response:', { data, error });
      if (error) throw error;

      if (isValidResponse(data)) {
        console.log('[SUBSCRIPTION] Valid response received:', data);
        setSubscriptionStatus(data);

        // If edge function says unsubscribed, double-check DB for manual/lifetime subs
        if (data.subscribed === false) {
          try {
            console.log('[SUBSCRIPTION] Function returned unsubscribed. Verifying against subscribers table...');
            const { data: sub, error: subErr } = await supabase
              .from('subscribers')
              .select('subscribed, subscription_tier, subscription_end')
              .eq('user_id', currentSession.user.id)
              .maybeSingle();
            console.log('[SUBSCRIPTION] DB verification result:', { sub, subErr });
            if (!subErr && sub) {
              setSubscriptionStatus({
                subscribed: sub.subscribed,
                subscription_tier: sub.subscription_tier,
                subscription_end: sub.subscription_end,
              });
            }
          } catch (verifyErr) {
            console.warn('[SUBSCRIPTION] Verification against DB failed:', verifyErr);
          }
        }
        return;
      } else {
        console.warn('[SUBSCRIPTION] Invalid response from check-subscription function, falling back to DB...', data);
      }
    } catch (fnErr) {
      console.error('[SUBSCRIPTION] Error calling check-subscription function. Falling back to DB...', fnErr);
    }

    // Fallback: read directly from subscribers table (covers manual/lifetime subs)
    try {
      console.log('[SUBSCRIPTION] Using fallback: reading directly from subscribers table...');
      const { data: sub, error: dbErr } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end')
        .eq('user_id', currentSession.user.id)
        .maybeSingle();
      console.log('[SUBSCRIPTION] Fallback DB read result:', { sub, dbErr });
      if (dbErr) throw dbErr;
      if (sub) {
        console.log('[SUBSCRIPTION] Setting subscription status from DB:', sub);
        setSubscriptionStatus({
          subscribed: sub.subscribed,
          subscription_tier: sub.subscription_tier,
          subscription_end: sub.subscription_end,
        });
      } else {
        console.log('[SUBSCRIPTION] No subscription record found in DB');
        setSubscriptionStatus({ subscribed: false, subscription_tier: null, subscription_end: null });
      }
    } catch (dbErr) {
      console.error('[SUBSCRIPTION] Fallback DB subscription check failed:', dbErr);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setSubscriptionStatus(null);
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH] Auth state change:', { event, email: session?.user?.email });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check subscription when user signs in
      if (session?.user) {
        console.log('[AUTH] User authenticated, checking subscription for:', session.user.email);
        setTimeout(() => {
          checkSubscription(session);
        }, 0);
      } else {
        console.log('[AUTH] No user session, clearing subscription status');
        setSubscriptionStatus(null);
        setIsAdmin(false);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AUTH] Initial session check:', { email: session?.user?.email });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        console.log('[AUTH] Existing session found, checking subscription for:', session.user.email);
        setTimeout(() => {
          checkSubscription(session);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
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