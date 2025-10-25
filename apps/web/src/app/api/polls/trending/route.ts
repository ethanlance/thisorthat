import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscoveryService } from '@/lib/services/discovery';

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

    const polls = await DiscoveryService.getTrendingPolls(limit, offset);

    return NextResponse.json({ polls });
  } catch (error) {
    console.error('Error fetching trending polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending polls' },
      { status: 500 }
    );
  }
}

