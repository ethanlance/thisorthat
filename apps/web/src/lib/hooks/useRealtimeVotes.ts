import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface VoteCounts {
  option_a: number;
  option_b: number;
}

interface UseRealtimeVotesReturn {
  voteCounts: VoteCounts;
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

export const useRealtimeVotes = (pollId: string): UseRealtimeVotesReturn => {
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({
    option_a: 0,
    option_b: 0,
  });
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pollId) return;

    const supabase = createClient();

    // Initial vote count fetch
    const fetchInitialVotes = async () => {
      try {
        const { data: votes, error } = await supabase
          .from('votes')
          .select('choice')
          .eq('poll_id', pollId);

        if (error) {
          setError('Failed to fetch initial votes');
          return;
        }

        const counts = {
          option_a: votes?.filter(v => v.choice === 'option_a').length || 0,
          option_b: votes?.filter(v => v.choice === 'option_b').length || 0,
        };

        setVoteCounts(counts);
        setLastUpdate(new Date());
      } catch (err) {
        setError('Failed to fetch initial votes');
      }
    };

    fetchInitialVotes();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`vote-updates-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `poll_id=eq.${pollId}`,
        },
        payload => {
          const newVote = payload.new;
          setVoteCounts(prev => ({
            option_a:
              newVote.choice === 'option_a' ? prev.option_a + 1 : prev.option_a,
            option_b:
              newVote.choice === 'option_b' ? prev.option_b + 1 : prev.option_b,
          }));
          setLastUpdate(new Date());
          setError(null);
        }
      )
      .on('system', {}, status => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setError('Connection error');
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [pollId]);

  return { voteCounts, isConnected, lastUpdate, error };
};
