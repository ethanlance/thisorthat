import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PollsService } from '@/lib/services/polls';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            ascending: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'poll-123' }, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'poll-123' }, error: null }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('PollsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPublicPolls', () => {
    it('should fetch public polls successfully', async () => {
      const mockPolls = [
        { id: 'poll-1', is_public: true, status: 'active' },
        { id: 'poll-2', is_public: true, status: 'active' }
      ];
      
      mockSupabase.from().select().eq().eq().order().ascending.mockResolvedValue({
        data: mockPolls,
        error: null
      });

      const result = await PollsService.getPublicPolls();
      
      expect(result).toEqual(mockPolls);
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');
      mockSupabase.from().select().eq().eq().order().ascending.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(PollsService.getPublicPolls()).rejects.toThrow('Database error');
    });
  });

  describe('getPollById', () => {
    it('should fetch poll with vote counts successfully', async () => {
      const mockPoll = { id: 'poll-123', creator_id: 'user-123' };
      const mockVotes = [
        { choice: 'option_a' },
        { choice: 'option_a' },
        { choice: 'option_b' }
      ];
      const mockUserVote = { choice: 'option_a' };

      // Mock poll fetch
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      // Mock votes fetch
      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockVotes,
        error: null
      });

      // Mock user vote fetch
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: mockUserVote,
        error: null
      });

      const result = await PollsService.getPollById('poll-123', 'user-123');
      
      expect(result).toEqual({
        ...mockPoll,
        vote_counts: {
          option_a: 2,
          option_b: 1
        },
        user_vote: 'option_a'
      });
    });

    it('should return null when poll not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      });

      const result = await PollsService.getPollById('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should handle missing user vote gracefully', async () => {
      const mockPoll = { id: 'poll-123', creator_id: 'user-123' };
      const mockVotes = [{ choice: 'option_a' }];

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockPoll,
        error: null
      });

      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockVotes,
        error: null
      });

      // Mock user vote not found
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      });

      const result = await PollsService.getPollById('poll-123', 'user-123');
      
      expect(result?.user_vote).toBeNull();
    });
  });

  describe('createPoll', () => {
    it('should create poll with proper expiration', async () => {
      const pollData = {
        creatorId: 'user-123',
        optionALabel: 'Pizza',
        optionBLabel: 'Burger',
        description: 'What to eat?',
        isPublic: true
      };

      const mockCreatedPoll = { id: 'poll-123', ...pollData };
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockCreatedPoll,
        error: null
      });

      const result = await PollsService.createPoll(pollData);
      
      expect(result).toEqual(mockCreatedPoll);
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        creator_id: 'user-123',
        option_a_label: 'Pizza',
        option_b_label: 'Burger',
        description: 'What to eat?',
        is_public: true,
        status: 'active',
        expires_at: expect.any(String)
      });
    });

    it('should handle optional fields correctly', async () => {
      const pollData = {
        creatorId: 'user-123',
        isPublic: false
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'poll-123' },
        error: null
      });

      await PollsService.createPoll(pollData);
      
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        creator_id: 'user-123',
        option_a_label: null,
        option_b_label: null,
        description: null,
        is_public: false,
        status: 'active',
        expires_at: expect.any(String)
      });
    });

    it('should throw error when creation fails', async () => {
      const pollData = { creatorId: 'user-123' };
      const mockError = new Error('Creation failed');

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(PollsService.createPoll(pollData)).rejects.toThrow('Creation failed');
    });
  });

  describe('updatePollWithImages', () => {
    it('should update poll with image URLs', async () => {
      const mockUpdatedPoll = { id: 'poll-123', option_a_image_url: 'url-a', option_b_image_url: 'url-b' };
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedPoll,
        error: null
      });

      const result = await PollsService.updatePollWithImages('poll-123', 'url-a', 'url-b');
      
      expect(result).toEqual(mockUpdatedPoll);
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        option_a_image_url: 'url-a',
        option_b_image_url: 'url-b'
      });
    });
  });

  describe('getPollsByCreator', () => {
    it('should fetch polls by creator', async () => {
      const mockPolls = [
        { id: 'poll-1', creator_id: 'user-123' },
        { id: 'poll-2', creator_id: 'user-123' }
      ];

      mockSupabase.from().select().eq().order().ascending.mockResolvedValue({
        data: mockPolls,
        error: null
      });

      const result = await PollsService.getPollsByCreator('user-123');
      
      expect(result).toEqual(mockPolls);
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    });
  });

  describe('closeExpiredPolls', () => {
    it('should close expired polls', async () => {
      mockSupabase.from().update().eq().lte.mockResolvedValue({
        error: null
      });

      await PollsService.closeExpiredPolls();
      
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ status: 'closed' });
    });
  });
});