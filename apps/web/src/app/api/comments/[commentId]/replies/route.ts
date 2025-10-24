import { NextResponse } from 'next/server';
import { CommentService } from '@/lib/services/comments';

export async function GET(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  const { commentId } = params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!commentId) {
    return NextResponse.json(
      { error: 'Comment ID is required' },
      { status: 400 }
    );
  }

  try {
    const replies = await CommentService.getCommentReplies(
      commentId,
      limit,
      offset
    );
    return NextResponse.json(replies);
  } catch (error: unknown) {
    console.error('Error fetching comment replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}
