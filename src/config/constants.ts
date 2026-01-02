/**
 * Application-wide constants and configuration
 */

// Owner account configuration - used for unrestricted access
// Loaded from environment variables for security
export const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL || 'ghostspooks@icloud.com';
export const OWNER_UID = import.meta.env.VITE_OWNER_UID || 'UoP0OzTFp5RnVclt7XSDDkbzc5W2';

// Subscription tier levels
export const TIER_LEVELS: Record<string, number> = {
  free: 0,
  user: 0,
  premium: 1,
  pro: 1,
  enterprise: 2,
  admin: 3,
  owner: 999,
};

// AI Models
export const AI_MODELS = {
  COMPLEX: 'claude-opus-4-1',
  STANDARD: 'claude-sonnet-4-5',
  FAST: 'claude-haiku-4-5',
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: parseInt(import.meta.env.VITE_API_RATE_LIMIT || '100'),
  WINDOW_MS: 60000, // 1 minute
};

// Error Tracking Configuration
export const SENTRY_CONFIG = {
  DSN: import.meta.env.VITE_SENTRY_DSN,
  ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
  ENABLED: !!import.meta.env.VITE_SENTRY_DSN,
};

// Cache Configuration
export const CACHE_CONFIG = {
  DATABASE_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  ENABLE_PERSISTENCE: true,
};

// Environment validation
export function validateEnvironment(): void {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = requiredEnvVars.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
