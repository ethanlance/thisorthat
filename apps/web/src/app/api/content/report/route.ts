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
    const { content_type, content_id, report_category, description } = body;

    // Validate required fields
    if (!content_type || !content_id || !report_category) {
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

    // Validate report category
    const validCategories = [
      'inappropriate_content',
      'spam',
      'harassment',
      'violence',
      'hate_speech',
      'other',
    ];
    if (!validCategories.includes(report_category)) {
      return NextResponse.json(
        { error: 'Invalid report category' },
        { status: 400 }
      );
    }

    const success = await ModerationService.submitReport(
      user.id,
      content_type as 'poll' | 'comment' | 'user' | 'image',
      content_id,
      report_category as
        | 'inappropriate_content'
        | 'spam'
        | 'harassment'
        | 'violence'
        | 'hate_speech'
        | 'other',
      description
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
    });
  } catch (error) {
    console.error('Error in content report API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
