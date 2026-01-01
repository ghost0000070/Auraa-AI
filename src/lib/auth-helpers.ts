import { User } from 'firebase/auth';
import { OWNER_EMAIL } from '@/config/constants';

/**
 * Check if the user is the site owner based on email
 */
export function isOwner(user: User | null): boolean {
  if (!user || !user.email) {
    return false;
  }
  return user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

/**
 * Check if the user has owner custom claims
 */
export async function hasOwnerClaim(user: User | null): Promise<boolean> {
  if (!user) {
    return false;
  }
  
  try {
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims.owner === true;
  } catch (error) {
    console.error('Error checking owner claim:', error);
    return false;
  }
}

/**
 * Check if the user has admin custom claims
 */
export async function hasAdminClaim(user: User | null): Promise<boolean> {
  if (!user) {
    return false;
  }
  
  try {
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error checking admin claim:', error);
    return false;
  }
}

/**
 * Get the user's tier from custom claims
 */
export async function getUserTier(user: User | null): Promise<string> {
  if (!user) {
    return 'free';
  }
  
  try {
    const idTokenResult = await user.getIdTokenResult();
    return (idTokenResult.claims.tier as string) || 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
}

/**
 * Force refresh the user's ID token to get the latest custom claims
 */
export async function refreshUserToken(user: User | null): Promise<void> {
  if (!user) {
    return;
  }
  
  try {
    await user.getIdToken(true);
  } catch (error) {
    console.error('Error refreshing user token:', error);
  }
}
