import { User } from 'firebase/auth';
import { OWNER_EMAIL, TIER_LEVELS } from '@/config/constants';

/**
 * Check if the current user is the site owner
 * Owner has unrestricted access regardless of subscription
 */
export function isOwnerAccount(user: User | null): boolean {
  if (!user) return false;
  return user.email === OWNER_EMAIL;
}

/**
 * Check if user has access to a feature based on tier or owner status
 */
export function hasFeatureAccess(user: User | null, requiredTier: number, userTier: number): boolean {
  if (isOwnerAccount(user)) return true; // Owner bypasses all tier checks
  return userTier >= requiredTier;
}

/**
 * Get effective tier for user (owner gets max tier)
 */
export function getEffectiveTier(user: User | null, actualTier: number): number {
  if (isOwnerAccount(user)) return TIER_LEVELS.owner; // Owner tier
  return actualTier;
}
