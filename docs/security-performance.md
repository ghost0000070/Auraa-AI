# Security & Performance Improvements

## Overview

This document describes the security, performance, and monitoring improvements implemented in the Auraa AI platform.

## 🔒 Security Features

### Input Sanitization (`src/lib/sanitize.ts`)

Prevents XSS and injection attacks by sanitizing all user inputs:

```typescript
import { sanitizeHtml, sanitizeInput, isValidEmail } from '@/lib/sanitize';

// Sanitize HTML
const safe = sanitizeHtml('<script>alert("xss")</script>');

// Sanitize general input
const clean = sanitizeInput(userInput, 1000); // max 1000 chars

// Validate email
if (isValidEmail(email)) {
  // proceed
}
```

### Rate Limiting

**Client-side** (`src/lib/sanitize.ts`):
```typescript
import { RateLimiter } from '@/lib/sanitize';

const limiter = new RateLimiter(100, 60000); // 100 requests per minute

if (limiter.canMakeRequest()) {
  await makeApiCall();
}
```

**Server-side** (`functions/src/utils/rateLimit.ts`):
```typescript
import { checkRateLimit } from './utils/rateLimit';

const check = await checkRateLimit(userId, 'functionName', {
  maxRequests: 50,
  windowSeconds: 60,
});

if (!check.allowed) {
  throw new Error(`Try again in ${check.retryAfter} seconds`);
}
```

### Environment-based Configuration

Owner account credentials moved to environment variables for security:

```bash
VITE_OWNER_EMAIL=your-email@example.com
VITE_OWNER_UID=your-owner-uid
```

## 🚀 Performance Features

### Query Caching (`src/lib/queryCache.ts`)

Reduces redundant database reads:

```typescript
import { withCache, queryCache } from '@/lib/queryCache';

// Automatic caching
const data = await withCache('users:123', async () => {
  return await getDoc(doc(db, 'users', '123'));
});

// Manual cache management
queryCache.invalidate('users', '123');
queryCache.invalidateCollection('users');
queryCache.clear();
```

### Retry Logic (`src/lib/retry.ts`)

Automatic retry with exponential backoff for transient failures:

```typescript
import { retryWithBackoff, retryDatabaseOperation } from '@/lib/retry';

// Generic retry
const result = await retryWithBackoff(
  () => fetchData(),
  { maxAttempts: 3 }
);

// Database-specific retry
const data = await retryDatabaseOperation(
  () => supabase.from('users').select('*')
);
```

### Service Worker / PWA (`public/sw.js`)

Offline support and faster load times:

- Static asset caching
- Network-first with cache fallback
- Automatic updates
- Background sync (future feature)

## 📊 Monitoring & Error Tracking

### Sentry Integration (`src/lib/errorTracking.ts`)

Production error tracking and monitoring:

```typescript
import { errorTracker } from '@/lib/errorTracking';

// Initialize (done automatically in main.tsx)
await errorTracker.init();

// Capture errors
errorTracker.captureError(error, {
  user: { id: userId, email: userEmail },
  tags: { component: 'Dashboard' },
  extra: { context: 'additional info' },
});

// Capture messages
errorTracker.captureMessage('Something noteworthy happened', 'warning');

// Set user context
errorTracker.setUser({ id: userId, email: userEmail });
```

**Configuration** (`.env`):
```bash
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production
```

## 🔧 Configuration

### Environment Variables

Complete list in `.env.example`:

```bash
# Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Owner Account
VITE_OWNER_EMAIL=...
VITE_OWNER_UID=...

# Monitoring
VITE_SENTRY_DSN=...
VITE_SENTRY_ENVIRONMENT=production

# Performance
VITE_ENABLE_ANALYTICS=true
VITE_API_RATE_LIMIT=100

# Polar.sh
VITE_POLAR_ACCESS_TOKEN=...
```

### Constants (`src/config/constants.ts`)

Application-wide configuration:

```typescript
import { 
  OWNER_EMAIL, 
  OWNER_UID, 
  RATE_LIMIT, 
  SENTRY_CONFIG,
  CACHE_CONFIG 
} from '@/config/constants';
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Test files in `src/lib/*.test.ts` cover:
- Input sanitization
- Retry logic
- Rate limiting
- Query caching

## 📱 PWA Support

### Manifest (`public/manifest.json`)

Defines app metadata for installation:
- App name and description
- Icons and splash screens
- Display mode (standalone)
- Theme colors

### Service Worker Registration

Automatically registered in production (`src/main.tsx`).

To manually control:
```typescript
import { registerServiceWorker, unregisterServiceWorker } from '@/lib/serviceWorker';

await registerServiceWorker();
await unregisterServiceWorker();
```

## 🔐 Database Security Policies

Updated to include:
- Rate limit tracking (server-only)
- Proper owner account checks
- Enhanced security for sensitive tables via RLS

## 📦 Dependencies

New packages added:
- `@sentry/react` - Error tracking
- All utilities are TypeScript-native with full type support

## 🚨 Important Notes

1. **Sentry is optional** - The app works without it, but production error tracking is recommended
2. **Service Worker** - Only active in production builds
3. **Rate Limits** - Cleanup runs daily via Cloud Function
4. **Cache TTL** - Default 5 minutes, configurable in `CACHE_CONFIG`
5. **Owner Account** - Update `.env` with your actual credentials

## 🎯 Best Practices

1. Always use `sanitizeInput()` for user-generated content
2. Use `retryDatabaseOperation()` for database calls
3. Wrap expensive queries with `withCache()`
4. Monitor Sentry dashboard for production issues
5. Test rate limits in development before deploying

## 🔄 Updates

To update service worker after deployment:
1. Increment `CACHE_NAME` in `public/sw.js`
2. Deploy new version
3. Users will be prompted to reload

## 📝 License

Same as main project.
