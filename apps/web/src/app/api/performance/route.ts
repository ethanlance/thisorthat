import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      type,
      metric,
      value,
      budget,
      timestamp,
      userAgent,
      connectionType,
      deviceType,
      url,
      lcp,
      fid,
      cls,
      fcp,
      ttfb,
      pageLoadTime,
      apiResponseTime,
      imageLoadTime,
      bundleSize,
    } = body;

    // Validate required fields
    if (!type || !metric || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log performance data to database
    const { data, error } = await supabase
      .from('performance_metrics')
      .insert({
        user_id: user?.id || null,
        type,
        metric,
        value,
        budget: budget || null,
        timestamp: timestamp || Date.now(),
        user_agent: userAgent || null,
        connection_type: connectionType || null,
        device_type: deviceType || null,
        url: url || null,
        lcp: lcp || null,
        fid: fid || null,
        cls: cls || null,
        fcp: fcp || null,
        ttfb: ttfb || null,
        page_load_time: pageLoadTime || null,
        api_response_time: apiResponseTime || null,
        image_load_time: imageLoadTime || null,
        bundle_size: bundleSize || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging performance data:', error);
      return NextResponse.json(
        { error: 'Failed to log performance data' },
        { status: 500 }
      );
    }

    // Check if performance budget is exceeded
    if (budget && value > budget) {
      // Send alert for budget exceeded
      console.warn(
        `Performance budget exceeded for ${metric}: ${value} (budget: ${budget})`
      );

      // In a real implementation, this would send to monitoring service
      // like Sentry, DataDog, or New Relic
    }

    return NextResponse.json({
      success: true,
      metricId: data.id,
    });
  } catch (error) {
    console.error('Error in performance POST API:', error);
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
    const metric = searchParams.get('metric');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('performance_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (metric) {
      query = query.eq('metric', metric);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (startDate) {
      query = query.gte('timestamp', new Date(startDate).getTime());
    }

    if (endDate) {
      query = query.lte('timestamp', new Date(endDate).getTime());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching performance metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch performance metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ metrics: data || [] });
  } catch (error) {
    console.error('Error in performance GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
