import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      single: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: 'test-id' },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-id' },
            error: null,
          })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        error: null,
      })),
    })),
  })),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('PollsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get public polls', async () => {
    const { PollsService } = await import('@/lib/services/polls');
    const result = await PollsService.getPublicPolls();
    
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(result).toEqual([]);
  });

  it('should get poll by ID', async () => {
    const { PollsService } = await import('@/lib/services/polls');
    const result = await PollsService.getPollById('test-id');
    
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(result).toBeNull();
  });

  it('should create a poll', async () => {
    const { PollsService } = await import('@/lib/services/polls');
    const pollData = {
      creator_id: 'user-id',
      option_a_image_url: 'https://example.com/a.jpg',
      option_b_image_url: 'https://example.com/b.jpg',
    };

    const result = await PollsService.createPoll(pollData);
    
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(result).toEqual({ id: 'test-id' });
  });

  it('should update a poll', async () => {
    const { PollsService } = await import('@/lib/services/polls');
    const updates = { status: 'closed' as const };
    const result = await PollsService.updatePoll('test-id', updates);
    
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(result).toEqual({ id: 'test-id' });
  });

  it('should delete a poll', async () => {
    const { PollsService } = await import('@/lib/services/polls');
    await PollsService.deletePoll('test-id');
    
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
  });

  it('should get polls by creator', async () => {
    const { PollsService } = await import('@/lib/services/polls');
    const result = await PollsService.getPollsByCreator('creator-id');
    
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(result).toEqual([]);
  });
});
