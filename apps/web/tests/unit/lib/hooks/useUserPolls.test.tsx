import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserPolls } from '@/lib/hooks/useUserPolls';
import { DashboardService } from '@/lib/services/dashboard';
import { createClient } from '@/lib/supabase/client';

// Mock the dashboard service
vi.mock('@/lib/services/dashboard', () => ({
  DashboardService: {
    getUserPolls: vi.fn(),
    deletePoll: vi.fn(),
    sharePoll: vi.fn(),
  },
}));

// Mock Supabase client
const mockSupabase = {
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(() => ({
        unsubscribe: vi.fn(),
      })),
    })),
  })),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('useUserPolls', () => {
  const mockUserId = 'user-123';
  const mockPolls = [
    {
      id: 'poll-1',
      creator_id: 'user-123',
      option_a_image_url: 'https://example.com/image-a.jpg',
      option_a_label: 'Option A',
      option_b_image_url: 'https://example.com/image-b.jpg',
      option_b_label: 'Option B',
      description: 'Test poll 1',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_public: true,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vote_counts: { option_a: 5, option_b: 3 },
      share_count: 2,
    },
    {
      id: 'poll-2',
      creator_id: 'user-123',
      option_a_image_url: 'https://example.com/image-a2.jpg',
      option_a_label: 'Option A2',
      option_b_image_url: 'https://example.com/image-b2.jpg',
      option_b_label: 'Option B2',
      description: 'Test poll 2',
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      is_public: true,
      status: 'closed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vote_counts: { option_a: 2, option_b: 8 },
      share_count: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user polls on mount', async () => {
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(mockPolls);

    const { result } = renderHook(() => useUserPolls(mockUserId));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.polls).toEqual(mockPolls);
    expect(result.current.error).toBeNull();
    expect(DashboardService.getUserPolls).toHaveBeenCalledWith(mockUserId);
  });

  it('should handle undefined userId', async () => {
    const { result } = renderHook(() => useUserPolls(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.polls).toEqual([]);
    expect(DashboardService.getUserPolls).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch polls');
    vi.mocked(DashboardService.getUserPolls).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUserPolls(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.polls).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch polls');
  });

  it('should delete poll successfully', async () => {
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(mockPolls);
    vi.mocked(DashboardService.deletePoll).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserPolls(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deletePoll('poll-1');
    });

    expect(result.current.polls).toHaveLength(1);
    expect(result.current.polls[0].id).toBe('poll-2');
    expect(DashboardService.deletePoll).toHaveBeenCalledWith('poll-1');
  });

  it('should handle delete poll errors', async () => {
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(mockPolls);
    const mockError = new Error('Failed to delete poll');
    vi.mocked(DashboardService.deletePoll).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUserPolls(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.deletePoll('poll-1');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Failed to delete poll');
    expect(result.current.polls).toEqual(mockPolls); // Should not change on error
  });

  it('should share poll successfully', async () => {
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(mockPolls);
    vi.mocked(DashboardService.sharePoll).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserPolls(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.sharePoll('poll-1');
    });

    expect(result.current.polls[0].share_count).toBe(3); // Increased from 2
    expect(DashboardService.sharePoll).toHaveBeenCalledWith(
      'poll-1',
      mockUserId
    );
  });

  it('should handle share poll errors', async () => {
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(mockPolls);
    const mockError = new Error('Failed to share poll');
    vi.mocked(DashboardService.sharePoll).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUserPolls(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.sharePoll('poll-1');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Failed to share poll');
    expect(result.current.polls[0].share_count).toBe(2); // Should not change on error
  });

  it('should refetch polls', async () => {
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(mockPolls);

    const { result } = renderHook(() => useUserPolls(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newPolls = [...mockPolls, { ...mockPolls[0], id: 'poll-3' }];
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(newPolls);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.polls).toEqual(newPolls);
    expect(DashboardService.getUserPolls).toHaveBeenCalledTimes(2);
  });

  it('should set up real-time subscription', async () => {
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(mockPolls);

    const { result, unmount } = renderHook(() => useUserPolls(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockSupabase.channel).toHaveBeenCalledWith('user-polls');
    expect(mockSupabase.channel().on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'polls',
        filter: `creator_id=eq.${mockUserId}`,
      }),
      expect.any(Function)
    );

    // Cleanup
    unmount();
  });

  it('should handle real-time poll updates', async () => {
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(mockPolls);

    const { result } = renderHook(() => useUserPolls(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get the real-time callback
    const realtimeCallback = mockSupabase.channel().on.mock.calls[0][2];

    // Simulate poll update
    const updatedPoll = { ...mockPolls[0], description: 'Updated description' };
    const payload = {
      eventType: 'UPDATE',
      new: updatedPoll,
      old: mockPolls[0],
    };

    act(() => {
      realtimeCallback(payload);
    });

    expect(result.current.polls[0].description).toBe('Updated description');
  });

  it('should handle real-time poll deletion', async () => {
    vi.mocked(DashboardService.getUserPolls).mockResolvedValue(mockPolls);

    const { result } = renderHook(() => useUserPolls(mockUserId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get the real-time callback
    const realtimeCallback = mockSupabase.channel().on.mock.calls[0][2];

    // Simulate poll deletion
    const payload = {
      eventType: 'DELETE',
      old: mockPolls[0],
    };

    act(() => {
      realtimeCallback(payload);
    });

    expect(result.current.polls).toHaveLength(1);
    expect(result.current.polls[0].id).toBe('poll-2');
  });
});
