import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FriendGroupService } from '@/lib/services/friend-groups';

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
    const type = searchParams.get('type') || 'user'; // 'user' or 'public'

    let groups;

    if (type === 'public') {
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');
      groups = await FriendGroupService.getPublicFriendGroups(limit, offset);
    } else {
      groups = await FriendGroupService.getUserFriendGroups();
    }

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error in friend groups API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { name, description, is_public } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    const group = await FriendGroupService.createFriendGroup(
      name.trim(),
      description?.trim(),
      is_public || false
    );

    if (!group) {
      return NextResponse.json(
        { error: 'Failed to create friend group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error in create friend group API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
