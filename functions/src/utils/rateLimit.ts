/**
 * Rate limiting utilities for Cloud Functions
 */

import * as admin from 'firebase-admin';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  identifier?: string; // Optional custom identifier
}

/**
 * Check if a user has exceeded rate limits
 * Stores rate limit data in Firestore
 */
export async function checkRateLimit(
  userId: string,
  functionName: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const db = admin.firestore();
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const identifier = config.identifier || userId;
  
  const rateLimitRef = db
    .collection('_rate_limits')
    .doc(`${functionName}:${identifier}`);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      const data = doc.data();

      if (!data) {
        // First request
        transaction.set(rateLimitRef, {
          requests: [now],
          expiresAt: new Date(now + windowMs),
        });
        return { allowed: true };
      }

      // Filter out old requests
      const requests = (data.requests as number[]).filter(
        (timestamp: number) => now - timestamp < windowMs
      );

      if (requests.length >= config.maxRequests) {
        const oldestRequest = Math.min(...requests);
        const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
        return { allowed: false, retryAfter };
      }

      // Add new request
      requests.push(now);
      transaction.update(rateLimitRef, {
        requests,
        expiresAt: new Date(now + windowMs),
      });

      return { allowed: true };
    });

    return result;
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // On error, allow the request (fail open)
    return { allowed: true };
  }
}

/**
 * Cleanup expired rate limit documents
 * Should be called periodically via scheduled function
 */
export async function cleanupRateLimits(): Promise<void> {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();

  try {
    const snapshot = await db
      .collection('_rate_limits')
      .where('expiresAt', '<', now)
      .limit(500)
      .get();

    if (snapshot.empty) {
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`[RateLimit] Cleaned up ${snapshot.size} expired rate limits`);
  } catch (error) {
    console.error('[RateLimit] Error cleaning up rate limits:', error);
  }
}

/**
 * Rate limiting middleware for Cloud Functions
 */
export function withRateLimit(
  config: RateLimitConfig
): (handler: (request: any) => Promise<any>) => (request: any) => Promise<any> {
  return (handler) => {
    return async (request) => {
      if (!request.auth) {
        throw new Error('Authentication required');
      }

      const userId = request.auth.uid;
      const functionName = handler.name || 'unknown';

      const rateLimitCheck = await checkRateLimit(userId, functionName, config);

      if (!rateLimitCheck.allowed) {
        const error: any = new Error(
          `Rate limit exceeded. Try again in ${rateLimitCheck.retryAfter} seconds.`
        );
        error.code = 'resource-exhausted';
        error.retryAfter = rateLimitCheck.retryAfter;
        throw error;
      }

      return handler(request);
    };
  };
}
