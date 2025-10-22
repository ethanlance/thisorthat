import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PollResults from '@/components/poll/PollResults';
import { PollWithResults } from '@/lib/services/polls';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn()
};

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnValue({
    unsubscribe: vi.fn()
  })
};

const mockQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis()
};

// Mock navigator.share and navigator.clipboard
const mockShare = vi.fn();
const mockWriteText = vi.fn();

Object.defineProperty(navigator, 'share', {
  value: mockShare,
  writable: true,
});

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

describe('Poll Results Display Integration', () => {
  const mockPoll: PollWithResults = {
    id: 'test-poll-123',
    description: 'Test Poll',
    option_a_label: 'Option A',
    option_b_label: 'Option B',
    option_a_image_url: 'https://example.com/image-a.jpg',
    option_b_image_url: 'https://example.com/image-b.jpg',
    status: 'active',
    created_at: '2023-01-01T00:00:00Z',
    expires_at: '2023-01-02T00:00:00Z',
    vote_counts: { option_a: 30, option_b: 20 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as vi.Mock).mockReturnValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockQuery);
    mockSupabase.channel.mockReturnValue(mockChannel);
    mockQuery.eq.mockResolvedValue({ data: [], error: null });
    mockShare.mockClear();
    mockWriteText.mockClear();
  });

  it('should display poll results with enhanced chart', async () => {
    render(<PollResults poll={mockPoll} />);
    
    await waitFor(() => {
      expect(screen.getByText('Current Results')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument(); // Total votes
      expect(screen.getByText('Total Votes')).toBeInTheDocument();
    });
  });

  it('should show user vote indicator when user has voted', async () => {
    render(<PollResults poll={mockPoll} userVote="option_a" />);
    
    await waitFor(() => {
      expect(screen.getByText('You voted for')).toBeInTheDocument();
      expect(screen.getByText('Option A')).toBeInTheDocument();
    });
  });

  it('should display correct vote counts and percentages', async () => {
    render(<PollResults poll={mockPoll} />);
    
    await waitFor(() => {
      expect(screen.getByText('30')).toBeInTheDocument(); // Option A votes
      expect(screen.getByText('20')).toBeInTheDocument(); // Option B votes
      expect(screen.getByText('60%')).toBeInTheDocument(); // Option A percentage
      expect(screen.getByText('40%')).toBeInTheDocument(); // Option B percentage
    });
  });

  it('should show final results for closed polls', async () => {
    const closedPoll = { ...mockPoll, status: 'closed' as const };
    render(<PollResults poll={closedPoll} />);
    
    await waitFor(() => {
      expect(screen.getByText('Final Results')).toBeInTheDocument();
    });
  });

  it('should handle share functionality with native share', async () => {
    mockShare.mockResolvedValue(undefined);
    
    render(<PollResults poll={mockPoll} />);
    
    await waitFor(() => {
      expect(screen.getByText('Share Results')).toBeInTheDocument();
    });
    
    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Poll Results: Test Poll',
        text: 'Check out the results of "Test Poll": Option A (30 votes) vs Option B (20 votes)',
        url: expect.stringContaining('/poll/test-poll-123')
      });
    });
  });

  it('should fallback to clipboard when native share is not available', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    });
    
    mockWriteText.mockResolvedValue(undefined);
    
    render(<PollResults poll={mockPoll} />);
    
    await waitFor(() => {
      expect(screen.getByText('Share Results')).toBeInTheDocument();
    });
    
    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('Check out the results of "Test Poll"')
      );
    });
    
    expect(screen.getByText('Results Copied!')).toBeInTheDocument();
  });

  it('should display no votes message when no votes exist', async () => {
    const pollWithNoVotes = { ...mockPoll, vote_counts: { option_a: 0, option_b: 0 } };
    render(<PollResults poll={pollWithNoVotes} />);
    
    await waitFor(() => {
      expect(screen.getByText('No votes yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to vote on this poll!')).toBeInTheDocument();
    });
  });

  it('should show real-time vote count updates', async () => {
    render(<PollResults poll={mockPoll} />);
    
    // Simulate real-time vote update
    const voteUpdateCallback = mockChannel.on.mock.calls.find(
      call => call[0] === 'postgres_changes'
    )?.[2];
    
    if (voteUpdateCallback) {
      voteUpdateCallback({
        new: { choice: 'option_a' }
      });
    }
    
    await waitFor(() => {
      expect(screen.getByText('51')).toBeInTheDocument(); // Updated total votes
    });
  });

  it('should handle connection status changes', async () => {
    render(<PollResults poll={mockPoll} />);
    
    // Simulate connection loss
    const systemCallback = mockChannel.on.mock.calls.find(
      call => call[0] === 'system'
    )?.[2];
    
    if (systemCallback) {
      systemCallback('CHANNEL_ERROR');
    }
    
    await waitFor(() => {
      expect(screen.getByText('Connection lost. Attempting to reconnect...')).toBeInTheDocument();
    });
  });

  it('should display results summary with correct styling', async () => {
    render(<PollResults poll={mockPoll} />);
    
    await waitFor(() => {
      // Check for the results summary section
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });
  });

  it('should handle custom onShare callback', async () => {
    const customShareHandler = vi.fn();
    render(<PollResults poll={mockPoll} onShare={customShareHandler} />);
    
    await waitFor(() => {
      expect(screen.getByText('Share Results')).toBeInTheDocument();
    });
    
    const shareButton = screen.getByText('Share Results');
    fireEvent.click(shareButton);
    
    expect(customShareHandler).toHaveBeenCalled();
  });
});
