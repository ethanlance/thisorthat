import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CommentItem from '@/components/comments/CommentItem';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the comment service
vi.mock('@/lib/services/comments', () => ({
  CommentService: {
    updateCommentReaction: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
    reportComment: vi.fn(),
  },
}));

// Mock the toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

const mockComment = {
  id: 'comment-1',
  poll_id: 'poll-1',
  user_id: 'user-1',
  parent_id: null,
  content: 'This is a test comment',
  is_edited: false,
  edited_at: null,
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_display_name: 'Test User',
  user_avatar_url: 'https://example.com/avatar.jpg',
  like_count: 5,
  dislike_count: 1,
  user_reaction: null,
  reply_count: 2,
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};

describe('CommentItem', () => {
  const mockOnCommentUpdated = vi.fn();
  const mockOnCommentDeleted = vi.fn();
  const mockUpdateReaction = vi.fn();
  const mockUpdateComment = vi.fn();
  const mockDeleteComment = vi.fn();
  const mockReportComment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (
      useAuth as unknown as { mockReturnValue: (value: unknown) => void }
    ).mockReturnValue({ user: mockUser });
    const commentService = require('@/lib/services/comments').CommentService;
    commentService.updateCommentReaction = mockUpdateReaction;
    commentService.updateComment = mockUpdateComment;
    commentService.deleteComment = mockDeleteComment;
    commentService.reportComment = mockReportComment;
  });

  it('renders comment with user info', () => {
    render(
      <CommentItem
        comment={mockComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('shows reaction counts', () => {
    render(
      <CommentItem
        comment={mockComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument(); // like count
    expect(screen.getByText('1')).toBeInTheDocument(); // dislike count
  });

  it('handles like reaction', async () => {
    mockUpdateReaction.mockResolvedValue(true);

    render(
      <CommentItem
        comment={mockComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    const likeButton = screen.getByRole('button', { name: /5/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockUpdateReaction).toHaveBeenCalledWith('comment-1', 'like');
      expect(mockOnCommentUpdated).toHaveBeenCalled();
    });
  });

  it('handles dislike reaction', async () => {
    mockUpdateReaction.mockResolvedValue(true);

    render(
      <CommentItem
        comment={mockComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    const dislikeButton = screen.getByRole('button', { name: /1/i });
    fireEvent.click(dislikeButton);

    await waitFor(() => {
      expect(mockUpdateReaction).toHaveBeenCalledWith('comment-1', 'dislike');
      expect(mockOnCommentUpdated).toHaveBeenCalled();
    });
  });

  it('shows reply button', () => {
    render(
      <CommentItem
        comment={mockComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument();
  });

  it('shows reply count when there are replies', () => {
    render(
      <CommentItem
        comment={mockComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    expect(screen.getByText('Show 2 replies')).toBeInTheDocument();
  });

  it('shows edit and delete options for own comments', () => {
    render(
      <CommentItem
        comment={mockComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('shows report option for other users comments', () => {
    const otherUserComment = { ...mockComment, user_id: 'user-2' };

    render(
      <CommentItem
        comment={otherUserComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);

    expect(screen.getByText('Report')).toBeInTheDocument();
  });

  it('handles comment deletion', async () => {
    mockDeleteComment.mockResolvedValue(true);
    window.confirm = vi.fn(() => true);

    render(
      <CommentItem
        comment={mockComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteComment).toHaveBeenCalledWith('comment-1', 'user-1');
      expect(mockOnCommentDeleted).toHaveBeenCalled();
    });
  });

  it('handles comment reporting', async () => {
    mockReportComment.mockResolvedValue(true);
    window.prompt = vi.fn(() => 'spam');

    const otherUserComment = { ...mockComment, user_id: 'user-2' };

    render(
      <CommentItem
        comment={otherUserComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);

    const reportButton = screen.getByText('Report');
    fireEvent.click(reportButton);

    await waitFor(() => {
      expect(mockReportComment).toHaveBeenCalledWith(
        'comment-1',
        'spam',
        'User reported comment'
      );
    });
  });

  it('shows edited badge for edited comments', () => {
    const editedComment = { ...mockComment, is_edited: true };

    render(
      <CommentItem
        comment={editedComment}
        onCommentUpdated={mockOnCommentUpdated}
        onCommentDeleted={mockOnCommentDeleted}
      />
    );

    expect(screen.getByText('edited')).toBeInTheDocument();
  });
});
