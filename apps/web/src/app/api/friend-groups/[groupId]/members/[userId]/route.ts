import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FriendGroupService } from '@/lib/services/friend-groups';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; userId: string }> }
) {
  try {
    const { groupId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is group admin or removing themselves
    const isAdmin = await FriendGroupService.isGroupAdmin(groupId, user.id);
    const isSelf = user.id === userId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await FriendGroupService.removeMember(groupId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in remove group member API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; userId: string }> }
) {
  try {
    const { groupId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is group admin
    const isAdmin = await FriendGroupService.isGroupAdmin(groupId, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role is required' },
        { status: 400 }
      );
    }

    const success = await FriendGroupService.updateMemberRole(
      groupId,
      userId,
      role
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update member role API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
