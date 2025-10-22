import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { pollId, method, timestamp } = await request.json();

    if (!pollId || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { error } = await supabase.from('poll_shares').insert({
      poll_id: pollId,
      method: method,
      created_at: timestamp || new Date().toISOString(),
      user_agent: request.headers.get('user-agent'),
      referrer: request.headers.get('referer'),
    });

    if (error) {
      console.error('Failed to track share:', error);
      return NextResponse.json(
        { error: 'Failed to track share' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Share tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
