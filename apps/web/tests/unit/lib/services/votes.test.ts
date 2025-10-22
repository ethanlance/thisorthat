import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VotesService } from '@/lib/services/votes';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: { id: 'vote-123' }, error: null })
        ),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('VotesService', () => {
  const mockPollId = 'poll-123';
  const mockUserId = 'user-123';
  const mockAnonymousId = 'anon-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitVote', () => {
    it('should submit a vote successfully for authenticated user', async () => {
      // Mock poll exists and is active
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            id: mockPollId,
            status: 'active',
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          error: null,
        });

      // Mock no existing vote
      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock vote insertion
      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValueOnce({
          data: { id: 'vote-123' },
          error: null,
        });

      const result = await VotesService.submitVote({
        pollId: mockPollId,
        choice: 'option_a',
        userId: mockUserId,
      });

      expect(result.success).toBe(true);
      expect(result.voteId).toBe('vote-123');
    });

    it('should submit a vote successfully for anonymous user', async () => {
      // Mock poll exists and is active
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            id: mockPollId,
            status: 'active',
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          error: null,
        });

      // Mock no existing vote
      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock vote insertion
      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValueOnce({
          data: { id: 'vote-123' },
          error: null,
        });

      const result = await VotesService.submitVote({
        pollId: mockPollId,
        choice: 'option_b',
        anonymousId: mockAnonymousId,
      });

      expect(result.success).toBe(true);
      expect(result.voteId).toBe('vote-123');
    });

    it('should return error for non-existent poll', async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: null,
          error: new Error('Poll not found'),
        });

      const result = await VotesService.submitVote({
        pollId: mockPollId,
        choice: 'option_a',
        userId: mockUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll not found');
    });

    it('should return error for closed poll', async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            id: mockPollId,
            status: 'closed',
            expires_at: new Date(
              Date.now() - 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          error: null,
        });

      const result = await VotesService.submitVote({
        pollId: mockPollId,
        choice: 'option_a',
        userId: mockUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll is no longer active');
    });

    it('should return error for expired poll', async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            id: mockPollId,
            status: 'active',
            expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
          },
          error: null,
        });

      const result = await VotesService.submitVote({
        pollId: mockPollId,
        choice: 'option_a',
        userId: mockUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll is no longer active');
    });

    it('should return error for duplicate vote', async () => {
      // Mock poll exists and is active
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            id: mockPollId,
            status: 'active',
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          error: null,
        });

      // Mock existing vote
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValueOnce({
          data: { id: 'existing-vote' },
          error: null,
        });

      const result = await VotesService.submitVote({
        pollId: mockPollId,
        choice: 'option_a',
        userId: mockUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already voted on this poll');
    });

    it('should return error when no user identification provided', async () => {
      const result = await VotesService.submitVote({
        pollId: mockPollId,
        choice: 'option_a',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User identification required');
    });
  });

  describe('getVoteCounts', () => {
    it('should return correct vote counts', async () => {
      const mockVotes = [
        { choice: 'option_a' },
        { choice: 'option_a' },
        { choice: 'option_b' },
        { choice: 'option_b' },
        { choice: 'option_b' },
      ];

      mockSupabase.from().select().eq().mockResolvedValueOnce({
        data: mockVotes,
        error: null,
      });

      const result = await VotesService.getVoteCounts(mockPollId);

      expect(result).toEqual({
        option_a: 2,
        option_b: 3,
      });
    });

    it('should handle errors gracefully', async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Database error'),
        });

      const result = await VotesService.getVoteCounts(mockPollId);

      expect(result).toEqual({
        option_a: 0,
        option_b: 0,
      });
    });
  });

  describe('getUserVote', () => {
    it('should return user vote when exists', async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValueOnce({
          data: { choice: 'option_a' },
          error: null,
        });

      const result = await VotesService.getUserVote(mockPollId, mockUserId);

      expect(result).toBe('option_a');
    });

    it('should return null when no vote exists', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await VotesService.getUserVote(mockPollId, mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getAnonymousVote', () => {
    it('should return anonymous vote when exists', async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValueOnce({
          data: { choice: 'option_b' },
          error: null,
        });

      const result = await VotesService.getAnonymousVote(
        mockPollId,
        mockAnonymousId
      );

      expect(result).toBe('option_b');
    });

    it('should return null when no vote exists', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await VotesService.getAnonymousVote(
        mockPollId,
        mockAnonymousId
      );

      expect(result).toBeNull();
    });
  });

  describe('getVotingStats', () => {
    it('should return correct voting statistics', async () => {
      const mockVotes = [
        { choice: 'option_a' },
        { choice: 'option_a' },
        { choice: 'option_b' },
      ];

      // Mock getVoteCounts
      mockSupabase.from().select().eq().mockResolvedValueOnce({
        data: mockVotes,
        error: null,
      });

      // Mock recent votes
      mockSupabase
        .from()
        .select()
        .eq()
        .gte()
        .mockResolvedValueOnce({
          data: [{ id: 'recent-vote' }],
          error: null,
        });

      const result = await VotesService.getVotingStats(mockPollId);

      expect(result).toEqual({
        totalVotes: 3,
        optionAPercentage: 67,
        optionBPercentage: 33,
        recentVotes: 1,
      });
    });
  });

  describe('deleteVote', () => {
    it('should delete vote successfully', async () => {
      mockSupabase.from().delete().eq().mockResolvedValueOnce({
        error: null,
      });

      const result = await VotesService.deleteVote('vote-123');

      expect(result).toBe(true);
    });

    it('should handle delete errors', async () => {
      mockSupabase
        .from()
        .delete()
        .eq()
        .mockResolvedValueOnce({
          error: new Error('Delete failed'),
        });

      const result = await VotesService.deleteVote('vote-123');

      expect(result).toBe(false);
    });
  });
});
