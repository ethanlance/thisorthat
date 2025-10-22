import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeVotes } from '@/lib/hooks/useRealtimeVotes';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn(),
};

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnValue({
    unsubscribe: vi.fn(),
  }),
};

const mockQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
};

describe('useRealtimeVotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as vi.Mock).mockReturnValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockQuery);
    mockSupabase.channel.mockReturnValue(mockChannel);
  });

  it('should initialize with zero vote counts', () => {
    mockQuery.eq.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useRealtimeVotes('test-poll-id'));

    expect(result.current.voteCounts).toEqual({ option_a: 0, option_b: 0 });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.lastUpdate).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch initial vote counts', async () => {
    const mockVotes = [
      { choice: 'option_a' },
      { choice: 'option_b' },
      { choice: 'option_a' },
    ];

    mockQuery.eq.mockResolvedValue({ data: mockVotes, error: null });

    const { result } = renderHook(() => useRealtimeVotes('test-poll-id'));

    await waitFor(() => {
      expect(result.current.voteCounts).toEqual({ option_a: 2, option_b: 1 });
    });
  });

  it('should handle fetch errors', async () => {
    mockQuery.eq.mockResolvedValue({
      data: null,
      error: new Error('Fetch failed'),
    });

    const { result } = renderHook(() => useRealtimeVotes('test-poll-id'));

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch initial votes');
    });
  });

  it('should set up real-time subscription', () => {
    mockQuery.eq.mockResolvedValue({ data: [], error: null });

    renderHook(() => useRealtimeVotes('test-poll-id'));

    expect(mockSupabase.channel).toHaveBeenCalledWith(
      'vote-updates-test-poll-id'
    );
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'votes',
        filter: 'poll_id=eq.test-poll-id',
      },
      expect.any(Function)
    );
    expect(mockChannel.on).toHaveBeenCalledWith(
      'system',
      {},
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('should handle real-time vote updates', async () => {
    mockQuery.eq.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useRealtimeVotes('test-poll-id'));

    // Simulate real-time vote update
    const voteUpdateCallback = mockChannel.on.mock.calls.find(
      call => call[0] === 'postgres_changes'
    )?.[2];

    if (voteUpdateCallback) {
      voteUpdateCallback({
        new: { choice: 'option_a' },
      });
    }

    await waitFor(() => {
      expect(result.current.voteCounts).toEqual({ option_a: 1, option_b: 0 });
    });
  });

  it('should handle connection status changes', async () => {
    mockQuery.eq.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useRealtimeVotes('test-poll-id'));

    // Simulate connection status change
    const systemCallback = mockChannel.on.mock.calls.find(
      call => call[0] === 'system'
    )?.[2];

    if (systemCallback) {
      systemCallback('CHANNEL_ERROR');
    }

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe('Connection error');
    });
  });

  it('should cleanup subscription on unmount', () => {
    const mockUnsubscribe = jest.fn();
    mockChannel.subscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });
    mockQuery.eq.mockResolvedValue({ data: [], error: null });

    const { unmount } = renderHook(() => useRealtimeVotes('test-poll-id'));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should not set up subscription for empty poll ID', () => {
    renderHook(() => useRealtimeVotes(''));

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });
});
