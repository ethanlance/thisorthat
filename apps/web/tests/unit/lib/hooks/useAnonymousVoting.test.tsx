import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnonymousVoting } from '@/lib/hooks/useAnonymousVoting';
import { AnonymousVotingService } from '@/lib/services/anonymous-voting';

// Mock the AnonymousVotingService
vi.mock('@/lib/services/anonymous-voting');

describe('useAnonymousVoting', () => {
  const mockPollId = 'poll-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(false);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(null);

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    expect(result.current.hasVoted).toBe(false);
    expect(result.current.isVoting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.anonymousId).toBeNull();
    expect(result.current.userVote).toBeNull();
  });

  it('should initialize with voted state if user has already voted', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(true);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(
      'anon_123_abc'
    );
    (AnonymousVotingService.getAnonymousVote as any).mockResolvedValue(
      'option_a'
    );

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.hasVoted).toBe(true);
    });

    expect(result.current.anonymousId).toBe('anon_123_abc');
    expect(result.current.userVote).toBe('option_a');
  });

  it('should submit vote successfully', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(false);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(null);
    (AnonymousVotingService.submitAnonymousVote as any).mockResolvedValue({
      success: true,
      anonymousId: 'anon_123_abc',
    });

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.hasVoted).toBe(false);
    });

    let voteResult: boolean;
    await act(async () => {
      voteResult = await result.current.vote('option_a');
    });

    expect(voteResult!).toBe(true);
    expect(result.current.hasVoted).toBe(true);
    expect(result.current.userVote).toBe('option_a');
    expect(result.current.anonymousId).toBe('anon_123_abc');
    expect(result.current.error).toBeNull();
    expect(AnonymousVotingService.submitAnonymousVote).toHaveBeenCalledWith(
      mockPollId,
      'option_a'
    );
  });

  it('should handle vote submission failure', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(false);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(null);
    (AnonymousVotingService.submitAnonymousVote as any).mockResolvedValue({
      success: false,
      error: 'You have already voted on this poll',
    });

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.hasVoted).toBe(false);
    });

    let voteResult: boolean;
    await act(async () => {
      voteResult = await result.current.vote('option_b');
    });

    expect(voteResult!).toBe(false);
    expect(result.current.hasVoted).toBe(false);
    expect(result.current.error).toBe('You have already voted on this poll');
  });

  it('should prevent voting when already voted', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(true);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(
      'anon_123_abc'
    );
    (AnonymousVotingService.getAnonymousVote as any).mockResolvedValue(
      'option_a'
    );

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.hasVoted).toBe(true);
    });

    let voteResult: boolean;
    await act(async () => {
      voteResult = await result.current.vote('option_b');
    });

    expect(voteResult!).toBe(false);
    expect(AnonymousVotingService.submitAnonymousVote).not.toHaveBeenCalled();
  });

  it('should prevent voting when already voting', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(false);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(null);
    (AnonymousVotingService.submitAnonymousVote as any).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.hasVoted).toBe(false);
    });

    // Start first vote
    act(() => {
      result.current.vote('option_a');
    });

    expect(result.current.isVoting).toBe(true);

    // Try to vote again while voting
    let secondVoteResult: boolean;
    await act(async () => {
      secondVoteResult = await result.current.vote('option_b');
    });

    expect(secondVoteResult!).toBe(false);
    expect(AnonymousVotingService.submitAnonymousVote).toHaveBeenCalledTimes(1);
  });

  it('should handle vote submission errors', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(false);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(null);
    (AnonymousVotingService.submitAnonymousVote as any).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.hasVoted).toBe(false);
    });

    let voteResult: boolean;
    await act(async () => {
      voteResult = await result.current.vote('option_a');
    });

    expect(voteResult!).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.hasVoted).toBe(false);
  });

  it('should clear error when clearError is called', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(false);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(null);
    (AnonymousVotingService.submitAnonymousVote as any).mockResolvedValue({
      success: false,
      error: 'Vote failed',
    });

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.hasVoted).toBe(false);
    });

    // Submit vote to create error
    await act(async () => {
      await result.current.vote('option_a');
    });

    expect(result.current.error).toBe('Vote failed');

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should reset voting state when resetVotingState is called', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(true);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(
      'anon_123_abc'
    );
    (AnonymousVotingService.getAnonymousVote as any).mockResolvedValue(
      'option_a'
    );
    (AnonymousVotingService.clearAnonymousData as any).mockImplementation(
      () => {}
    );

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.hasVoted).toBe(true);
    });

    expect(result.current.anonymousId).toBe('anon_123_abc');
    expect(result.current.userVote).toBe('option_a');

    // Reset state
    act(() => {
      result.current.resetVotingState();
    });

    expect(result.current.hasVoted).toBe(false);
    expect(result.current.isVoting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.userVote).toBeNull();
    expect(result.current.anonymousId).toBeNull();
    expect(AnonymousVotingService.clearAnonymousData).toHaveBeenCalledWith(
      mockPollId
    );
  });

  it('should handle initialization errors gracefully', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockImplementation(
      () => {
        throw new Error('Initialization error');
      }
    );

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to initialize voting state');
    });

    expect(result.current.hasVoted).toBe(false);
  });

  it('should handle getAnonymousVote errors during initialization', async () => {
    (AnonymousVotingService.hasVotedAnonymously as any).mockReturnValue(true);
    (AnonymousVotingService.getAnonymousId as any).mockReturnValue(
      'anon_123_abc'
    );
    (AnonymousVotingService.getAnonymousVote as any).mockRejectedValue(
      new Error('Failed to get vote')
    );

    const { result } = renderHook(() => useAnonymousVoting(mockPollId));

    await waitFor(() => {
      expect(result.current.hasVoted).toBe(true);
    });

    expect(result.current.anonymousId).toBe('anon_123_abc');
    expect(result.current.userVote).toBeNull();
  });
});
