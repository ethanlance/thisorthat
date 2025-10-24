import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CommentsList from '@/components/comments/CommentsList';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the comment service
vi.mock('@/lib/services/comments', () => ({
  CommentService: {
    getPollComments: vi.fn(),
    createComment: vi.fn(),
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

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

const mockComments = [
  {
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
  },
  {
    id: 'comment-2',
    poll_id: 'poll-1',
    user_id: 'user-2',
    parent_id: null,
    content: 'Another comment',
    is_edited: false,
    edited_at: null,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    created_at: '2024-01-01T01:00:00Z',
    updated_at: '2024-01-01T01:00:00Z',
    user_display_name: 'Other User',
    user_avatar_url: null,
    like_count: 0,
    dislike_count: 0,
    user_reaction: null,
    reply_count: 0,
  },
];

describe('Comments System Integration', () => {
  const mockGetPollComments = vi.fn();
  const mockCreateComment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (
      useAuth as unknown as { mockReturnValue: (value: unknown) => void }
    ).mockReturnValue({ user: mockUser });
    const commentService = require('@/lib/services/comments').CommentService;
    commentService.getPollComments = mockGetPollComments;
    commentService.createComment = mockCreateComment;
  });

  it('loads and displays comments', async () => {
    mockGetPollComments.mockResolvedValue(mockComments);

    render(<CommentsList pollId="poll-1" />);

    await waitFor(() => {
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      expect(screen.getByText('Another comment')).toBeInTheDocument();
    });

    expect(mockGetPollComments).toHaveBeenCalledWith('poll-1', 20, 0);
  });

  it('shows empty state when no comments', async () => {
    mockGetPollComments.mockResolvedValue([]);

    render(<CommentsList pollId="poll-1" />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'No comments yet. Be the first to share your thoughts!'
        )
      ).toBeInTheDocument();
    });
  });

  it('allows authenticated users to post comments', async () => {
    mockGetPollComments.mockResolvedValue([]);
    mockCreateComment.mockResolvedValue(true);

    render(<CommentsList pollId="poll-1" />);

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    const submitButton = screen.getByRole('button', { name: /comment/i });

    fireEvent.change(textarea, { target: { value: 'New comment' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith(
        'poll-1',
        { content: 'New comment', parent_id: undefined },
        'user-1'
      );
    });
  });

  it('shows sign in message for unauthenticated users', () => {
    (
      useAuth as unknown as { mockReturnValue: (value: unknown) => void }
    ).mockReturnValue({ user: null });
    mockGetPollComments.mockResolvedValue([]);

    render(<CommentsList pollId="poll-1" />);

    expect(screen.getByText('Please sign in to comment')).toBeInTheDocument();
  });

  it('handles comment loading errors', async () => {
    mockGetPollComments.mockRejectedValue(new Error('Failed to load'));

    render(<CommentsList pollId="poll-1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load comments')).toBeInTheDocument();
    });
  });

  it('supports pagination with load more button', async () => {
    const firstPage = mockComments.slice(0, 1);
    const secondPage = mockComments.slice(1);

    mockGetPollComments
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    render(<CommentsList pollId="poll-1" />);

    await waitFor(() => {
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText('Another comment')).toBeInTheDocument();
    });

    expect(mockGetPollComments).toHaveBeenCalledTimes(2);
  });

  it('refreshes comments after new comment is added', async () => {
    mockGetPollComments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockComments);
    mockCreateComment.mockResolvedValue(true);

    render(<CommentsList pollId="poll-1" />);

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    const submitButton = screen.getByRole('button', { name: /comment/i });

    fireEvent.change(textarea, { target: { value: 'New comment' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockGetPollComments).toHaveBeenCalledTimes(2);
    });
  });

  it('validates comment content before submission', async () => {
    mockGetPollComments.mockResolvedValue([]);

    render(<CommentsList pollId="poll-1" />);

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    const submitButton = screen.getByRole('button', { name: /comment/i });

    // Test empty comment
    fireEvent.change(textarea, { target: { value: '' } });
    expect(submitButton).toBeDisabled();

    // Test comment that's too long
    fireEvent.change(textarea, { target: { value: 'a'.repeat(501) } });
    expect(submitButton).toBeDisabled();

    // Test valid comment
    fireEvent.change(textarea, { target: { value: 'Valid comment' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows character count for comment input', async () => {
    mockGetPollComments.mockResolvedValue([]);

    render(<CommentsList pollId="poll-1" />);

    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: 'Test comment' } });

    expect(screen.getByText('12/500 characters')).toBeInTheDocument();
  });
});
