// Production-ready Supabase client.
// Reads credentials from Vite environment variables and fails fast when missing.
import { createClient, type GoTrueClientOptions } from '@supabase/supabase-js';
import type { DatabaseApi } from './database-api';

// Vite exposes env vars under import.meta.env when prefixed with VITE_
const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '');
const SUPABASE_PUBLISHABLE_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
const SUPABASE_DB_SCHEMA = String(import.meta.env.VITE_SUPABASE_DB_SCHEMA || 'api');

// Fail early in non-configured environments to avoid accidental usage with wrong keys.
if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Set it in your deployment or CI secrets.');
}
if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable. Set it in your deployment or CI secrets.');
}

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const authOptions: GoTrueClientOptions = isBrowser
  ? { storage: localStorage, persistSession: true, autoRefreshToken: true }
  : { persistSession: false, detectSessionInUrl: false };

export const supabase = createClient<DatabaseApi, 'api'>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: authOptions,
  db: {
    // Allow overriding schema via env; default to 'api' for typed DatabaseApi
    schema: SUPABASE_DB_SCHEMA as 'api',
  },
});

// - Do NOT embed a service_role key in frontend code. Use server-side functions or a secure backend for privileged operations.
// - Store VITE_* variables in your hosting provider's secret manager (e.g., Vercel, Netlify, Cloudflare Pages).