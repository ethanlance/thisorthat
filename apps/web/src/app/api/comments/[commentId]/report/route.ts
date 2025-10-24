import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommentService } from '@/lib/services/comments';

export async function POST(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  const { commentId } = params;
  const supabase = createClient();
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
    const { reason, description } = body;

    if (
      !reason ||
      !['spam', 'harassment', 'inappropriate', 'off_topic', 'other'].includes(
        reason
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid report reason' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id, is_deleted')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot report deleted comment' },
        { status: 400 }
      );
    }

    // Check if user is trying to report their own comment
    if (comment.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot report your own comment' },
        { status: 400 }
      );
    }

    // Check if user has already reported this comment
    const { data: existingReport } = await supabase
      .from('comment_reports')
      .select('id')
      .eq('comment_id', commentId)
      .eq('reporter_id', user.id)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this comment' },
        { status: 400 }
      );
    }

    const success = await CommentService.reportComment(
      commentId,
      reason as 'spam' | 'harassment' | 'inappropriate' | 'off_topic' | 'other',
      description
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to report comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Comment reported successfully' });
  } catch (error: unknown) {
    console.error('Error reporting comment:', error);
    return NextResponse.json(
      { error: 'Failed to report comment' },
      { status: 500 }
    );
  }
}
