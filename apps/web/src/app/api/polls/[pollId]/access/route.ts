import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PollPrivacyService } from '@/lib/services/poll-privacy';

export async function GET(
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

    // Check if user is poll creator
    const { data: poll } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (!poll || poll.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const access = await PollPrivacyService.getPollAccess(pollId);

    return NextResponse.json({ access });
  } catch (error) {
    console.error('Error in poll access API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
