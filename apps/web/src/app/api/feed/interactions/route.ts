import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscoveryService } from '@/lib/services/discovery';

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
    const { pollId, interactionType, interactionData } = body;

    if (!pollId || !interactionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await DiscoveryService.trackInteraction(
      user.id,
      pollId,
      interactionType,
      interactionData || {}
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to track interaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}
