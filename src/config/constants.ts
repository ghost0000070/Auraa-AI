/**
 * Application-wide constants and configuration
 */

// Owner account email - used for unrestricted access
// This is the site owner account with unrestricted access to all platform features
// regardless of subscription tier
export const OWNER_EMAIL = 'owner@auraa-ai.com';

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

// Environment validation
export function validateEnvironment(): void {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
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
