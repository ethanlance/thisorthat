import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PollPage from '@/app/(main)/poll/[id]/page';
import { PollsService } from '@/lib/services/polls';
import { VotesService } from '@/lib/services/votes';
import { useAuth } from '@/contexts/AuthContext';

// Mock necessary modules
vi.mock('@/lib/services/polls');
vi.mock('@/lib/services/votes');
vi.mock('@/contexts/AuthContext');
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

describe('Poll Viewing Integration', () => {
  const mockPollId = 'poll-123';
  const mockUser = { id: 'user-123', email: 'test@example.com' };
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
    user_vote: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (PollsService.getPollById as any).mockResolvedValue(mockPoll);
    (VotesService.submitVote as any).mockResolvedValue({
      success: true,
      voteId: 'vote-123',
    });
  });

  it('renders poll view page with all elements', async () => {
    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
      expect(screen.getByText('Burger')).toBeInTheDocument();
      expect(screen.getByText('What to eat for lunch?')).toBeInTheDocument();
    });

    expect(screen.getByText('Which do you prefer?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Burger' })).toBeInTheDocument();
  });

  it('displays poll status and countdown timer', async () => {
    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    // Should show countdown timer for active poll
    expect(screen.getByText(/d|h|m|s/)).toBeInTheDocument();
  });

  it('handles voting successfully', async () => {
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

  it('prevents voting on closed polls', async () => {
    const closedPoll = {
      ...mockPoll,
      status: 'closed',
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    };
    (PollsService.getPollById as any).mockResolvedValue(closedPoll);

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    // Should show results instead of voting interface
    expect(screen.getByText('Poll Results')).toBeInTheDocument();
    expect(screen.queryByText('Which do you prefer?')).not.toBeInTheDocument();
  });

  it('displays poll results with vote counts', async () => {
    const pollWithVotes = {
      ...mockPoll,
      user_vote: 'option_a',
    };
    (PollsService.getPollById as any).mockResolvedValue(pollWithVotes);

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByText('Poll Results')).toBeInTheDocument();
    });

    expect(screen.getByText('8 votes total')).toBeInTheDocument();
    expect(screen.getByText('63%')).toBeInTheDocument(); // 5/8 votes
    expect(screen.getByText('38%')).toBeInTheDocument(); // 3/8 votes
  });

  it('handles poll not found', async () => {
    (PollsService.getPollById as any).mockResolvedValue(null);

    render(<PollPage params={{ id: 'non-existent' }} />);

    // Should call notFound()
    expect(require('next/navigation').notFound).toHaveBeenCalled();
  });

  it('handles voting errors gracefully', async () => {
    (VotesService.submitVote as any).mockResolvedValue({
      success: false,
      error: 'Vote failed',
    });

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(screen.getByText('Vote failed')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (PollsService.getPollById as any).mockReturnValue(new Promise(() => {})); // Never resolve

    render(<PollPage params={{ id: mockPollId }} />);

    // Should show loading spinner
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('handles anonymous voting', async () => {
    (useAuth as any).mockReturnValue({ user: null });

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pizza' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pizza' }));

    await waitFor(() => {
      expect(VotesService.submitVote).toHaveBeenCalledWith({
        pollId: mockPollId,
        choice: 'option_a',
        userId: undefined,
        anonymousId: expect.stringMatching(/^anon_\d+_[a-z0-9]+$/),
      });
    });
  });

  it('displays poll creation and expiration info', async () => {
    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByText(/Poll created/)).toBeInTheDocument();
      expect(screen.getByText(/Expires/)).toBeInTheDocument();
      expect(screen.getByText('Public poll')).toBeInTheDocument();
    });
  });

  it('handles share functionality', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/poll/poll-123')
      );
    });
  });

  it('handles refresh functionality', async () => {
    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Refresh' })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    // Should refetch poll data
    expect(PollsService.getPollById).toHaveBeenCalledTimes(2);
  });

  it('shows back button functionality', async () => {
    const mockBack = vi.fn();
    Object.defineProperty(window, 'history', {
      value: { back: mockBack },
      writable: true,
    });

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(mockBack).toHaveBeenCalled();
  });

  it('displays images with proper alt text', async () => {
    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      const pizzaImage = screen.getByAltText('Pizza');
      const burgerImage = screen.getByAltText('Burger');

      expect(pizzaImage).toBeInTheDocument();
      expect(burgerImage).toBeInTheDocument();
      expect(pizzaImage).toHaveAttribute(
        'src',
        'https://example.com/image-a.jpg'
      );
      expect(burgerImage).toHaveAttribute(
        'src',
        'https://example.com/image-b.jpg'
      );
    });
  });

  it('handles polls without labels', async () => {
    const pollWithoutLabels = {
      ...mockPoll,
      option_a_label: null,
      option_b_label: null,
    };
    (PollsService.getPollById as any).mockResolvedValue(pollWithoutLabels);

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });
  });

  it('handles polls without description', async () => {
    const pollWithoutDescription = {
      ...mockPoll,
      description: null,
    };
    (PollsService.getPollById as any).mockResolvedValue(pollWithoutDescription);

    render(<PollPage params={{ id: mockPollId }} />);

    await waitFor(() => {
      expect(
        screen.queryByText('What to eat for lunch?')
      ).not.toBeInTheDocument();
    });
  });
});
