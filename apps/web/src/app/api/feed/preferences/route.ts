import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FeedService } from '@/lib/services/feed';

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

    const preferences = await FeedService.getFeedPreferences();

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error in feed preferences GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      preferred_categories,
      preferred_tags,
      excluded_categories,
      excluded_tags,
      feed_algorithm,
      show_following_only,
      show_public_only,
    } = body;

    // Validate feed algorithm
    if (
      feed_algorithm &&
      ![
        'chronological',
        'popular',
        'trending',
        'personalized',
        'mixed',
      ].includes(feed_algorithm)
    ) {
      return NextResponse.json(
        { error: 'Invalid feed algorithm' },
        { status: 400 }
      );
    }

    const preferences = {
      ...(preferred_categories !== undefined && { preferred_categories }),
      ...(preferred_tags !== undefined && { preferred_tags }),
      ...(excluded_categories !== undefined && { excluded_categories }),
      ...(excluded_tags !== undefined && { excluded_tags }),
      ...(feed_algorithm !== undefined && { feed_algorithm }),
      ...(show_following_only !== undefined && { show_following_only }),
      ...(show_public_only !== undefined && { show_public_only }),
    };

    const success = await FeedService.updateFeedPreferences(preferences);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update feed preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in feed preferences PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
