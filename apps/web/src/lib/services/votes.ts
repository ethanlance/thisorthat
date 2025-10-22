import { createClient } from '@/lib/supabase/client';
import { Vote, VoteInsert } from '@/lib/supabase/types';

const supabase = createClient();

export interface VoteSubmission {
  pollId: string;
  choice: 'option_a' | 'option_b';
  userId?: string;
  anonymousId?: string;
}

export interface VoteResult {
  success: boolean;
  error?: string;
  voteId?: string;
}

export class VotesService {
  // Submit a vote for a poll
  static async submitVote(voteData: VoteSubmission): Promise<VoteResult> {
    try {
      // Check if poll exists and is active
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('id, status, expires_at')
        .eq('id', voteData.pollId)
        .single();

      if (pollError || !poll) {
        return { success: false, error: 'Poll not found' };
      }

      // Check if poll is still active
      const now = new Date();
      const expiresAt = new Date(poll.expires_at);
      
      if (poll.status !== 'active' || now >= expiresAt) {
        return { success: false, error: 'Poll is no longer active' };
      }

      // Check for existing vote (prevent duplicate voting)
      const existingVoteQuery = supabase
        .from('votes')
        .select('id')
        .eq('poll_id', voteData.pollId);

      if (voteData.userId) {
        existingVoteQuery.eq('user_id', voteData.userId);
      } else if (voteData.anonymousId) {
        existingVoteQuery.eq('anonymous_id', voteData.anonymousId);
      } else {
        return { success: false, error: 'User identification required' };
      }

      const { data: existingVote } = await existingVoteQuery.single();

      if (existingVote) {
        return { success: false, error: 'You have already voted on this poll' };
      }

      // Submit the vote
      const voteInsert: VoteInsert = {
        poll_id: voteData.pollId,
        choice: voteData.choice,
        user_id: voteData.userId || null,
        anonymous_id: voteData.anonymousId || null
      };

      const { data: newVote, error: voteError } = await supabase
        .from('votes')
        .insert(voteInsert)
        .select('id')
        .single();

      if (voteError) {
        return { success: false, error: 'Failed to submit vote' };
      }

      return { success: true, voteId: newVote.id };
    } catch (error) {
      console.error('Vote submission error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get vote counts for a poll
  static async getVoteCounts(pollId: string): Promise<{ option_a: number; option_b: number }> {
    const { data: votes, error } = await supabase
      .from('votes')
      .select('choice')
      .eq('poll_id', pollId);

    if (error) {
      console.error('Error fetching vote counts:', error);
      return { option_a: 0, option_b: 0 };
    }

    const counts = {
      option_a: votes?.filter(v => v.choice === 'option_a').length || 0,
      option_b: votes?.filter(v => v.choice === 'option_b').length || 0
    };

    return counts;
  }

  // Get user's vote for a poll (if authenticated)
  static async getUserVote(pollId: string, userId: string): Promise<'option_a' | 'option_b' | null> {
    const { data: vote, error } = await supabase
      .from('votes')
      .select('choice')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (error || !vote) {
      return null;
    }

    return vote.choice;
  }

  // Get anonymous user's vote for a poll
  static async getAnonymousVote(pollId: string, anonymousId: string): Promise<'option_a' | 'option_b' | null> {
    const { data: vote, error } = await supabase
      .from('votes')
      .select('choice')
      .eq('poll_id', pollId)
      .eq('anonymous_id', anonymousId)
      .single();

    if (error || !vote) {
      return null;
    }

    return vote.choice;
  }

  // Get all votes for a poll (for analytics)
  static async getPollVotes(pollId: string): Promise<Vote[]> {
    const { data: votes, error } = await supabase
      .from('votes')
      .select('*')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching poll votes:', error);
      return [];
    }

    return votes || [];
  }

  // Delete a vote (for testing or admin purposes)
  static async deleteVote(voteId: string): Promise<boolean> {
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('id', voteId);

    if (error) {
      console.error('Error deleting vote:', error);
      return false;
    }

    return true;
  }

  // Get voting statistics for a poll
  static async getVotingStats(pollId: string): Promise<{
    totalVotes: number;
    optionAPercentage: number;
    optionBPercentage: number;
    recentVotes: number; // votes in last hour
  }> {
    const voteCounts = await this.getVoteCounts(pollId);
    const totalVotes = voteCounts.option_a + voteCounts.option_b;
    
    const optionAPercentage = totalVotes > 0 ? Math.round((voteCounts.option_a / totalVotes) * 100) : 0;
    const optionBPercentage = totalVotes > 0 ? Math.round((voteCounts.option_b / totalVotes) * 100) : 0;

    // Get recent votes (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentVotes } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .gte('created_at', oneHourAgo);

    return {
      totalVotes,
      optionAPercentage,
      optionBPercentage,
      recentVotes: recentVotes?.length || 0
    };
  }
}