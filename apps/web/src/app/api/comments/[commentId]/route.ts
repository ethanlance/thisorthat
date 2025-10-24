import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommentService } from '@/lib/services/comments';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;

  if (!commentId) {
    return NextResponse.json(
      { error: 'Comment ID is required' },
      { status: 400 }
    );
  }

  try {
    const comment = await CommentService.getCommentById(commentId);

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json(comment);
  } catch (error: unknown) {
    console.error('Error fetching comment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { content } = body;

    // Validate comment content
    const validation = CommentService.validateComment(content);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if comment exists and belongs to user
    const { data: existingComment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id, is_deleted')
      .eq('id', commentId)
      .single();

    if (commentError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to edit this comment' },
        { status: 403 }
      );
    }

    if (existingComment.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot edit deleted comment' },
        { status: 400 }
      );
    }

    const updatedComment = await CommentService.updateComment(
      commentId,
      content,
      user.id
    );

    if (!updatedComment) {
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }

    // Get the full comment with user info
    const fullComment = await CommentService.getCommentById(commentId);

    return NextResponse.json(fullComment);
  } catch (error: unknown) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    // Check if comment exists and belongs to user
    const { data: existingComment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id, is_deleted')
      .eq('id', commentId)
      .single();

    if (commentError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this comment' },
        { status: 403 }
      );
    }

    if (existingComment.is_deleted) {
      return NextResponse.json(
        { error: 'Comment already deleted' },
        { status: 400 }
      );
    }

    const success = await CommentService.deleteComment(commentId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
