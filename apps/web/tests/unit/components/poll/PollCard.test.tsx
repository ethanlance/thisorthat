import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PollCard from '@/components/poll/PollCard';
import { UserPollSummary } from '@/lib/services/dashboard';

// Mock the expiration service
vi.mock('@/lib/services/expiration', () => ({
  getPollStatus: vi.fn(),
  isPollActive: vi.fn(),
}));

// Mock time helpers
vi.mock('@/lib/utils/time-helpers', () => ({
  formatRelativeTime: vi.fn(),
}));

import { getPollStatus, isPollActive } from '@/lib/services/expiration';
import { formatRelativeTime } from '@/lib/utils/time-helpers';

describe('PollCard', () => {
  const mockPoll: UserPollSummary = {
    id: 'poll-123',
    creator_id: 'user-123',
    option_a_image_url: 'https://example.com/image-a.jpg',
    option_a_label: 'Pizza',
    option_b_image_url: 'https://example.com/image-b.jpg',
    option_b_label: 'Burger',
    description: 'What should we eat for dinner?',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_public: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vote_counts: { option_a: 5, option_b: 3 },
    share_count: 2,
    last_activity: new Date().toISOString(),
  };

  const mockOnDelete = vi.fn();
  const mockOnShare = vi.fn();
  const mockOnView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPollStatus).mockReturnValue('active');
    vi.mocked(isPollActive).mockReturnValue(true);
    vi.mocked(formatRelativeTime).mockReturnValue('2 hours ago');
  });

  it('renders poll card with all information', () => {
    render(
      <PollCard
        poll={mockPoll}
        onDelete={mockOnDelete}
        onShare={mockOnShare}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(
      screen.getByText('What should we eat for dinner?')
    ).toBeInTheDocument();
    expect(screen.getByText('8 votes')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Share count
    expect(screen.getByText('Last activity: 2 hours ago')).toBeInTheDocument();
  });

  it('renders active poll with countdown timer', () => {
    vi.mocked(isPollActive).mockReturnValue(true);

    render(<PollCard poll={mockPoll} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  it('renders closed poll with vote percentages', () => {
    vi.mocked(getPollStatus).mockReturnValue('closed');
    vi.mocked(isPollActive).mockReturnValue(false);

    render(<PollCard poll={mockPoll} />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('63%')).toBeInTheDocument(); // 5/8 votes for option A
    expect(screen.getByText('38%')).toBeInTheDocument(); // 3/8 votes for option B
  });

  it('handles view button click', () => {
    render(<PollCard poll={mockPoll} onView={mockOnView} />);

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(mockOnView).toHaveBeenCalledWith('poll-123');
  });

  it('handles share button click', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<PollCard poll={mockPoll} onShare={mockOnShare} />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/poll/poll-123')
      );
      expect(mockOnShare).toHaveBeenCalledWith('poll-123');
    });
  });

  it('handles delete action from menu', async () => {
    render(<PollCard poll={mockPoll} onDelete={mockOnDelete} />);

    // Click the more actions button
    fireEvent.click(screen.getByLabelText('Poll actions'));

    // Click delete in the menu
    fireEvent.click(screen.getByText('Delete Poll'));

    // Confirm deletion
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('poll-123');
    });
  });

  it('shows vote results bar for closed polls', () => {
    vi.mocked(getPollStatus).mockReturnValue('closed');
    vi.mocked(isPollActive).mockReturnValue(false);

    render(<PollCard poll={mockPoll} />);

    // Should have vote results bar
    const voteBar = screen.getByRole('progressbar', { hidden: true });
    expect(voteBar).toBeInTheDocument();
  });

  it('displays correct vote counts', () => {
    render(<PollCard poll={mockPoll} />);

    expect(screen.getByText('8 votes')).toBeInTheDocument();
  });

  it('displays share count when available', () => {
    render(<PollCard poll={mockPoll} />);

    expect(screen.getByText('2')).toBeInTheDocument(); // Share count icon
  });

  it('handles polls without labels', () => {
    const pollWithoutLabels = {
      ...mockPoll,
      option_a_label: null,
      option_b_label: null,
    };

    render(<PollCard poll={pollWithoutLabels} />);

    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('handles polls without description', () => {
    const pollWithoutDescription = {
      ...mockPoll,
      description: null,
    };

    render(<PollCard poll={pollWithoutDescription} />);

    expect(
      screen.queryByText('What should we eat for dinner?')
    ).not.toBeInTheDocument();
  });

  it('handles polls without share count', () => {
    const pollWithoutShares = {
      ...mockPoll,
      share_count: 0,
    };

    render(<PollCard poll={pollWithoutShares} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('handles polls without last activity', () => {
    const pollWithoutActivity = {
      ...mockPoll,
      last_activity: null,
    };

    render(<PollCard poll={pollWithoutActivity} />);

    expect(screen.queryByText('Last activity:')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<PollCard poll={mockPoll} className="custom-class" />);

    const card = screen.getByText('Pizza').closest('[class*="group"]');
    expect(card).toHaveClass('custom-class');
  });

  it('opens poll in new tab when no onView handler provided', () => {
    const mockOpen = vi.fn();
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    });

    render(<PollCard poll={mockPoll} />);

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(mockOpen).toHaveBeenCalledWith('/poll/poll-123', '_blank');
  });
});
