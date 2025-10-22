import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '@/lib/services/dashboard';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('DashboardService', () => {
  const mockUserId = 'user-123';
  const mockPoll = {
    id: 'poll-123',
    creator_id: 'user-123',
    option_a_image_url: 'https://example.com/image-a.jpg',
    option_a_label: 'Option A',
    option_b_image_url: 'https://example.com/image-b.jpg',
    option_b_label: 'Option B',
    description: 'Test poll',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_public: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserPolls', () => {
    it('should fetch user polls with vote counts and share data', async () => {
      const mockPolls = [mockPoll];
      const mockVotes = [
        { choice: 'option_a' },
        { choice: 'option_a' },
        { choice: 'option_b' },
      ];
      const mockShares = [{ id: 'share-1' }, { id: 'share-2' }];

      // Mock polls query
      mockSupabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockPolls,
        error: null,
      });

      // Mock votes query
      mockSupabase.from().select().eq().mockResolvedValueOnce({
        data: mockVotes,
        error: null,
      });

      // Mock shares query
      mockSupabase.from().select().eq().mockResolvedValueOnce({
        data: mockShares,
        error: null,
      });

      // Mock last vote query
      mockSupabase
        .from()
        .select()
        .eq()
        .order()
        .limit()
        .single.mockResolvedValueOnce({
          data: { created_at: new Date().toISOString() },
          error: null,
        });

      // Mock last share query
      mockSupabase
        .from()
        .select()
        .eq()
        .order()
        .limit()
        .single.mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const result = await DashboardService.getUserPolls(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ...mockPoll,
        vote_counts: {
          option_a: 2,
          option_b: 1,
        },
        share_count: 2,
      });
    });

    it('should handle errors when fetching polls', async () => {
      const mockError = new Error('Database error');
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(DashboardService.getUserPolls(mockUserId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getDashboardStats', () => {
    it('should calculate dashboard statistics correctly', async () => {
      const mockPolls = [
        { id: 'poll-1', status: 'active' },
        { id: 'poll-2', status: 'active' },
        { id: 'poll-3', status: 'closed' },
        { id: 'poll-4', status: 'deleted' },
      ];
      const mockVotes = [
        { id: 'vote-1' },
        { id: 'vote-2' },
        { id: 'vote-3' },
        { id: 'vote-4' },
        { id: 'vote-5' },
      ];

      // Mock polls query
      mockSupabase.from().select().eq().mockResolvedValueOnce({
        data: mockPolls,
        error: null,
      });

      // Mock votes query
      mockSupabase.from().select().in().mockResolvedValueOnce({
        data: mockVotes,
        error: null,
      });

      const result = await DashboardService.getDashboardStats(mockUserId);

      expect(result).toEqual({
        totalPolls: 4,
        activePolls: 2,
        closedPolls: 1,
        totalVotes: 5,
        averageVotesPerPoll: 1,
      });
    });

    it('should handle zero polls correctly', async () => {
      mockSupabase.from().select().eq().mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.from().select().in().mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await DashboardService.getDashboardStats(mockUserId);

      expect(result).toEqual({
        totalPolls: 0,
        activePolls: 0,
        closedPolls: 0,
        totalVotes: 0,
        averageVotesPerPoll: 0,
      });
    });
  });

  describe('getUserPollsByStatus', () => {
    it('should filter polls by status', async () => {
      const mockPolls = [
        { ...mockPoll, id: 'poll-1', status: 'active' },
        { ...mockPoll, id: 'poll-2', status: 'closed' },
        { ...mockPoll, id: 'poll-3', status: 'active' },
      ];

      // Mock getUserPolls
      vi.spyOn(DashboardService, 'getUserPolls').mockResolvedValue(
        mockPolls as any
      );

      const result = await DashboardService.getUserPollsByStatus(
        mockUserId,
        'active'
      );

      expect(result).toHaveLength(2);
      expect(result.every(poll => poll.status === 'active')).toBe(true);
    });
  });

  describe('deletePoll', () => {
    it('should delete poll and all related data', async () => {
      const pollId = 'poll-123';

      await DashboardService.deletePoll(pollId);

      // Should delete votes, shares, comments, and poll
      expect(mockSupabase.from).toHaveBeenCalledWith('votes');
      expect(mockSupabase.from).toHaveBeenCalledWith('poll_shares');
      expect(mockSupabase.from).toHaveBeenCalledWith('comments');
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    });

    it('should handle errors during deletion', async () => {
      const mockError = new Error('Delete error');
      mockSupabase.from().delete().eq.mockResolvedValue({
        error: mockError,
      });

      await expect(DashboardService.deletePoll('poll-123')).rejects.toThrow(
        'Delete error'
      );
    });
  });

  describe('sharePoll', () => {
    it('should create a share record', async () => {
      const pollId = 'poll-123';
      const sharedBy = 'user-123';
      const sharedWith = 'user-456';

      await DashboardService.sharePoll(pollId, sharedBy, sharedWith);

      expect(mockSupabase.from).toHaveBeenCalledWith('poll_shares');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        poll_id: pollId,
        user_id: sharedWith,
        shared_by: sharedBy,
      });
    });

    it('should handle errors during sharing', async () => {
      const mockError = new Error('Share error');
      mockSupabase.from().insert.mockResolvedValue({
        error: mockError,
      });

      await expect(
        DashboardService.sharePoll('poll-123', 'user-123')
      ).rejects.toThrow('Share error');
    });
  });

  describe('getPollShareUrl', () => {
    it('should return correct share URL', () => {
      const pollId = 'poll-123';

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'https://thisorthat.app',
        },
        writable: true,
      });

      const url = DashboardService.getPollShareUrl(pollId);
      expect(url).toBe('https://thisorthat.app/poll/poll-123');
    });

    it('should handle server-side rendering', () => {
      // Mock undefined window
      const originalWindow = global.window;
      delete (global as any).window;

      const pollId = 'poll-123';
      const url = DashboardService.getPollShareUrl(pollId);
      expect(url).toBe('https://thisorthat.app/poll/poll-123');

      // Restore window
      global.window = originalWindow;
    });
  });
});
