/**
 * Application-wide constants and configuration
 */

// Owner account configuration - used for unrestricted access
// Loaded from environment variables for security
export const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL || 'test@example.com';
export const OWNER_UID = import.meta.env.VITE_OWNER_UID || 'test-uid';

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

// AI Models - Claude models via Puter.js (free)
// See https://puter.com/puterai/chat/models for full list
export const AI_MODELS = {
  // For complex reasoning, analysis, and strategic tasks
  COMPLEX: 'claude-opus-4-5-20251101',
  // For standard tasks - balanced speed and quality
  STANDARD: 'claude-sonnet-4-5-20250929',
  // For fast, simple tasks - quick responses
  FAST: 'claude-haiku-4-5-20251001',
  // Specialized models for specific use cases
  CODING: 'claude-sonnet-4-5-20250929',
  CREATIVE: 'claude-opus-4-5-20251101',
  ANALYTICAL: 'claude-opus-4-5-20251101',
} as const;

// Model assigned per subscription tier (included with subscription)
export const TIER_MODELS: Record<string, string> = {
  free: 'claude-3-haiku-20240307',           // Fast, basic tasks
  pro: 'claude-3-5-sonnet-20241022',         // Balanced, most business tasks
  enterprise: 'claude-sonnet-4-5-20250929',  // Latest & most capable
  admin: 'claude-opus-4-5-20251101',         // Full access
  owner: 'claude-opus-4-5-20251101',         // Full access
};

// Subscription pricing (monthly)
export const SUBSCRIPTION_PRICING = {
  pro: 39,
  enterprise: 79,
  competitor_pro_avg: 59,      // Average competitor price
  competitor_enterprise_avg: 199,
};

// AI Employee Polar Product IDs
// Create these products in Polar.sh dashboard, then add the IDs here
// Each product should be a recurring monthly subscription at the listed price
export const EMPLOYEE_POLAR_PRODUCTS: Record<string, string> = {
  'marketing-pro': '',        // $99/mo - Create in Polar, add ID
  'sales-sidekick': '',       // $129/mo - Create in Polar, add ID
  'support-sentinel': '',     // $79/mo - Create in Polar, add ID
  'business-analyst': '',     // $149/mo - Create in Polar, add ID
  'dev-companion': '',        // $119/mo - Create in Polar, add ID
  'operations-orchestrator': '', // $99/mo - Create in Polar, add ID
  'security-analyst': '',     // $159/mo - Create in Polar, add ID
  'ai-team-orchestrator': '', // $179/mo - Create in Polar, add ID
};

// AI Employee Prices (in dollars) - for reference
export const EMPLOYEE_PRICES: Record<string, number> = {
  'marketing-pro': 99,
  'sales-sidekick': 129,
  'support-sentinel': 79,
  'business-analyst': 149,
  'dev-companion': 119,
  'operations-orchestrator': 99,
  'security-analyst': 159,
  'ai-team-orchestrator': 179,
};

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

// Environment validation with helpful error messages
export function validateEnvironment(): void {
  // Skip validation in CI if placeholder values are provided
  const isCI = import.meta.env.MODE === 'test' || (typeof process !== 'undefined' && process.env.CI === 'true');
  
  const requiredEnvVars: Record<string, string> = {
    'VITE_SUPABASE_URL': 'Supabase project URL (e.g., https://xxxxx.supabase.co)',
    'VITE_SUPABASE_ANON_KEY': 'Supabase anonymous/public API key',
    'VITE_OWNER_EMAIL': 'Owner email address for admin access',
    'VITE_OWNER_UID': 'Owner user ID for admin access',
  };

  const missing: string[] = [];
  const invalid: string[] = [];

  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = import.meta.env[key];
    
    if (!value) {
      missing.push(`${key}: ${description}`);
    } else if (typeof value === 'string' && !isCI) {
      // Only validate format in non-CI environments
      if (key === 'VITE_SUPABASE_URL' && !value.startsWith('http')) {
        invalid.push(`${key}: Must be a valid URL starting with http:// or https://`);
      } else if (key === 'VITE_OWNER_EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        invalid.push(`${key}: Must be a valid email address`);
      }
    }
  }

  // Only throw errors in non-CI environments
  if (!isCI && (missing.length > 0 || invalid.length > 0)) {
    let errorMessage = '❌ Environment Configuration Error\n\n';
    
    if (missing.length > 0) {
      errorMessage += '📋 Missing required environment variables:\n';
      missing.forEach(item => {
        errorMessage += `  • ${item}\n`;
      });
      errorMessage += '\n';
    }
    
    if (invalid.length > 0) {
      errorMessage += '⚠️  Invalid environment variables:\n';
      invalid.forEach(item => {
        errorMessage += `  • ${item}\n`;
      });
      errorMessage += '\n';
    }
    
    errorMessage += '💡 Setup Instructions:\n';
    errorMessage += '  1. Copy .env.example to .env\n';
    errorMessage += '  2. Fill in your actual values\n';
    errorMessage += '  3. Restart the development server\n';
    errorMessage += '\n';
    errorMessage += '📚 See README.md for detailed setup instructions';
    
    throw new Error(errorMessage);
  }
}
