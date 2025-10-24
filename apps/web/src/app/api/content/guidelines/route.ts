import { NextResponse } from 'next/server';
import { ModerationService } from '@/lib/services/moderation';

export async function GET() {
  try {
    const guidelines = await ModerationService.getContentGuidelines();

    return NextResponse.json(guidelines);
  } catch (error) {
    console.error('Error in content guidelines API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
