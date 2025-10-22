'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PollsService, PollWithResults } from '@/lib/services/polls';
import { VotesService, VoteSubmission } from '@/lib/services/votes';
import { AnonymousVotingService } from '@/lib/services/anonymous-voting';
import { useAuth } from '@/contexts/AuthContext';

export interface UsePollReturn {
  poll: PollWithResults | null;
  loading: boolean;
  error: string | null;
  hasVoted: boolean;
  userVote: 'option_a' | 'option_b' | null;
  isVoting: boolean;
  vote: (choice: 'option_a' | 'option_b') => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const usePoll = (pollId: string): UsePollReturn => {
  const { user } = useAuth();
  const [poll, setPoll] = useState<PollWithResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<'option_a' | 'option_b' | null>(
    null
  );
  const [isVoting, setIsVoting] = useState(false);

  const fetchPoll = useCallback(async () => {
    if (!pollId) return;

    try {
      setLoading(true);
      setError(null);
      const pollData = await PollsService.getPollById(pollId, user?.id);

      if (!pollData) {
        setError('Poll not found');
        return;
      }

      setPoll(pollData);
      setHasVoted(!!pollData.user_vote);
      setUserVote(pollData.user_vote || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch poll';
      setError(errorMessage);
      console.error('Error fetching poll:', err);
    } finally {
      setLoading(false);
    }
  }, [pollId, user?.id]);

  const vote = useCallback(
    async (choice: 'option_a' | 'option_b'): Promise<boolean> => {
      if (!poll || hasVoted || isVoting) return false;

      setIsVoting(true);
      try {
        let result;

        if (user) {
          // Authenticated user voting
          const voteData: VoteSubmission = {
            pollId: poll.id,
            choice,
            userId: user.id,
          };

          result = await VotesService.submitVote(voteData);
        } else {
          // Anonymous user voting
          result = await AnonymousVotingService.submitAnonymousVote(
            poll.id,
            choice
          );
        }

        if (result.success) {
          setHasVoted(true);
          setUserVote(choice);

          // Update local poll data with new vote
          setPoll(prevPoll => {
            if (!prevPoll) return null;

            const newVoteCounts = {
              option_a:
                choice === 'option_a'
                  ? prevPoll.vote_counts.option_a + 1
                  : prevPoll.vote_counts.option_a,
              option_b:
                choice === 'option_b'
                  ? prevPoll.vote_counts.option_b + 1
                  : prevPoll.vote_counts.option_b,
            };

            return {
              ...prevPoll,
              vote_counts: newVoteCounts,
              user_vote: choice,
            };
          });

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
    [poll, hasVoted, isVoting, user?.id]
  );

  // Initial fetch
  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!pollId) return;

    const supabase = createClient();

    const subscription = supabase
      .channel('poll-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls',
          filter: `id=eq.${pollId}`,
        },
        payload => {
          console.log('Poll change received:', payload);

          if (payload.eventType === 'UPDATE') {
            // Poll updated - refetch to get latest data
            fetchPoll();
          } else if (payload.eventType === 'DELETE') {
            // Poll deleted
            setError('Poll has been deleted');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `poll_id=eq.${pollId}`,
        },
        payload => {
          console.log('New vote received:', payload);

          // Update vote counts in real-time
          setPoll(prevPoll => {
            if (!prevPoll) return null;

            const newVote = payload.new;
            const newVoteCounts = {
              option_a:
                newVote.choice === 'option_a'
                  ? prevPoll.vote_counts.option_a + 1
                  : prevPoll.vote_counts.option_a,
              option_b:
                newVote.choice === 'option_b'
                  ? prevPoll.vote_counts.option_b + 1
                  : prevPoll.vote_counts.option_b,
            };

            return {
              ...prevPoll,
              vote_counts: newVoteCounts,
            };
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [pollId, fetchPoll]);

  return {
    poll,
    loading,
    error,
    hasVoted,
    userVote,
    isVoting,
    vote,
    refetch: fetchPoll,
  };
};
