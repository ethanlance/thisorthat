import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommentService } from '@/lib/services/comments';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!pollId) {
    return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 });
  }

  try {
    const comments = await CommentService.getPollComments(
      pollId,
      limit,
      offset
    );
    return NextResponse.json(comments);
  } catch (error: unknown) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!pollId) {
    return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { content, parent_id } = body;

    // Validate comment content
    const validation = CommentService.validateComment(content);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if poll exists
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // If parent_id is provided, check if parent comment exists
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, poll_id')
        .eq('id', parent_id)
        .eq('poll_id', pollId)
        .eq('is_deleted', false)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    const comment = await CommentService.createComment(
      pollId,
      { content, parent_id },
      user.id
    );

    if (!comment) {
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Get the full comment with user info
    const fullComment = await CommentService.getCommentById(comment.id);

    return NextResponse.json(fullComment, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
