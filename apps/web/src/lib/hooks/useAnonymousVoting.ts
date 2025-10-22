'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AnonymousVotingService,
  AnonymousVoteResult,
} from '@/lib/services/anonymous-voting';

export interface UseAnonymousVotingReturn {
  hasVoted: boolean;
  isVoting: boolean;
  error: string | null;
  anonymousId: string | null;
  userVote: 'option_a' | 'option_b' | null;
  vote: (choice: 'option_a' | 'option_b') => Promise<boolean>;
  clearError: () => void;
  resetVotingState: () => void;
}

export const useAnonymousVoting = (
  pollId: string
): UseAnonymousVotingReturn => {
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'option_a' | 'option_b' | null>(
    null
  );

  // Initialize voting state
  useEffect(() => {
    const initializeVotingState = async () => {
      try {
        // Check if user has voted
        const voted = AnonymousVotingService.hasVotedAnonymously(pollId);
        setHasVoted(voted);

        // Get anonymous ID
        const id = AnonymousVotingService.getAnonymousId(pollId);
        setAnonymousId(id);

        // If user has voted, get their vote
        if (voted && id) {
          const vote = await AnonymousVotingService.getAnonymousVote(pollId);
          setUserVote(vote);
        }
      } catch (err) {
        console.error('Error initializing anonymous voting state:', err);
        setError('Failed to initialize voting state');
      }
    };

    initializeVotingState();
  }, [pollId]);

  const vote = useCallback(
    async (choice: 'option_a' | 'option_b'): Promise<boolean> => {
      if (hasVoted || isVoting) {
        console.warn('Vote already submitted or voting in progress');
        return false;
      }

      setIsVoting(true);
      setError(null);

      try {
        const result: AnonymousVoteResult =
          await AnonymousVotingService.submitAnonymousVote(pollId, choice);

        if (result.success) {
          setHasVoted(true);
          setUserVote(choice);
          setAnonymousId(result.anonymousId || null);
          return true;
        } else {
          setError(result.error || 'Failed to submit vote');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to submit vote';
        setError(errorMessage);
        console.error('Vote submission error:', err);
        return false;
      } finally {
        setIsVoting(false);
      }
    },
    [pollId, hasVoted, isVoting]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetVotingState = useCallback(() => {
    setHasVoted(false);
    setIsVoting(false);
    setError(null);
    setUserVote(null);
    setAnonymousId(null);
    AnonymousVotingService.clearAnonymousData(pollId);
  }, [pollId]);

  return {
    hasVoted,
    isVoting,
    error,
    anonymousId,
    userVote,
    vote,
    clearError,
    resetVotingState,
  };
};
