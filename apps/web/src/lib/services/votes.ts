import { createClient } from '@/lib/supabase/client';
import { Vote, VoteInsert } from '@/lib/supabase/types';

const supabase = createClient();

export class VotesService {
  // Get votes for a poll
  static async getVotesByPollId(pollId: string) {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('poll_id', pollId);

    if (error) throw error;
    return data;
  }

  // Get vote counts for a poll
  static async getVoteCounts(pollId: string) {
    const { data, error } = await supabase
      .from('votes')
      .select('choice')
      .eq('poll_id', pollId);

    if (error) throw error;

    const counts = data.reduce(
      (acc, vote) => {
        acc[vote.choice] = (acc[vote.choice] || 0) + 1;
        return acc;
      },
      { option_a: 0, option_b: 0 } as Record<string, number>
    );

    return counts;
  }

  // Submit a vote
  static async submitVote(vote: VoteInsert) {
    const { data, error } = await supabase
      .from('votes')
      .insert(vote)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update a vote
  static async updateVote(id: string, choice: 'option_a' | 'option_b') {
    const { data, error } = await supabase
      .from('votes')
      .update({ choice })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Check if user has voted on a poll
  static async hasUserVoted(pollId: string, userId?: string, anonymousId?: string) {
    if (!userId && !anonymousId) return false;

    const query = supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId);

    if (userId) {
      query.eq('user_id', userId);
    } else if (anonymousId) {
      query.eq('anonymous_id', anonymousId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data && data.length > 0;
  }
}
