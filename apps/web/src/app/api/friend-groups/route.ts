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

    const groups = await FriendGroupService.getUserGroups(user.id);

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

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    const group = await FriendGroupService.createGroup(
      name,
      description || null,
      is_public || false,
      user.id
    );

    if (!group) {
      return NextResponse.json(
        { error: 'Failed to create group' },
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
