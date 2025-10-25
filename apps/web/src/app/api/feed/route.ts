import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FeedService } from '@/lib/services/feed';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const feedType = searchParams.get('type') || 'personalized';

    let polls;

    switch (feedType) {
      case 'trending':
        polls = await FeedService.getTrendingPolls(limit, offset);
        break;
      case 'recommendations':
        polls = await FeedService.getRecommendations(limit, offset);
        break;
      case 'saved':
        polls = await FeedService.getSavedPolls(limit, offset);
        break;
      default:
        polls = await FeedService.getPersonalizedFeed(limit, offset);
    }

    return NextResponse.json({ polls });
  } catch (error) {
    console.error('Error in feed GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
