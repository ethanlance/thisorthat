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

    const preferences = await DiscoveryService.getUserFeedPreferences(user.id);

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching feed preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed preferences' },
      { status: 500 }
    );
  }
}

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
    const success = await DiscoveryService.updateUserFeedPreferences(
      user.id,
      body
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update feed preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating feed preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update feed preferences' },
      { status: 500 }
    );
  }
}

