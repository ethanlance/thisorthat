import { createClient } from '@/lib/supabase/client';
import { PollWithResults } from '@/lib/services/polls';

const supabase = createClient();

export interface DashboardStats {
  totalPolls: number;
  activePolls: number;
  closedPolls: number;
  totalVotes: number;
  averageVotesPerPoll: number;
}

export interface UserPollSummary extends PollWithResults {
  share_count?: number;
  last_activity?: string;
}

export class DashboardService {
  // Get user's polls with vote counts and results
  static async getUserPolls(userId: string): Promise<UserPollSummary[]> {
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (pollsError) throw pollsError;

    // Get vote counts for each poll
    const pollsWithResults = await Promise.all(
      polls.map(async poll => {
        const { data: votes } = await supabase
          .from('votes')
          .select('choice')
          .eq('poll_id', poll.id);

        const vote_counts = {
          option_a: votes?.filter(v => v.choice === 'option_a').length || 0,
          option_b: votes?.filter(v => v.choice === 'option_b').length || 0,
        };

        // Get share count
        const { data: shares } = await supabase
          .from('poll_shares')
          .select('id')
          .eq('poll_id', poll.id);

        // Get last activity (most recent vote or share)
        const { data: lastVote } = await supabase
          .from('votes')
          .select('created_at')
          .eq('poll_id', poll.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const { data: lastShare } = await supabase
          .from('poll_shares')
          .select('created_at')
          .eq('poll_id', poll.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const lastActivity = [
          lastVote?.created_at,
          lastShare?.created_at,
          poll.created_at,
        ]
          .filter(Boolean)
          .sort()
          .pop();

        return {
          ...poll,
          vote_counts,
          share_count: shares?.length || 0,
          last_activity: lastActivity,
        };
      })
    );

    return pollsWithResults;
  }

  // Get dashboard statistics for a user
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('id, status')
      .eq('creator_id', userId);

    if (pollsError) throw pollsError;

    const totalPolls = polls.length;
    const activePolls = polls.filter(p => p.status === 'active').length;
    const closedPolls = polls.filter(p => p.status === 'closed').length;

    // Get total votes across all user's polls
    const pollIds = polls.map(p => p.id);
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('id')
      .in('poll_id', pollIds);

    if (votesError) throw votesError;

    const totalVotes = votes?.length || 0;
    const averageVotesPerPoll =
      totalPolls > 0 ? Math.round(totalVotes / totalPolls) : 0;

    return {
      totalPolls,
      activePolls,
      closedPolls,
      totalVotes,
      averageVotesPerPoll,
    };
  }

  // Get polls by status for a user
  static async getUserPollsByStatus(
    userId: string,
    status: 'active' | 'closed' | 'deleted'
  ): Promise<UserPollSummary[]> {
    const polls = await this.getUserPolls(userId);
    return polls.filter(poll => poll.status === status);
  }

  // Get recently active polls (polls with recent votes or shares)
  static async getRecentlyActivePolls(
    userId: string,
    limit: number = 5
  ): Promise<UserPollSummary[]> {
    const polls = await this.getUserPolls(userId);

    return polls
      .filter(poll => poll.last_activity)
      .sort(
        (a, b) =>
          new Date(b.last_activity!).getTime() -
          new Date(a.last_activity!).getTime()
      )
      .slice(0, limit);
  }

  // Get polls expiring soon for a user
  static async getUserPollsExpiringSoon(
    userId: string
  ): Promise<UserPollSummary[]> {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const polls = await this.getUserPolls(userId);

    return polls.filter(poll => {
      if (poll.status !== 'active') return false;

      const expiresAt = new Date(poll.expires_at);
      return expiresAt >= now && expiresAt <= oneHourFromNow;
    });
  }

  // Delete a poll and all related data
  static async deletePoll(pollId: string): Promise<void> {
    // Delete votes first (foreign key constraint)
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId);

    if (votesError) throw votesError;

    // Delete shares
    const { error: sharesError } = await supabase
      .from('poll_shares')
      .delete()
      .eq('poll_id', pollId);

    if (sharesError) throw sharesError;

    // Delete comments
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('poll_id', pollId);

    if (commentsError) throw commentsError;

    // Finally delete the poll
    const { error: pollError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (pollError) throw pollError;
  }

  // Share a poll (create a share record)
  static async sharePoll(
    pollId: string,
    sharedBy: string,
    sharedWith?: string
  ): Promise<void> {
    const { error } = await supabase.from('poll_shares').insert({
      poll_id: pollId,
      user_id: sharedWith || sharedBy, // If no specific user, share with self (for tracking)
      shared_by: sharedBy,
    });

    if (error) throw error;
  }

  // Get poll share URL
  static getPollShareUrl(pollId: string): string {
    if (typeof window === 'undefined') {
      return `https://thisorthat.app/poll/${pollId}`;
    }
    return `${window.location.origin}/poll/${pollId}`;
  }
}
