import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PollPrivacyService } from '@/lib/services/poll-privacy';

export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pollId } = params;
    const body = await request.json();
    const { email, message, access_level, expires_at } = body;

    // Validate required fields
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user is poll creator
    const { data: poll } = await supabase
      .from('polls')
      .select('creator_id, privacy_level')
      .eq('id', pollId)
      .single();

    if (!poll || poll.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if poll is private
    if (poll.privacy_level !== 'private') {
      return NextResponse.json(
        { error: 'Can only invite users to private polls' },
        { status: 400 }
      );
    }

    const success = await PollPrivacyService.inviteUsersToPoll(
      pollId,
      [email.trim()],
      message?.trim()
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send poll invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in poll invite API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}