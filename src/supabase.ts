import { createClient } from '@supabase/supabase-js';

// Get environment variables (trim to avoid accidental newlines in env values)
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:', { 
    supabaseUrl: !!supabaseUrl, 
    supabaseAnonKey: !!supabaseAnonKey 
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Remember Me storage key
const REMEMBER_ME_KEY = 'auraa_remember_me';

// Check if user wants to be remembered
export const getRememberMe = (): boolean => {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
};

// Set remember me preference
export const setRememberMe = (remember: boolean): void => {
  if (remember) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
};

// Get the appropriate storage based on Remember Me preference
const getAuthStorage = (): Storage => {
  return getRememberMe() ? window.localStorage : window.sessionStorage;
};

// Create Supabase client
// Storage is determined by Remember Me preference:
// - If Remember Me: localStorage (persists after browser close)
// - If not: sessionStorage (session ends when browser closes)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: getAuthStorage(),
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export commonly used client interfaces
export const auth = supabase.auth;
export const db = supabase; // For database operations
export const storage = supabase.storage;

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Helper to handle auth state changes
export const onAuthStateChanged = (callback: (user: any) => void) => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(session?.user ?? null);
  });

  // Listen for changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
};
