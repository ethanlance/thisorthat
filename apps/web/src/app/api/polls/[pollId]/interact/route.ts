import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FeedService } from '@/lib/services/feed';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pollId } = await params;
    const body = await request.json();
    const { interaction_type, reason } = body;

    if (
      !interaction_type ||
      !['view', 'vote', 'share', 'comment', 'save', 'hide'].includes(
        interaction_type
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      );
    }

    let success = false;

    switch (interaction_type) {
      case 'save':
        success = await FeedService.savePoll(pollId);
        break;
      case 'hide':
        success = await FeedService.hidePoll(pollId, reason);
        break;
      default:
        success = await FeedService.trackInteraction(pollId, interaction_type);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to process interaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in poll interaction API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pollId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    let success = false;

    switch (action) {
      case 'unsave':
        success = await FeedService.unsavePoll(pollId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to process action' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in poll interaction DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
