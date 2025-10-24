import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommentService } from '@/lib/services/comments';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!commentId) {
    return NextResponse.json(
      { error: 'Comment ID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { reaction_type } = body;

    if (
      !reaction_type ||
      !['like', 'dislike', 'none'].includes(reaction_type)
    ) {
      return NextResponse.json(
        { error: 'Invalid reaction type. Must be like, dislike, or none' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, is_deleted')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot react to deleted comment' },
        { status: 400 }
      );
    }

    const success = await CommentService.updateCommentReaction(
      commentId,
      reaction_type as 'like' | 'dislike' | 'none'
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Reaction updated successfully' });
  } catch (error: unknown) {
    console.error('Error updating comment reaction:', error);
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}
