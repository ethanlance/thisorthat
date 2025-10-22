import { render, screen, waitFor, act } from '@testing-library/react';
import { useRealtimeVotes } from '@/lib/hooks/useRealtimeVotes';
import VoteCountDisplay from '@/components/poll/VoteCountDisplay';
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

// Test component that uses the hook
function TestComponent({ pollId }: { pollId: string }) {
  const { voteCounts, isConnected, lastUpdate, error } = useRealtimeVotes(pollId);
  
  return (
    <VoteCountDisplay
      voteCounts={voteCounts}
      optionLabels={{ option_a: 'Option A', option_b: 'Option B' }}
      isConnected={isConnected}
      lastUpdate={lastUpdate}
      error={error}
    />
  );
}

describe('Real-time Vote Counting Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as vi.Mock).mockReturnValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockQuery);
    mockSupabase.channel.mockReturnValue(mockChannel);
  });

  it('should display initial vote counts and update in real-time', async () => {
    // Mock initial vote fetch
    const initialVotes = [
      { choice: 'option_a' },
      { choice: 'option_a' },
      { choice: 'option_b' }
    ];
    
    mockQuery.eq.mockResolvedValue({ data: initialVotes, error: null });
    
    render(<TestComponent pollId="test-poll" />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total votes
      expect(screen.getByText('2 votes (67%)')).toBeInTheDocument(); // Option A
      expect(screen.getByText('1 votes (33%)')).toBeInTheDocument(); // Option B
    });
    
    // Simulate real-time vote update
    const voteUpdateCallback = mockChannel.on.mock.calls.find(
      call => call[0] === 'postgres_changes'
    )?.[2];
    
    if (voteUpdateCallback) {
      act(() => {
        voteUpdateCallback({
          new: { choice: 'option_b' }
        });
      });
    }
    
    // Check that vote counts updated
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument(); // Total votes
      expect(screen.getByText('2 votes (50%)')).toBeInTheDocument(); // Option A
      expect(screen.getByText('2 votes (50%)')).toBeInTheDocument(); // Option B
    });
  });

  it('should handle connection status changes', async () => {
    mockQuery.eq.mockResolvedValue({ data: [], error: null });
    
    render(<TestComponent pollId="test-poll" />);
    
    // Initially connected
    expect(screen.queryByText('Connection lost')).not.toBeInTheDocument();
    
    // Simulate connection loss
    const systemCallback = mockChannel.on.mock.calls.find(
      call => call[0] === 'system'
    )?.[2];
    
    if (systemCallback) {
      act(() => {
        systemCallback('CHANNEL_ERROR');
      });
    }
    
    // Check connection status is displayed
    await waitFor(() => {
      expect(screen.getByText('Connection lost. Attempting to reconnect...')).toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    mockQuery.eq.mockResolvedValue({ data: null, error: new Error('Fetch failed') });
    
    render(<TestComponent pollId="test-poll" />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch initial votes')).toBeInTheDocument();
    });
  });

  it('should display last update time', async () => {
    const lastUpdate = new Date('2023-01-01T12:00:00Z');
    mockQuery.eq.mockResolvedValue({ data: [], error: null });
    
    render(<TestComponent pollId="test-poll" />);
    
    // Simulate a vote update to set lastUpdate
    const voteUpdateCallback = mockChannel.on.mock.calls.find(
      call => call[0] === 'postgres_changes'
    )?.[2];
    
    if (voteUpdateCallback) {
      act(() => {
        voteUpdateCallback({
          new: { choice: 'option_a' }
        });
      });
    }
    
    // Then simulate connection loss to show last update
    const systemCallback = mockChannel.on.mock.calls.find(
      call => call[0] === 'system'
    )?.[2];
    
    if (systemCallback) {
      act(() => {
        systemCallback('CHANNEL_ERROR');
      });
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Last update:/)).toBeInTheDocument();
    });
  });

  it('should cleanup subscription on unmount', () => {
    const mockUnsubscribe = jest.fn();
    mockChannel.subscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });
    mockQuery.eq.mockResolvedValue({ data: [], error: null });
    
    const { unmount } = render(<TestComponent pollId="test-poll" />);
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle multiple rapid vote updates', async () => {
    mockQuery.eq.mockResolvedValue({ data: [], error: null });
    
    render(<TestComponent pollId="test-poll" />);
    
    const voteUpdateCallback = mockChannel.on.mock.calls.find(
      call => call[0] === 'postgres_changes'
    )?.[2];
    
    if (voteUpdateCallback) {
      // Simulate multiple rapid votes
      act(() => {
        voteUpdateCallback({ new: { choice: 'option_a' } });
        voteUpdateCallback({ new: { choice: 'option_b' } });
        voteUpdateCallback({ new: { choice: 'option_a' } });
      });
    }
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total votes
      expect(screen.getByText('2 votes (67%)')).toBeInTheDocument(); // Option A
      expect(screen.getByText('1 votes (33%)')).toBeInTheDocument(); // Option B
    });
  });
});
