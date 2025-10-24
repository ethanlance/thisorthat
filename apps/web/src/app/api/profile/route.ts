import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await ProfileService.getUserProfile(user.id);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { display_name, bio, avatar_url, interests, privacy_level } = body;

    // Validate input
    if (
      display_name &&
      (typeof display_name !== 'string' || display_name.length > 50)
    ) {
      return NextResponse.json(
        { error: 'Display name must be a string with max 50 characters' },
        { status: 400 }
      );
    }

    if (bio && (typeof bio !== 'string' || bio.length > 500)) {
      return NextResponse.json(
        { error: 'Bio must be a string with max 500 characters' },
        { status: 400 }
      );
    }

    if (
      privacy_level &&
      !['public', 'friends', 'private'].includes(privacy_level)
    ) {
      return NextResponse.json(
        { error: 'Invalid privacy level' },
        { status: 400 }
      );
    }

    if (
      interests &&
      (!Array.isArray(interests) || interests.some(i => typeof i !== 'string'))
    ) {
      return NextResponse.json(
        { error: 'Interests must be an array of strings' },
        { status: 400 }
      );
    }

    const success = await ProfileService.updateProfile(user.id, {
      display_name,
      bio,
      avatar_url,
      interests,
      privacy_level,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
