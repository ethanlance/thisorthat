import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ModerationService } from '@/lib/services/moderation';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a moderator
    const isModerator = await ModerationService.isModerator(user.id);
    if (!isModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { content_type, content_id, action_type, reason, severity } = body;

    // Validate required fields
    if (!content_type || !content_id || !action_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = ['poll', 'comment', 'user', 'image'];
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Validate action type
    const validActionTypes = [
      'approve',
      'reject',
      'delete',
      'hide',
      'escalate',
      'warn_user',
    ];
    if (!validActionTypes.includes(action_type)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    const success = await ModerationService.takeModerationAction(
      user.id,
      content_type as 'poll' | 'comment' | 'user' | 'image',
      content_id,
      action_type as
        | 'approve'
        | 'reject'
        | 'delete'
        | 'hide'
        | 'escalate'
        | 'warn_user',
      reason,
      (severity as 'low' | 'medium' | 'high' | 'critical') || 'medium'
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to take moderation action' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Moderation action taken successfully',
    });
  } catch (error) {
    console.error('Error in moderation action API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
