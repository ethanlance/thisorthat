/**
 * Anonymous ID utilities for tracking anonymous users across sessions
 * without requiring authentication.
 */

/**
 * Generate a unique anonymous ID for tracking anonymous users
 * Format: anon_{timestamp}_{randomString}
 */
export const generateAnonymousId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `anon_${timestamp}_${random}`;
};

/**
 * Get stored anonymous ID for a specific poll
 * @param pollId - The poll ID to get the anonymous ID for
 * @returns The stored anonymous ID or null if not found
 */
export const getStoredAnonymousId = (pollId: string): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const key = `anonymous_id_${pollId}`;
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to get stored anonymous ID:', error);
    return null;
  }
};

/**
 * Store anonymous ID for a specific poll
 * @param pollId - The poll ID to store the anonymous ID for
 * @param anonymousId - The anonymous ID to store
 */
export const storeAnonymousId = (pollId: string, anonymousId: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const key = `anonymous_id_${pollId}`;
    localStorage.setItem(key, anonymousId);
  } catch (error) {
    console.warn('Failed to store anonymous ID:', error);
  }
};

/**
 * Check if an anonymous user has voted on a specific poll
 * @param pollId - The poll ID to check
 * @returns True if the user has voted, false otherwise
 */
export const hasVotedAnonymously = (pollId: string): boolean => {
  const anonymousId = getStoredAnonymousId(pollId);
  return !!anonymousId;
};

/**
 * Clear anonymous ID for a specific poll (for testing or cleanup)
 * @param pollId - The poll ID to clear the anonymous ID for
 */
export const clearAnonymousId = (pollId: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const key = `anonymous_id_${pollId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear anonymous ID:', error);
  }
};

/**
 * Get all stored anonymous IDs (for debugging or cleanup)
 * @returns Object with poll IDs as keys and anonymous IDs as values
 */
export const getAllStoredAnonymousIds = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  const result: Record<string, string> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('anonymous_id_')) {
        const pollId = key.replace('anonymous_id_', '');
        const anonymousId = localStorage.getItem(key);
        if (anonymousId) {
          result[pollId] = anonymousId;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get all stored anonymous IDs:', error);
  }

  return result;
};

/**
 * Clear all stored anonymous IDs (for testing or cleanup)
 */
export const clearAllAnonymousIds = (): void => {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('anonymous_id_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear all anonymous IDs:', error);
  }
};

/**
 * Validate anonymous ID format
 * @param anonymousId - The anonymous ID to validate
 * @returns True if the ID is valid, false otherwise
 */
export const isValidAnonymousId = (anonymousId: string): boolean => {
  const pattern = /^anon_\d+_[a-z0-9]+$/;
  return pattern.test(anonymousId);
};

/**
 * Extract timestamp from anonymous ID
 * @param anonymousId - The anonymous ID to extract timestamp from
 * @returns The timestamp or null if invalid
 */
export const getAnonymousIdTimestamp = (anonymousId: string): number | null => {
  if (!isValidAnonymousId(anonymousId)) return null;

  const parts = anonymousId.split('_');
  if (parts.length !== 3) return null;

  const timestamp = parseInt(parts[1], 10);
  return isNaN(timestamp) ? null : timestamp;
};

/**
 * Check if anonymous ID is expired (older than 30 days)
 * @param anonymousId - The anonymous ID to check
 * @returns True if expired, false otherwise
 */
export const isAnonymousIdExpired = (anonymousId: string): boolean => {
  const timestamp = getAnonymousIdTimestamp(anonymousId);
  if (!timestamp) return true;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return timestamp < thirtyDaysAgo;
};
