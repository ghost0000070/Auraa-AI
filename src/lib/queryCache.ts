/**
 * Database query caching utility
 * Reduces redundant database reads and improves performance
 */

import { CACHE_CONFIG } from '@/config/constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private enabled: boolean;

  constructor() {
    this.enabled = true;
  }

  /**
   * Generate a cache key from query parameters
   */
  private generateKey(collection: string, queryId?: string): string {
    return queryId ? `${collection}:${queryId}` : collection;
  }

  /**
   * Check if a cache entry is valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }

  /**
   * Get cached data if available and valid
   */
  get<T>(collection: string, queryId?: string): T | null {
    if (!this.enabled) return null;

    const key = this.generateKey(collection, queryId);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  set<T>(
    collection: string,
    data: T,
    queryId?: string,
    ttl: number = CACHE_CONFIG.DATABASE_CACHE_TTL
  ): void {
    if (!this.enabled) return;

    const key = this.generateKey(collection, queryId);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(collection: string, queryId?: string): void {
    const key = this.generateKey(collection, queryId);
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries for a collection
   */
  invalidateCollection(collection: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${collection}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      enabled: this.enabled,
    };
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
}

// Export singleton instance
export const queryCache = new QueryCache();

/**
 * Higher-order function to wrap database queries with caching
 */
export async function withCache<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  options?: {
    ttl?: number;
    bypassCache?: boolean;
  }
): Promise<T> {
  const { ttl = CACHE_CONFIG.DATABASE_CACHE_TTL, bypassCache = false } = options || {};

  // Check cache first
  if (!bypassCache) {
    const cached = queryCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Execute query
  const data = await queryFn();

  // Cache result
  queryCache.set(cacheKey, data, undefined, ttl);

  return data;
}
