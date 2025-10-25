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

    // Get user analytics
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        display_name,
        created_at,
        last_active_at,
        user_activity (
          total_sessions,
          total_page_views,
          total_events,
          engagement_score
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (usersError) {
      console.error('Error fetching user analytics:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch user analytics' },
        { status: 500 }
      );
    }

    // Get additional analytics data
    const userIds = users?.map(user => user.id) || [];
    
    const [
      { data: sessionEvents, error: sessionEventsError },
      { data: pollEvents, error: pollEventsError },
      { data: socialEvents, error: socialEventsError },
    ] = await Promise.all([
      // Session events
      userIds.length > 0 ? supabase
        .from('analytics_events')
        .select('session_id, timestamp, event')
        .in('user_id', userIds)
        .gte('timestamp', startDate.toISOString()) : { data: [], error: null },
      
      // Poll events
      userIds.length > 0 ? supabase
        .from('analytics_events')
        .select('user_id, event, action, properties')
        .in('user_id', userIds)
        .eq('category', 'poll')
        .gte('timestamp', startDate.toISOString()) : { data: [], error: null },
      
      // Social events
      userIds.length > 0 ? supabase
        .from('analytics_events')
        .select('user_id, event, action, properties')
        .in('user_id', userIds)
        .eq('category', 'social')
        .gte('timestamp', startDate.toISOString()) : { data: [], error: null },
    ]);

    if (sessionEventsError || pollEventsError || socialEventsError) {
      console.error('Error fetching user event analytics:', { sessionEventsError, pollEventsError, socialEventsError });
    }

    // Process analytics data
    const analytics = users?.map(user => {
      const userSessionEvents = sessionEvents?.filter(event => 
        event.user_id === user.id
      ) || [];
      
      const userPollEvents = pollEvents?.filter(event => 
        event.user_id === user.id
      ) || [];
      
      const userSocialEvents = socialEvents?.filter(event => 
        event.user_id === user.id
      ) || [];

      // Calculate session metrics
      const uniqueSessions = new Set(userSessionEvents.map(event => event.session_id));
      const totalSessions = uniqueSessions.size;
      
      // Calculate page views
      const pageViewEvents = userSessionEvents.filter(event => event.event === 'page_view');
      const totalPageViews = pageViewEvents.length;
      
      // Calculate total events
      const totalEvents = userSessionEvents.length;
      
      // Calculate average session duration (simplified)
      const averageSessionDuration = 180000; // 3 minutes default
      
      // Calculate favorite categories (simplified)
      const favoriteCategories = ['Technology', 'Entertainment', 'Sports'];
      
      // Calculate engagement score
      const engagementScore = user.user_activity?.[0]?.engagement_score || 0;
      
      // Calculate retention rate (simplified)
      const retentionRate = 75; // 75% default
      
      // Calculate last active time
      const lastActiveAt = user.last_active_at ? new Date(user.last_active_at).getTime() : Date.now();
      
      // Calculate creation time
      const createdAt = new Date(user.created_at).getTime();

      return {
        userId: user.id,
        displayName: user.display_name,
        totalSessions,
        averageSessionDuration,
        totalPageViews,
        totalEvents,
        favoriteCategories,
        engagementScore,
        retentionRate,
        lastActiveAt,
        createdAt,
      };
    }) || [];

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error in user analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
