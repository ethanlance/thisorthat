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
    const query = searchParams.get('q');
    const categories = searchParams.get('categories')?.split(',') || [];
    const tags = searchParams.get('tags')?.split(',') || [];
    const sortBy = searchParams.get('sort_by') || 'relevance';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const filters = {
      categories: categories.length > 0 ? categories : undefined,
      tags: tags.length > 0 ? tags : undefined,
      sort_by: sortBy as 'relevance' | 'trending' | 'popular' | 'newest',
    };

    const polls = await FeedService.searchPolls(
      query.trim(),
      filters,
      limit,
      offset
    );

    return NextResponse.json({ polls });
  } catch (error) {
    console.error('Error in polls search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}