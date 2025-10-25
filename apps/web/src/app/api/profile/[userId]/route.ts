import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProfileService } from '@/lib/services/profile';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    const { userId } = params;

    const profile = await ProfileService.getUserProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check privacy settings
    if (profile.privacy_level === 'private' && profile.id !== user.id) {
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
    }

    if (profile.privacy_level === 'friends' && profile.id !== user.id) {
      // Check if users are friends (following each other)
      const isFollowing = await ProfileService.isFollowing(user.id, profile.id);
      const isFollowedBy = await ProfileService.isFollowing(profile.id, user.id);
      
      if (!isFollowing || !isFollowedBy) {
        return NextResponse.json({ error: 'Profile is friends only' }, { status: 403 });
      }
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in user profile GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}