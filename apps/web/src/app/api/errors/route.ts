import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { type, severity, message, userMessage, context, stack } = body;

    // Validate required fields
    if (!type || !severity || !message || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate severity
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    // Validate type
    if (
      ![
        'network',
        'validation',
        'system',
        'authentication',
        'authorization',
        'unknown',
      ].includes(type)
    ) {
      return NextResponse.json(
        { error: 'Invalid error type' },
        { status: 400 }
      );
    }

    // Log error to database
    const { data, error } = await supabase
      .from('error_reports')
      .insert({
        type,
        severity,
        message,
        user_message: userMessage,
        context: context || {},
        stack: stack || null,
        user_id: user?.id || null,
        resolved: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging to database:', error);
      return NextResponse.json(
        { error: 'Failed to log error' },
        { status: 500 }
      );
    }

    // Send to external monitoring service if critical
    if (severity === 'critical') {
      try {
        // In a real implementation, this would send to Sentry, LogRocket, etc.
        console.log('Critical error detected:', data);
      } catch (monitoringError) {
        console.error('Failed to send to monitoring service:', monitoringError);
      }
    }

    return NextResponse.json({
      success: true,
      errorId: data.id,
    });
  } catch (error) {
    console.error('Error in errors POST API:', error);
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const resolved = searchParams.get('resolved');

    let query = supabase
      .from('error_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching error reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch error reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({ errorReports: data || [] });
  } catch (error) {
    console.error('Error in errors GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
