import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: 'test-vote-id' },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-vote-id' },
            error: null,
          })),
        })),
      })),
    })),
  })),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('VotesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get votes by poll ID', async () => {
    const { VotesService } = await import('@/lib/services/votes');
    const result = await VotesService.getVotesByPollId('poll-id');
    
    expect(mockSupabase.from).toHaveBeenCalledWith('votes');
    expect(result).toEqual([]);
  });

  it('should get vote counts', async () => {
    const { VotesService } = await import('@/lib/services/votes');
    // Mock the select to return vote data
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [
            { choice: 'option_a' },
            { choice: 'option_b' },
            { choice: 'option_a' },
          ],
          error: null,
        })),
      })),
    });

    const result = await VotesService.getVoteCounts('poll-id');
    
    expect(result).toEqual({
      option_a: 2,
      option_b: 1,
    });
  });

  it('should submit a vote', async () => {
    const { VotesService } = await import('@/lib/services/votes');
    const voteData = {
      poll_id: 'poll-id',
      choice: 'option_a' as const,
    };

    const result = await VotesService.submitVote(voteData);
    
    expect(mockSupabase.from).toHaveBeenCalledWith('votes');
    expect(result).toEqual({ id: 'test-vote-id' });
  });

  it('should update a vote', async () => {
    const { VotesService } = await import('@/lib/services/votes');
    const result = await VotesService.updateVote('vote-id', 'option_b');
    
    expect(mockSupabase.from).toHaveBeenCalledWith('votes');
    expect(result).toEqual({ id: 'test-vote-id' });
  });

  it('should check if user has voted', async () => {
    const { VotesService } = await import('@/lib/services/votes');
    // Mock the select to return empty data (no vote)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    });

    const result = await VotesService.hasUserVoted('poll-id', 'user-id');
    
    expect(result).toBe(false);
  });
});
