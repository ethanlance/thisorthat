import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile';
import { createClient } from '@/lib/supabase/server';

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
    const searchTerm = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!searchTerm || searchTerm.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search term must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (limit > 50) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 50' },
        { status: 400 }
      );
    }

    const results = await ProfileService.searchUsers(
      searchTerm.trim(),
      limit,
      offset
    );

    return NextResponse.json({
      results,
      pagination: {
        limit,
        offset,
        hasMore: results.length === limit,
      },
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
