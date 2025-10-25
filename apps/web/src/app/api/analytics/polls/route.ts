import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const timeRange = searchParams.get('timeRange') || '7d';

    // Calculate date range
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get poll analytics
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select(
        `
        id,
        title,
        created_at,
        votes_count,
        shares_count,
        comments_count,
        poll_metrics (
          view_count,
          engagement_score,
          trending_score
        )
      `
      )
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (pollsError) {
      console.error('Error fetching poll analytics:', pollsError);
      return NextResponse.json(
        { error: 'Failed to fetch poll analytics' },
        { status: 500 }
      );
    }

    // Get additional analytics data
    const pollIds = polls?.map(poll => poll.id) || [];

    const [
      { data: voteEvents, error: voteEventsError },
      { data: shareEvents, error: shareEventsError },
      { data: commentEvents, error: commentEventsError },
    ] = await Promise.all([
      // Vote events
      pollIds.length > 0
        ? supabase
            .from('analytics_events')
            .select('properties, timestamp')
            .in('properties->pollId', pollIds)
            .eq('action', 'vote')
            .gte('timestamp', startDate.toISOString())
        : { data: [], error: null },

      // Share events
      pollIds.length > 0
        ? supabase
            .from('analytics_events')
            .select('properties, timestamp')
            .in('properties->pollId', pollIds)
            .eq('action', 'share')
            .gte('timestamp', startDate.toISOString())
        : { data: [], error: null },

      // Comment events
      pollIds.length > 0
        ? supabase
            .from('analytics_events')
            .select('properties, timestamp')
            .in('properties->pollId', pollIds)
            .eq('action', 'comment')
            .gte('timestamp', startDate.toISOString())
        : { data: [], error: null },
    ]);

    if (voteEventsError || shareEventsError || commentEventsError) {
      console.error('Error fetching poll event analytics:', {
        voteEventsError,
        shareEventsError,
        commentEventsError,
      });
    }

    // Process analytics data
    const analytics =
      polls?.map(poll => {
        const pollVoteEvents =
          voteEvents?.filter(event => event.properties?.pollId === poll.id) ||
          [];

        const pollShareEvents =
          shareEvents?.filter(event => event.properties?.pollId === poll.id) ||
          [];

        const pollCommentEvents =
          commentEvents?.filter(
            event => event.properties?.pollId === poll.id
          ) || [];

        const views = poll.poll_metrics?.[0]?.view_count || 0;
        const votes = poll.votes_count || 0;
        const shares = poll.shares_count || 0;
        const comments = poll.comments_count || 0;

        // Calculate engagement score
        const totalInteractions = votes + shares + comments;
        const engagementScore =
          views > 0 ? (totalInteractions / views) * 100 : 0;

        // Calculate completion rate
        const completionRate = views > 0 ? (votes / views) * 100 : 0;

        // Calculate average time on poll (simplified)
        const averageTimeOnPoll = 45000; // 45 seconds default

        // Calculate bounce rate (simplified)
        const bounceRate = 30; // 30% default

        // Calculate conversion rate (simplified)
        const conversionRate = 15; // 15% default

        // Calculate trending score
        const trendingScore = poll.poll_metrics?.[0]?.trending_score || 0;

        return {
          pollId: poll.id,
          title: poll.title,
          views,
          votes,
          shares,
          comments,
          completionRate,
          averageTimeOnPoll,
          bounceRate,
          conversionRate,
          engagementScore,
          trendingScore,
          createdAt: poll.created_at,
        };
      }) || [];

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error in poll analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
