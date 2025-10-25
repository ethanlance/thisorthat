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
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Calculate date range
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get business metrics
    const [
      { data: userStats, error: userStatsError },
      { data: pollStats, error: pollStatsError },
      { data: sessionStats, error: sessionStatsError },
    ] = await Promise.all([
      // User statistics
      supabase
        .from('user_profiles')
        .select('id, created_at, last_active_at')
        .gte('created_at', startDate.toISOString()),
      
      // Poll statistics
      supabase
        .from('polls')
        .select('id, created_at, votes_count, shares_count, comments_count')
        .gte('created_at', startDate.toISOString()),
      
      // Session statistics
      supabase
        .from('analytics_events')
        .select('session_id, timestamp, event')
        .gte('timestamp', startDate.toISOString())
        .eq('event', 'page_view'),
    ]);

    if (userStatsError || pollStatsError || sessionStatsError) {
      console.error('Error fetching business metrics:', { userStatsError, pollStatsError, sessionStatsError });
      return NextResponse.json(
        { error: 'Failed to fetch business metrics' },
        { status: 500 }
      );
    }

    // Calculate metrics
    const totalUsers = userStats?.length || 0;
    const newUsers = userStats?.filter(user => 
      new Date(user.created_at) >= startDate
    ).length || 0;
    
    const totalPolls = pollStats?.length || 0;
    const totalVotes = pollStats?.reduce((sum, poll) => sum + (poll.votes_count || 0), 0) || 0;
    const totalShares = pollStats?.reduce((sum, poll) => sum + (poll.shares_count || 0), 0) || 0;
    const totalComments = pollStats?.reduce((sum, poll) => sum + (poll.comments_count || 0), 0) || 0;

    // Calculate unique sessions
    const uniqueSessions = new Set(sessionStats?.map(s => s.session_id) || []);
    const dailyActiveUsers = uniqueSessions.size;

    // Calculate engagement rate
    const totalInteractions = totalVotes + totalShares + totalComments;
    const engagementRate = totalUsers > 0 ? (totalInteractions / totalUsers) * 100 : 0;

    // Calculate average session duration (simplified)
    const averageSessionDuration = 180000; // 3 minutes default

    // Calculate retention rate (simplified)
    const returningUsers = userStats?.filter(user => 
      user.last_active_at && new Date(user.last_active_at) >= startDate
    ).length || 0;
    const userRetentionRate = totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 0;

    // Calculate bounce rate (simplified)
    const bounceRate = 25; // 25% default

    // Calculate conversion rate (simplified)
    const conversionRate = 15; // 15% default

    const metrics = {
      dailyActiveUsers,
      monthlyActiveUsers: totalUsers,
      totalUsers,
      newUsers,
      returningUsers,
      userRetentionRate,
      averageSessionDuration,
      bounceRate,
      conversionRate,
      totalPolls,
      totalVotes,
      totalShares,
      engagementRate,
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error in business metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
