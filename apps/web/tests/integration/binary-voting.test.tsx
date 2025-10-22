import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PollPage from '@/app/(main)/poll/[id]/page';
import { PollsService } from '@/lib/services/polls';
import { AnonymousVotingService } from '@/lib/services/anonymous-voting';
import { useAuth } from '@/contexts/AuthContext';

// Mock necessary modules
vi.mock('@/lib/services/polls');
vi.mock('@/lib/services/anonymous-voting');
vi.mock('@/contexts/AuthContext');
vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}));

describe('Binary Voting System Integration', () => {
  const mockPollId = 'poll-123';
  const mockPoll = {
    id: 'poll-123',
    creator_id: 'user-456',
    option_a_image_url: 'https://example.com/image-a.jpg',
    option_a_label: 'Pizza',
    option_b_image_url: 'https://example.com/image-b.jpg',
    option_b_label: 'Burger',
    description: 'What to eat for lunch?',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_public: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vote_counts: { option_a: 5, option_b: 3 },
    user_vote: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: null }); // Anonymous user
    (PollsService.getPollById as any).mockResolvedValue(mockPoll);
    (AnonymousVotingService.submitAnonymousVote as any).mockResolvedValue({ 
      success: true, 
      anonymousId: 'anon_123_abc' 
    });
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(false);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(null);
  });

  it('allows anonymous user to vote without creating account', async () => {
    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByText('Which do you prefer?')).toBeInTheDocument();
    });

    // User can see voting options
    expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Burger' })).toBeInTheDocument();

    // User can vote without authentication
    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(AnonymousVotingService.submitAnonymousVote).toHaveBeenCalledWith(mockPollId, 'option_a');
    });
  });

  it('shows vote confirmation after successful vote', async () => {
    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(screen.getByText('Vote Submitted!')).toBeInTheDocument();
      expect(screen.getByText(/You voted for Pizza/)).toBeInTheDocument();
    });
  });

  it('prevents duplicate voting from same anonymous user', async () => {
    // Mock that user has already voted
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(true);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue('anon_123_abc');
    (AnonymousVotingService.getAnonymousVote as any).mockResolvedValue('option_a');
    (AnonymousVotingService.submitAnonymousVote as any).mockResolvedValue({
      success: false,
      error: 'You have already voted on this poll'
    });

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByText('Vote Submitted!')).toBeInTheDocument();
    });

    // Should show that user already voted, not voting interface
    expect(screen.queryByText('Which do you prefer?')).not.toBeInTheDocument();
  });

  it('handles voting errors gracefully', async () => {
    (AnonymousVotingService.submitAnonymousVote as any).mockResolvedValue({
      success: false,
      error: 'Poll is closed'
    });

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(screen.getByText('Poll is closed')).toBeInTheDocument();
    });
  });

  it('works for authenticated users with anonymous vote privacy', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    (useAuth as any).mockReturnValue({ user: mockUser });

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    // Should still use anonymous voting service for privacy
    await waitFor(() => {
      expect(AnonymousVotingService.submitAnonymousVote).toHaveBeenCalledWith(mockPollId, 'option_a');
    });
  });

  it('shows loading state during vote submission', async () => {
    // Mock slow vote submission
    (AnonymousVotingService.submitAnonymousVote as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    // Should show loading state
    expect(screen.getByText('Submitting your vote...')).toBeInTheDocument();
  });

  it('disables voting buttons during submission', async () => {
    // Mock slow vote submission
    (AnonymousVotingService.submitAnonymousVote as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    // Buttons should be disabled during submission
    expect(screen.getByRole('button', { name: 'Pizza' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Burger' })).toBeDisabled();
  });

  it('shows share button in vote confirmation', async () => {
    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(screen.getByText('Vote Submitted!')).toBeInTheDocument();
    });

    // Should show share button
    expect(screen.getByRole('button', { name: 'Share Poll' })).toBeInTheDocument();
  });

  it('auto-closes confirmation modal after timeout', async () => {
    vi.useFakeTimers();

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(screen.getByText('Vote Submitted!')).toBeInTheDocument();
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Vote Submitted!')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('handles network errors during vote submission', async () => {
    (AnonymousVotingService.submitAnonymousVote as any).mockRejectedValue(
      new Error('Network error')
    );

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('maintains vote privacy - votes are anonymous to other users', async () => {
    // This test ensures that the voting system maintains anonymity
    // by using anonymous IDs instead of user IDs for vote tracking
    
    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(AnonymousVotingService.submitAnonymousVote).toHaveBeenCalledWith(
        mockPollId, 
        'option_a'
      );
    });

    // Verify that the service was called with anonymous voting
    // rather than authenticated user voting
    expect(AnonymousVotingService.submitAnonymousVote).toHaveBeenCalled();
  });

  it('handles localStorage errors gracefully', async () => {
    // Mock localStorage error
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => { throw new Error('localStorage error'); }),
        setItem: vi.fn(() => { throw new Error('localStorage error'); }),
        removeItem: vi.fn(() => { throw new Error('localStorage error'); })
      },
      writable: true
    });

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    // Should still work despite localStorage errors
    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(AnonymousVotingService.submitAnonymousVote).toHaveBeenCalled();
    });

    // Restore localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });
});
