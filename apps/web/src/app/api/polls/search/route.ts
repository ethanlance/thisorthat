import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscoveryService, SearchFilters } from '@/lib/services/discovery';

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

    const filters: SearchFilters = {
      query: searchParams.get('q') || undefined,
      categories: searchParams.get('categories')?.split(',').filter(Boolean),
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      dateRange:
        (searchParams.get('dateRange') as
          | 'today'
          | 'week'
          | 'month'
          | 'all'
          | undefined) || undefined,
      sortBy:
        (searchParams.get('sortBy') as
          | 'relevance'
          | 'popularity'
          | 'recent'
          | undefined) || 'relevance',
      minEngagement: searchParams.get('minEngagement')
        ? parseFloat(searchParams.get('minEngagement')!)
        : undefined,
      maxAge: searchParams.get('maxAge')
        ? parseInt(searchParams.get('maxAge')!)
        : undefined,
    };

    const polls = await DiscoveryService.searchPolls(filters, limit, offset);

    return NextResponse.json({ polls, filters });
  } catch (error) {
    console.error('Error searching polls:', error);
    return NextResponse.json(
      { error: 'Failed to search polls' },
      { status: 500 }
    );
  }
}
