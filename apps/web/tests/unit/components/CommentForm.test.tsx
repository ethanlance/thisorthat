import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CommentForm from '@/components/comments/CommentForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the comment service
vi.mock('@/lib/services/comments', () => ({
  CommentService: {
    createComment: vi.fn(),
    validateComment: vi.fn(),
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

describe('CommentForm', () => {
  const mockOnCommentAdded = vi.fn();
  const mockCreateComment = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (
      useAuth as unknown as { mockReturnValue: (value: unknown) => void }
    ).mockReturnValue({ user: mockUser });
    const commentService = require('@/lib/services/comments').CommentService;
    commentService.createComment = mockCreateComment;
    commentService.validateComment = vi.fn().mockReturnValue({ isValid: true });
  });

  it('renders comment form for authenticated user', () => {
    render(<CommentForm pollId="poll-1" onCommentAdded={mockOnCommentAdded} />);

    expect(
      screen.getByPlaceholderText('Write a comment...')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /comment/i })
    ).toBeInTheDocument();
  });

  it('shows sign in message for unauthenticated user', () => {
    (
      useAuth as unknown as { mockReturnValue: (value: unknown) => void }
    ).mockReturnValue({ user: null });

    render(<CommentForm pollId="poll-1" onCommentAdded={mockOnCommentAdded} />);

    expect(screen.getByText('Please sign in to comment')).toBeInTheDocument();
  });

  it('validates comment content before submission', async () => {
    const mockValidateComment = vi
      .fn()
      .mockReturnValue({ isValid: false, error: 'Comment too long' });
    const commentService = require('@/lib/services/comments').CommentService;
    commentService.validateComment = mockValidateComment;

    render(<CommentForm pollId="poll-1" onCommentAdded={mockOnCommentAdded} />);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    const submitButton = screen.getByRole('button', { name: /comment/i });

    fireEvent.change(textarea, { target: { value: 'A very long comment...' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockValidateComment).toHaveBeenCalledWith(
        'A very long comment...'
      );
    });
  });

  it('submits comment successfully', async () => {
    mockCreateComment.mockResolvedValue(true);

    render(<CommentForm pollId="poll-1" onCommentAdded={mockOnCommentAdded} />);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    const submitButton = screen.getByRole('button', { name: /comment/i });

    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith(
        'poll-1',
        { content: 'Test comment', parent_id: undefined },
        'user-1'
      );
      expect(mockOnCommentAdded).toHaveBeenCalled();
    });
  });

  it('handles comment submission failure', async () => {
    mockCreateComment.mockResolvedValue(false);

    render(<CommentForm pollId="poll-1" onCommentAdded={mockOnCommentAdded} />);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    const submitButton = screen.getByRole('button', { name: /comment/i });

    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalled();
      expect(mockOnCommentAdded).not.toHaveBeenCalled();
    });
  });

  it('shows character count', () => {
    render(<CommentForm pollId="poll-1" onCommentAdded={mockOnCommentAdded} />);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    fireEvent.change(textarea, { target: { value: 'Test' } });

    expect(screen.getByText('4/500 characters')).toBeInTheDocument();
  });

  it('disables submit button when content is empty', () => {
    render(<CommentForm pollId="poll-1" onCommentAdded={mockOnCommentAdded} />);

    const submitButton = screen.getByRole('button', { name: /comment/i });
    expect(submitButton).toBeDisabled();
  });

  it('clears form after successful submission', async () => {
    mockCreateComment.mockResolvedValue(true);

    render(<CommentForm pollId="poll-1" onCommentAdded={mockOnCommentAdded} />);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    const submitButton = screen.getByRole('button', { name: /comment/i });

    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });
});
