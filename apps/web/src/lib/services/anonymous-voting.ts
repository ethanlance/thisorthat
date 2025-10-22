import { VotesService, VoteResult } from './votes';
import {
  generateAnonymousId,
  getStoredAnonymousId,
  storeAnonymousId,
  hasVotedAnonymously,
  clearAnonymousId,
  isValidAnonymousId,
  isAnonymousIdExpired,
} from '@/lib/utils/anonymous-id';

export interface AnonymousVoteSubmission {
  pollId: string;
  choice: 'option_a' | 'option_b';
}

export interface AnonymousVoteResult extends VoteResult {
  anonymousId?: string;
}

export class AnonymousVotingService {
  /**
   * Submit an anonymous vote for a poll
   * @param pollId - The poll ID to vote on
   * @param choice - The voting choice (option_a or option_b)
   * @returns Promise with vote result
   */
  static async submitAnonymousVote(
    pollId: string,
    choice: 'option_a' | 'option_b'
  ): Promise<AnonymousVoteResult> {
    try {
      // Get or generate anonymous ID
      let anonymousId = getStoredAnonymousId(pollId);

      // If no stored ID or ID is expired, generate a new one
      if (
        !anonymousId ||
        !isValidAnonymousId(anonymousId) ||
        isAnonymousIdExpired(anonymousId)
      ) {
        anonymousId = generateAnonymousId();
        storeAnonymousId(pollId, anonymousId);
      }

      // Check for existing vote with this anonymous ID
      const existingVote = await VotesService.getAnonymousVote(
        pollId,
        anonymousId
      );
      if (existingVote) {
        return {
          success: false,
          error: 'You have already voted on this poll',
          anonymousId,
        };
      }

      // Submit vote
      const result = await VotesService.submitVote({
        pollId,
        choice,
        anonymousId,
      });

      return {
        ...result,
        anonymousId,
      };
    } catch (error) {
      console.error('Anonymous vote submission error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while submitting your vote',
      };
    }
  }

  /**
   * Check if an anonymous user has voted on a specific poll
   * @param pollId - The poll ID to check
   * @returns True if the user has voted, false otherwise
   */
  static hasVotedAnonymously(pollId: string): boolean {
    return hasVotedAnonymously(pollId);
  }

  /**
   * Get the anonymous ID for a specific poll
   * @param pollId - The poll ID to get the anonymous ID for
   * @returns The anonymous ID or null if not found
   */
  static getAnonymousId(pollId: string): string | null {
    return getStoredAnonymousId(pollId);
  }

  /**
   * Get the user's anonymous vote for a specific poll
   * @param pollId - The poll ID to get the vote for
   * @returns The vote choice or null if not found
   */
  static async getAnonymousVote(
    pollId: string
  ): Promise<'option_a' | 'option_b' | null> {
    const anonymousId = getStoredAnonymousId(pollId);
    if (!anonymousId) return null;

    return await VotesService.getAnonymousVote(pollId, anonymousId);
  }

  /**
   * Clear anonymous voting data for a specific poll
   * @param pollId - The poll ID to clear data for
   */
  static clearAnonymousData(pollId: string): void {
    clearAnonymousId(pollId);
  }

  /**
   * Generate a new anonymous ID for a poll (useful for testing)
   * @param pollId - The poll ID to generate a new ID for
   * @returns The new anonymous ID
   */
  static generateNewAnonymousId(pollId: string): string {
    const newId = generateAnonymousId();
    storeAnonymousId(pollId, newId);
    return newId;
  }

  /**
   * Validate anonymous voting data for a poll
   * @param pollId - The poll ID to validate
   * @returns Object with validation results
   */
  static validateAnonymousData(pollId: string): {
    hasStoredId: boolean;
    isValidId: boolean;
    isExpired: boolean;
    hasVoted: boolean;
  } {
    const storedId = getStoredAnonymousId(pollId);
    const hasStoredId = !!storedId;
    const isValidId = storedId ? isValidAnonymousId(storedId) : false;
    const isExpired = storedId ? isAnonymousIdExpired(storedId) : false;
    const hasVoted = hasVotedAnonymously(pollId);

    return {
      hasStoredId,
      isValidId,
      isExpired,
      hasVoted,
    };
  }

  /**
   * Get anonymous voting statistics for debugging
   * @returns Object with anonymous voting statistics
   */
  static getAnonymousVotingStats(): {
    totalStoredIds: number;
    validIds: number;
    expiredIds: number;
    pollsWithVotes: number;
  } {
    if (typeof window === 'undefined') {
      return {
        totalStoredIds: 0,
        validIds: 0,
        expiredIds: 0,
        pollsWithVotes: 0,
      };
    }

    let totalStoredIds = 0;
    let validIds = 0;
    let expiredIds = 0;
    let pollsWithVotes = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('anonymous_id_')) {
          totalStoredIds++;

          const anonymousId = localStorage.getItem(key);
          if (anonymousId) {
            if (isValidAnonymousId(anonymousId)) {
              validIds++;
              if (isAnonymousIdExpired(anonymousId)) {
                expiredIds++;
              }
            }
          }
        }
      }

      // Count polls with votes (this is a rough estimate)
      pollsWithVotes = totalStoredIds;
    } catch (error) {
      console.warn('Failed to get anonymous voting stats:', error);
    }

    return {
      totalStoredIds,
      validIds,
      expiredIds,
      pollsWithVotes,
    };
  }

  /**
   * Clean up expired anonymous IDs
   * @returns Number of IDs cleaned up
   */
  static cleanupExpiredIds(): number {
    if (typeof window === 'undefined') return 0;

    let cleanedCount = 0;
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('anonymous_id_')) {
          const anonymousId = localStorage.getItem(key);
          if (anonymousId && isAnonymousIdExpired(anonymousId)) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        cleanedCount++;
      });
    } catch (error) {
      console.warn('Failed to cleanup expired IDs:', error);
    }

    return cleanedCount;
  }
}
