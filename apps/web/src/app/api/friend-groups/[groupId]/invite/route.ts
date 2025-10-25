import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FriendGroupService } from '@/lib/services/friend-groups';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

    const { groupId } = await params;
    const body = await request.json();
    const { email, message } = body;

    // Validate required fields
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user is member of the group
    const isMember = await FriendGroupService.isUserGroupMember(
      groupId,
      user.id
    );
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await FriendGroupService.inviteUserToGroup(
      groupId,
      email.trim(),
      message?.trim()
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send group invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in group invite API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
