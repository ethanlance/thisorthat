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

    const body = await request.json();
    const { moderation_action_id, appeal_reason } = body;

    // Validate required fields
    if (!moderation_action_id || !appeal_reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await ModerationService.submitAppeal(
      user.id,
      moderation_action_id,
      appeal_reason
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to submit appeal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Appeal submitted successfully',
    });
  } catch (error) {
    console.error('Error in content appeal API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
