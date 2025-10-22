import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PollsService } from '@/lib/services/polls';
import {
  checkAndUpdateExpiredPolls,
  getPollStatus,
  isPollExpired,
  calculateTimeLeft,
  formatTimeLeft,
} from '@/lib/services/expiration';
import { Poll } from '@/lib/supabase/types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            ascending: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
    update: vi.fn(() => ({
      lt: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: { id: 'poll-123' }, error: null })
        ),
      })),
    })),
  })),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Poll Expiration Integration', () => {
  const createMockPoll = (overrides: Partial<Poll> = {}): Poll => ({
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
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Poll Creation with Expiration', () => {
    it('should create poll with 24-hour expiration', async () => {
      const pollData = {
        creatorId: 'user-123',
        optionALabel: 'Pizza',
        optionBLabel: 'Burger',
        description: 'What to eat?',
        isPublic: true,
      };

      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: { id: 'poll-123' },
          error: null,
        });

      const result = await PollsService.createPoll(pollData);

      expect(result.id).toBe('poll-123');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        creator_id: 'user-123',
        option_a_label: 'Pizza',
        option_b_label: 'Burger',
        description: 'What to eat?',
        is_public: true,
        status: 'active',
        expires_at: expect.any(String),
      });
    });
  });

  describe('Poll Status Management', () => {
    it('should identify active polls correctly', () => {
      const futureDate = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();
      const poll = createMockPoll({
        status: 'active',
        expires_at: futureDate,
      });

      expect(getPollStatus(poll)).toBe('active');
      expect(isPollExpired(poll)).toBe(false);
    });

    it('should identify expired polls correctly', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const poll = createMockPoll({
        status: 'active',
        expires_at: pastDate,
      });

      expect(getPollStatus(poll)).toBe('closed');
      expect(isPollExpired(poll)).toBe(true);
    });

    it('should respect explicit closed status', () => {
      const futureDate = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();
      const poll = createMockPoll({
        status: 'closed',
        expires_at: futureDate,
      });

      expect(getPollStatus(poll)).toBe('closed');
      expect(isPollExpired(poll)).toBe(true);
    });
  });

  describe('Time Calculations', () => {
    it('should calculate time left correctly', () => {
      const futureDate = new Date(
        Date.now() +
          2 * 24 * 60 * 60 * 1000 +
          3 * 60 * 60 * 1000 +
          30 * 60 * 1000 +
          45 * 1000
      ).toISOString();
      const timeLeft = calculateTimeLeft(futureDate);

      expect(timeLeft).toEqual({
        days: 2,
        hours: 3,
        minutes: 30,
        seconds: 45,
        total: expect.any(Number),
      });
    });

    it('should return null for expired timestamps', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const timeLeft = calculateTimeLeft(pastDate);

      expect(timeLeft).toBeNull();
    });

    it('should format time left correctly', () => {
      const timeLeft = {
        days: 1,
        hours: 2,
        minutes: 30,
        seconds: 45,
        total: 100000,
      };

      expect(formatTimeLeft(timeLeft)).toBe('1d 2h 30m');
    });
  });

  describe('Automatic Expiration', () => {
    it('should update expired polls to closed status', async () => {
      const mockData = [{ id: 'poll-1' }, { id: 'poll-2' }];
      mockSupabase.from().update().lt().eq().select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const updatedCount = await checkAndUpdateExpiredPolls();

      expect(updatedCount).toBe(2);
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'closed',
      });
    });

    it('should handle errors during expiration update', async () => {
      const mockError = new Error('Database error');
      mockSupabase.from().update().lt().eq().select.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(checkAndUpdateExpiredPolls()).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('Poll Service Integration', () => {
    it('should get polls expiring soon', async () => {
      const mockPolls = [createMockPoll(), createMockPoll({ id: 'poll-456' })];
      mockSupabase.from().select().eq().gte().lte().order.mockResolvedValue({
        data: mockPolls,
        error: null,
      });

      const result = await PollsService.getPollsExpiringSoon();

      expect(result).toEqual(mockPolls);
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    });

    it('should close specific poll', async () => {
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      });

      await PollsService.closePoll('poll-123');

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'closed',
      });
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith(
        'id',
        'poll-123'
      );
    });

    it('should get polls by status', async () => {
      const mockPolls = [createMockPoll(), createMockPoll({ id: 'poll-456' })];
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockPolls,
        error: null,
      });

      const result = await PollsService.getPollsByStatus('active');

      expect(result).toEqual(mockPolls);
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    });
  });

  describe('Edge Cases', () => {
    it('should handle polls with exactly current expiration time', () => {
      const now = new Date().toISOString();
      const poll = createMockPoll({
        status: 'active',
        expires_at: now,
      });

      // Should be considered expired
      expect(getPollStatus(poll)).toBe('closed');
      expect(isPollExpired(poll)).toBe(true);
    });

    it('should handle polls with null expiration time gracefully', () => {
      const poll = createMockPoll({
        status: 'active',
        expires_at: null as unknown as string,
      });

      // Should default to closed if no expiration time
      expect(getPollStatus(poll)).toBe('closed');
    });

    it('should handle deleted polls correctly', () => {
      const futureDate = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();
      const poll = createMockPoll({
        status: 'deleted',
        expires_at: futureDate,
      });

      expect(getPollStatus(poll)).toBe('deleted');
      expect(isPollExpired(poll)).toBe(true);
    });
  });
});
