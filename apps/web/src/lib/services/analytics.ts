import { createClient } from '@/lib/supabase/client';

export interface PollAnalytics {
  totalShares: number;
  totalAccess: number;
  shareMethods: Record<string, number>;
  referrers: Record<string, number>;
  voteDistribution: { option_a: number; option_b: number };
  voteTimeline: Array<{ date: string; votes: number }>;
  peakVotingHour: number;
  averageVotesPerDay: number;
  engagementRate: number;
}

export class AnalyticsService {
  static async trackShare(pollId: string, method: string): Promise<void> {
    try {
      const supabase = createClient();

      await supabase.from('poll_shares').insert({
        poll_id: pollId,
        method: method,
        created_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  }

  static async trackPollAccess(
    pollId: string,
    referrer?: string
  ): Promise<void> {
    try {
      const supabase = createClient();

      await supabase.from('poll_access').insert({
        poll_id: pollId,
        referrer: referrer || document.referrer,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track poll access:', error);
    }
  }

  static async getPollAnalytics(pollId: string): Promise<PollAnalytics | null> {
    try {
      const supabase = createClient();

      // Get shares data
      const { data: shares } = await supabase
        .from('poll_shares')
        .select('method, created_at')
        .eq('poll_id', pollId);

      // Get access data
      const { data: access } = await supabase
        .from('poll_access')
        .select('referrer, created_at')
        .eq('poll_id', pollId);

      // Get votes data
      const { data: votes } = await supabase
        .from('votes')
        .select('choice, created_at')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: true });

      if (!votes) return null;

      const totalVotes = votes.length;
      const voteDistribution = {
        option_a: votes.filter(v => v.choice === 'option_a').length,
        option_b: votes.filter(v => v.choice === 'option_b').length,
      };

      // Group votes by date
      const voteTimeline = votes.reduce(
        (acc, vote) => {
          const date = new Date(vote.created_at).toISOString().split('T')[0];
          const existing = acc.find(item => item.date === date);
          if (existing) {
            existing.votes += 1;
          } else {
            acc.push({ date, votes: 1 });
          }
          return acc;
        },
        [] as Array<{ date: string; votes: number }>
      );

      // Find peak voting hour
      const hourlyVotes = votes.reduce(
        (acc, vote) => {
          const hour = new Date(vote.created_at).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      );

      const peakVotingHour = Object.entries(hourlyVotes).reduce(
        (max, [hour, count]) =>
          count > hourlyVotes[max] ? parseInt(hour) : max,
        0
      );

      // Calculate average votes per day
      const pollStartDate = new Date(votes[0]?.created_at || new Date());
      const pollEndDate = new Date(
        votes[votes.length - 1]?.created_at || new Date()
      );
      const daysDiff = Math.max(
        1,
        Math.ceil(
          (pollEndDate.getTime() - pollStartDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const averageVotesPerDay = totalVotes / daysDiff;

      // Calculate engagement rate (votes per access)
      const totalAccess = access?.length || 1;
      const engagementRate = (totalVotes / totalAccess) * 100;

      // Process share methods
      const shareMethods =
        shares?.reduce(
          (acc, share) => {
            acc[share.method] = (acc[share.method] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      // Process referrers
      const referrers =
        access?.reduce(
          (acc, access) => {
            acc[access.referrer] = (acc[access.referrer] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      return {
        totalShares: shares?.length || 0,
        totalAccess: access?.length || 0,
        shareMethods,
        referrers,
        voteDistribution,
        voteTimeline,
        peakVotingHour,
        averageVotesPerDay,
        engagementRate,
      };
    } catch (error) {
      console.error('Failed to get poll analytics:', error);
      return null;
    }
  }

  static async getTopSharedPolls(limit: number = 10): Promise<
    Array<{
      pollId: string;
      pollTitle: string;
      shareCount: number;
      accessCount: number;
    }>
  > {
    try {
      const supabase = createClient();

      const { data: shares } = await supabase
        .from('poll_shares')
        .select('poll_id')
        .order('created_at', { ascending: false });

      if (!shares) return [];

      // Count shares per poll
      const shareCounts = shares.reduce(
        (acc, share) => {
          acc[share.poll_id] = (acc[share.poll_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get poll details for top shared polls
      const topPollIds = Object.entries(shareCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([pollId]) => pollId);

      const { data: polls } = await supabase
        .from('polls')
        .select('id, description')
        .in('id', topPollIds);

      // Get access counts
      const { data: access } = await supabase
        .from('poll_access')
        .select('poll_id')
        .in('poll_id', topPollIds);

      const accessCounts =
        access?.reduce(
          (acc, access) => {
            acc[access.poll_id] = (acc[access.poll_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      return topPollIds.map(pollId => {
        const poll = polls?.find(p => p.id === pollId);
        return {
          pollId,
          pollTitle: poll?.description || 'Unknown Poll',
          shareCount: shareCounts[pollId] || 0,
          accessCount: accessCounts[pollId] || 0,
        };
      });
    } catch (error) {
      console.error('Failed to get top shared polls:', error);
      return [];
    }
  }
}
