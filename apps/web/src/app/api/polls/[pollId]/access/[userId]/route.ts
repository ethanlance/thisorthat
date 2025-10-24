import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PollPrivacyService } from '@/lib/services/poll-privacy';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string; userId: string }> }
) {
  try {
    const { pollId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access to poll
    const hasAccess = await PollPrivacyService.hasPollAccess(pollId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await PollPrivacyService.revokePollAccess(pollId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke access' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in revoke poll access API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string; userId: string }> }
) {
  try {
    const { pollId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access to poll
    const hasAccess = await PollPrivacyService.hasPollAccess(pollId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { access_level } = body;

    if (
      !access_level ||
      !['view', 'view_vote', 'admin'].includes(access_level)
    ) {
      return NextResponse.json(
        { error: 'Valid access level is required' },
        { status: 400 }
      );
    }

    const success = await PollPrivacyService.updatePollAccess(
      pollId,
      userId,
      access_level
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update access level' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update poll access API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
