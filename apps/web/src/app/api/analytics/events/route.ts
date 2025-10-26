import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      );
    }

    // Validate events structure
    for (const event of events) {
      if (!event.id || !event.event || !event.category || !event.action) {
        return NextResponse.json(
          { error: 'Invalid event structure' },
          { status: 400 }
        );
      }
    }

    // Insert events into database
    const { data, error } = await supabase
      .from('analytics_events')
      .insert(
        events.map(event => ({
          id: event.id,
          user_id: user?.id || null,
          session_id: event.sessionId,
          event: event.event,
          category: event.category,
          action: event.action,
          label: event.label || null,
          value: event.value || null,
          properties: event.properties || {},
          timestamp: new Date(event.timestamp),
          url: event.url,
          user_agent: event.userAgent,
          referrer: event.referrer || null,
          device_type: event.deviceType,
          connection_type: event.connectionType || null,
        }))
      )
      .select();

    if (error) {
      console.error('Error inserting analytics events:', error);
      return NextResponse.json(
        { error: 'Failed to store analytics events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eventsStored: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in analytics events POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const event = searchParams.get('event');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (event) {
      query = query.eq('event', event);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (startDate) {
      query = query.gte('timestamp', new Date(startDate));
    }

    if (endDate) {
      query = query.lte('timestamp', new Date(endDate));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching analytics events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: data || [] });
  } catch (error) {
    console.error('Error in analytics events GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
