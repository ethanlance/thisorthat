import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProfileService } from '@/lib/services/profile';

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

    const profile = await ProfileService.getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in profile GET API:', error);
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

    // Validate required fields
    if (display_name && display_name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Display name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (display_name && display_name.trim().length > 50) {
      return NextResponse.json(
        { error: 'Display name must be less than 50 characters' },
        { status: 400 }
      );
    }

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be less than 500 characters' },
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

    const updateData = {
      ...(display_name !== undefined && { display_name: display_name.trim() }),
      ...(bio !== undefined && { bio: bio.trim() }),
      ...(avatar_url !== undefined && { avatar_url }),
      ...(interests !== undefined && { interests }),
      ...(privacy_level !== undefined && { privacy_level }),
    };

    const success = await ProfileService.updateProfile(updateData);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in profile PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
