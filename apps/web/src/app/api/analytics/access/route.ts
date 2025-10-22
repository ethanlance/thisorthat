import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { pollId, referrer } = await request.json();

    if (!pollId) {
      return NextResponse.json({ error: 'Missing pollId' }, { status: 400 });
    }

    const supabase = createClient();

    const { error } = await supabase.from('poll_access').insert({
      poll_id: pollId,
      referrer: referrer || request.headers.get('referer'),
      user_agent: request.headers.get('user-agent'),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to track access:', error);
      return NextResponse.json(
        { error: 'Failed to track access' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Access tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
