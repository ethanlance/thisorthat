import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContentDetectionService } from '@/lib/services/content-detection';

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
    const { data: userData } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', user.id)
      .single();

    if (userData?.raw_user_meta_data?.role !== 'moderator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await ContentDetectionService.getDetectionStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in detection stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
