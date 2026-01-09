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

// Create Supabase client
// Using localStorage for persistent sessions across browser closes
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
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
