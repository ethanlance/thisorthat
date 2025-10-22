import { createClient } from '@/lib/supabase/client';

export interface PollResults {
  poll: {
    id: string;
    description: string;
    option_a_label: string;
    option_b_label: string;
    status: 'active' | 'closed';
    created_at: string;
    expires_at?: string;
  };
  voteCounts: { option_a: number; option_b: number };
  totalVotes: number;
  voteHistory: Array<{
    choice: 'option_a' | 'option_b';
    created_at: string;
  }>;
}

export class ResultsService {
  static async getPollResults(pollId: string): Promise<PollResults | null> {
    try {
      const supabase = createClient();
      
      const { data: poll, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (error || !poll) return null;

      const { data: votes } = await supabase
        .from('votes')
        .select('choice, created_at')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: true });

      const voteCounts = {
        option_a: votes?.filter(v => v.choice === 'option_a').length || 0,
        option_b: votes?.filter(v => v.choice === 'option_b').length || 0
      };

      return {
        poll: {
          id: poll.id,
          description: poll.description,
          option_a_label: poll.option_a_label,
          option_b_label: poll.option_b_label,
          status: poll.status,
          created_at: poll.created_at,
          expires_at: poll.expires_at
        },
        voteCounts,
        totalVotes: voteCounts.option_a + voteCounts.option_b,
        voteHistory: votes || []
      };
    } catch (error) {
      console.error('Failed to get poll results:', error);
      return null;
    }
  }

  static async getHistoricalResults(limit: number = 10): Promise<PollResults[]> {
    try {
      const supabase = createClient();
      
      const { data: polls, error } = await supabase
        .from('polls')
        .select('*')
        .eq('status', 'closed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !polls) return [];

      const results = await Promise.all(
        polls.map(async (poll) => {
          const result = await this.getPollResults(poll.id);
          return result;
        })
      );

      return results.filter(Boolean) as PollResults[];
    } catch (error) {
      console.error('Failed to get historical results:', error);
      return [];
    }
  }

  static async getPollAnalytics(pollId: string): Promise<{
    totalVotes: number;
    voteDistribution: { option_a: number; option_b: number };
    voteTimeline: Array<{ date: string; votes: number }>;
    peakVotingHour: number;
  } | null> {
    try {
      const supabase = createClient();
      
      const { data: votes, error } = await supabase
        .from('votes')
        .select('choice, created_at')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: true });

      if (error || !votes) return null;

      const totalVotes = votes.length;
      const voteDistribution = {
        option_a: votes.filter(v => v.choice === 'option_a').length,
        option_b: votes.filter(v => v.choice === 'option_b').length
      };

      // Group votes by date
      const voteTimeline = votes.reduce((acc, vote) => {
        const date = new Date(vote.created_at).toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.votes += 1;
        } else {
          acc.push({ date, votes: 1 });
        }
        return acc;
      }, [] as Array<{ date: string; votes: number }>);

      // Find peak voting hour
      const hourlyVotes = votes.reduce((acc, vote) => {
        const hour = new Date(vote.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const peakVotingHour = Object.entries(hourlyVotes)
        .reduce((max, [hour, count]) => 
          count > hourlyVotes[max] ? parseInt(hour) : max, 0
        );

      return {
        totalVotes,
        voteDistribution,
        voteTimeline,
        peakVotingHour
      };
    } catch (error) {
      console.error('Failed to get poll analytics:', error);
      return null;
    }
  }
}
