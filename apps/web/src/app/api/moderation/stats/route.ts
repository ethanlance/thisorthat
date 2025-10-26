import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ModerationService } from '@/lib/services/moderation';

export async function GET() {
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

    const stats = await ModerationService.getModerationStats();

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch moderation stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in moderation stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
