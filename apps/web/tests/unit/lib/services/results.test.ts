import { ResultsService } from '@/lib/services/results';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
};

const mockQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
};

describe('ResultsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as vi.Mock).mockReturnValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockQuery);
  });

  describe('getPollResults', () => {
    it('should return poll results with vote counts', async () => {
      const mockPoll = {
        id: 'poll-123',
        description: 'Test Poll',
        option_a_label: 'Option A',
        option_b_label: 'Option B',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        expires_at: '2023-01-02T00:00:00Z',
      };

      const mockVotes = [
        { choice: 'option_a', created_at: '2023-01-01T01:00:00Z' },
        { choice: 'option_b', created_at: '2023-01-01T02:00:00Z' },
        { choice: 'option_a', created_at: '2023-01-01T03:00:00Z' },
      ];

      mockQuery.single.mockResolvedValue({ data: mockPoll, error: null });
      mockQuery.eq.mockResolvedValue({ data: mockVotes, error: null });

      const result = await ResultsService.getPollResults('poll-123');

      expect(result).toEqual({
        poll: {
          id: 'poll-123',
          description: 'Test Poll',
          option_a_label: 'Option A',
          option_b_label: 'Option B',
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          expires_at: '2023-01-02T00:00:00Z',
        },
        voteCounts: { option_a: 2, option_b: 1 },
        totalVotes: 3,
        voteHistory: mockVotes,
      });
    });

    it('should return null if poll not found', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      });

      const result = await ResultsService.getPollResults('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockQuery.single.mockRejectedValue(new Error('Database error'));

      const result = await ResultsService.getPollResults('poll-123');

      expect(result).toBeNull();
    });
  });

  describe('getHistoricalResults', () => {
    it('should return historical poll results', async () => {
      const mockPolls = [
        {
          id: 'poll-1',
          description: 'Poll 1',
          option_a_label: 'Option A',
          option_b_label: 'Option B',
          status: 'closed',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'poll-2',
          description: 'Poll 2',
          option_a_label: 'Option A',
          option_b_label: 'Option B',
          status: 'closed',
          created_at: '2023-01-02T00:00:00Z',
        },
      ];

      const mockVotes1 = [
        { choice: 'option_a', created_at: '2023-01-01T01:00:00Z' },
        { choice: 'option_b', created_at: '2023-01-01T02:00:00Z' },
      ];

      const mockVotes2 = [
        { choice: 'option_a', created_at: '2023-01-02T01:00:00Z' },
      ];

      mockQuery.eq.mockResolvedValueOnce({ data: mockPolls, error: null });
      mockQuery.eq.mockResolvedValueOnce({ data: mockVotes1, error: null });
      mockQuery.eq.mockResolvedValueOnce({ data: mockVotes2, error: null });

      const result = await ResultsService.getHistoricalResults(10);

      expect(result).toHaveLength(2);
      expect(result[0].poll.id).toBe('poll-1');
      expect(result[0].voteCounts).toEqual({ option_a: 1, option_b: 1 });
      expect(result[1].poll.id).toBe('poll-2');
      expect(result[1].voteCounts).toEqual({ option_a: 1, option_b: 0 });
    });

    it('should return empty array if no polls found', async () => {
      mockQuery.eq.mockResolvedValue({ data: [], error: null });

      const result = await ResultsService.getHistoricalResults(10);

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockQuery.eq.mockRejectedValue(new Error('Database error'));

      const result = await ResultsService.getHistoricalResults(10);

      expect(result).toEqual([]);
    });
  });

  describe('getPollAnalytics', () => {
    it('should return poll analytics', async () => {
      const mockVotes = [
        { choice: 'option_a', created_at: '2023-01-01T10:00:00Z' },
        { choice: 'option_b', created_at: '2023-01-01T11:00:00Z' },
        { choice: 'option_a', created_at: '2023-01-01T12:00:00Z' },
        { choice: 'option_b', created_at: '2023-01-01T13:00:00Z' },
        { choice: 'option_a', created_at: '2023-01-01T14:00:00Z' },
      ];

      mockQuery.eq.mockResolvedValue({ data: mockVotes, error: null });

      const result = await ResultsService.getPollAnalytics('poll-123');

      expect(result).toEqual({
        totalVotes: 5,
        voteDistribution: { option_a: 3, option_b: 2 },
        voteTimeline: [{ date: '2023-01-01', votes: 5 }],
        peakVotingHour: 10, // First hour with votes
      });
    });

    it('should return null if no votes found', async () => {
      mockQuery.eq.mockResolvedValue({ data: [], error: null });

      const result = await ResultsService.getPollAnalytics('poll-123');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockQuery.eq.mockRejectedValue(new Error('Database error'));

      const result = await ResultsService.getPollAnalytics('poll-123');

      expect(result).toBeNull();
    });
  });
});
