import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePoll } from '@/lib/hooks/usePoll';
import { PollsService } from '@/lib/services/polls';
import { VotesService } from '@/lib/services/votes';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

// Mock the services
vi.mock('@/lib/services/polls');
vi.mock('@/lib/services/votes');
vi.mock('@/contexts/AuthContext');

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

describe('usePoll', () => {
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
    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
    vi.mocked(PollsService.getPollById).mockResolvedValue(mockPoll);
    vi.mocked(VotesService.submitVote).mockResolvedValue({
      success: true,
      voteId: 'vote-123',
    });
  });

  it('should fetch poll data on mount', async () => {
    const { result } = renderHook(() => usePoll(mockPollId));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.poll).toEqual(mockPoll);
    expect(result.current.hasVoted).toBe(false);
    expect(result.current.userVote).toBeNull();
    expect(PollsService.getPollById).toHaveBeenCalledWith(
      mockPollId,
      mockUser.id
    );
  });

  it('should handle poll not found', async () => {
    vi.mocked(PollsService.getPollById).mockResolvedValue(null);

    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.poll).toBeNull();
    expect(result.current.error).toBe('Poll not found');
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch poll');
    vi.mocked(PollsService.getPollById).mockRejectedValue(mockError);

    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.poll).toBeNull();
    expect(result.current.error).toBe('Failed to fetch poll');
  });

  it('should handle voting successfully', async () => {
    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const success = await result.current.vote('option_a');
      expect(success).toBe(true);
    });

    expect(result.current.hasVoted).toBe(true);
    expect(result.current.userVote).toBe('option_a');
    expect(VotesService.submitVote).toHaveBeenCalledWith({
      pollId: mockPollId,
      choice: 'option_a',
      userId: mockUser.id,
      anonymousId: undefined,
    });
  });

  it('should handle voting for anonymous user', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null });

    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const success = await result.current.vote('option_b');
      expect(success).toBe(true);
    });

    expect(result.current.hasVoted).toBe(true);
    expect(result.current.userVote).toBe('option_b');
    expect(VotesService.submitVote).toHaveBeenCalledWith({
      pollId: mockPollId,
      choice: 'option_b',
      userId: undefined,
      anonymousId: expect.stringMatching(/^anon_\d+_[a-z0-9]+$/),
    });
  });

  it('should handle voting errors', async () => {
    vi.mocked(VotesService.submitVote).mockResolvedValue({
      success: false,
      error: 'Vote failed',
    });

    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const success = await result.current.vote('option_a');
      expect(success).toBe(false);
    });

    expect(result.current.hasVoted).toBe(false);
    expect(result.current.error).toBe('Vote failed');
  });

  it('should prevent voting when already voted', async () => {
    const pollWithVote = { ...mockPoll, user_vote: 'option_a' };
    vi.mocked(PollsService.getPollById).mockResolvedValue(pollWithVote);

    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasVoted).toBe(true);
    expect(result.current.userVote).toBe('option_a');

    await act(async () => {
      const success = await result.current.vote('option_b');
      expect(success).toBe(false);
    });

    expect(VotesService.submitVote).not.toHaveBeenCalled();
  });

  it('should prevent voting when already voting', async () => {
    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Start voting
    act(() => {
      result.current.vote('option_a');
    });

    expect(result.current.isVoting).toBe(true);

    // Try to vote again while voting
    await act(async () => {
      const success = await result.current.vote('option_b');
      expect(success).toBe(false);
    });

    // Should only have called submitVote once
    expect(VotesService.submitVote).toHaveBeenCalledTimes(1);
  });

  it('should update poll data after successful vote', async () => {
    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.vote('option_a');
    });

    // Poll should be updated with new vote count and user vote
    expect(result.current.poll?.vote_counts.option_a).toBe(6); // 5 + 1
    expect(result.current.poll?.vote_counts.option_b).toBe(3); // unchanged
    expect(result.current.poll?.user_vote).toBe('option_a');
  });

  it('should set up real-time subscription', async () => {
    const { result, unmount } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockSupabase.channel).toHaveBeenCalledWith('poll-updates');
    expect(mockSupabase.channel().on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'polls',
        filter: `id=eq.${mockPollId}`,
      }),
      expect.any(Function)
    );

    // Cleanup
    unmount();
  });

  it('should handle real-time poll updates', async () => {
    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get the real-time callback
    const realtimeCallback = mockSupabase.channel().on.mock.calls[0][2];

    // Simulate poll update
    const updatedPoll = { ...mockPoll, description: 'Updated description' };
    const payload = {
      eventType: 'UPDATE',
      new: updatedPoll,
      old: mockPoll,
    };

    act(() => {
      realtimeCallback(payload);
    });

    // Should trigger refetch
    expect(PollsService.getPollById).toHaveBeenCalledTimes(2);
  });

  it('should handle real-time vote updates', async () => {
    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get the vote update callback
    const voteCallback = mockSupabase.channel().on.mock.calls[1][2];

    // Simulate new vote
    const payload = {
      eventType: 'INSERT',
      new: { choice: 'option_a' },
    };

    act(() => {
      voteCallback(payload);
    });

    // Vote count should be updated
    expect(result.current.poll?.vote_counts.option_a).toBe(6); // 5 + 1
    expect(result.current.poll?.vote_counts.option_b).toBe(3); // unchanged
  });

  it('should handle poll deletion', async () => {
    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get the real-time callback
    const realtimeCallback = mockSupabase.channel().on.mock.calls[0][2];

    // Simulate poll deletion
    const payload = {
      eventType: 'DELETE',
      old: mockPoll,
    };

    act(() => {
      realtimeCallback(payload);
    });

    expect(result.current.error).toBe('Poll has been deleted');
  });

  it('should refetch poll data', async () => {
    const { result } = renderHook(() => usePoll(mockPollId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(PollsService.getPollById).toHaveBeenCalledTimes(2);
  });
});
