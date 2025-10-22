'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardService, UserPollSummary } from '@/lib/services/dashboard';
import { Poll } from '@/lib/supabase/types';

export interface UseUserPollsReturn {
  polls: UserPollSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deletePoll: (pollId: string) => Promise<void>;
  sharePoll: (pollId: string) => Promise<void>;
}

export const useUserPolls = (userId: string | undefined): UseUserPollsReturn => {
  const [polls, setPolls] = useState<UserPollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPolls = useCallback(async () => {
    if (!userId) {
      setPolls([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userPolls = await DashboardService.getUserPolls(userId);
      setPolls(userPolls);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch polls';
      setError(errorMessage);
      console.error('Error fetching user polls:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deletePoll = useCallback(async (pollId: string) => {
    try {
      await DashboardService.deletePoll(pollId);
      setPolls(prevPolls => prevPolls.filter(poll => poll.id !== pollId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete poll';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const sharePoll = useCallback(async (pollId: string) => {
    if (!userId) return;
    
    try {
      await DashboardService.sharePoll(pollId, userId);
      // Update the share count in the local state
      setPolls(prevPolls => 
        prevPolls.map(poll => 
          poll.id === pollId 
            ? { ...poll, share_count: (poll.share_count || 0) + 1 }
            : poll
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share poll';
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchUserPolls();
  }, [fetchUserPolls]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    
    const subscription = supabase
      .channel('user-polls')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'polls',
        filter: `creator_id=eq.${userId}`
      }, (payload) => {
        console.log('Poll change received:', payload);
        
        if (payload.eventType === 'INSERT') {
          // New poll created - refetch to get full data
          fetchUserPolls();
        } else if (payload.eventType === 'UPDATE') {
          // Poll updated - update local state
          setPolls(prevPolls => 
            prevPolls.map(poll => 
              poll.id === payload.new.id 
                ? { ...poll, ...payload.new }
                : poll
            )
          );
        } else if (payload.eventType === 'DELETE') {
          // Poll deleted - remove from local state
          setPolls(prevPolls => 
            prevPolls.filter(poll => poll.id !== payload.old.id)
          );
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `poll_id=in.(${polls.map(p => p.id).join(',')})`
      }, (payload) => {
        console.log('Vote change received:', payload);
        
        // Update vote counts for the affected poll
        setPolls(prevPolls => 
          prevPolls.map(poll => {
            if (poll.id === payload.new.poll_id || poll.id === payload.old?.poll_id) {
              // Refetch this specific poll's vote data
              fetchUserPolls();
              return poll;
            }
            return poll;
          })
        );
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, polls.map(p => p.id).join(','), fetchUserPolls]);

  return {
    polls,
    loading,
    error,
    refetch: fetchUserPolls,
    deletePoll,
    sharePoll
  };
};
