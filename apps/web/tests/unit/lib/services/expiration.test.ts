import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  checkAndUpdateExpiredPolls,
  getPollStatus,
  isPollExpired,
  isPollActive,
  calculateTimeLeft,
  formatTimeLeft,
  getExpirationWarningLevel,
  closePoll,
  getPollsExpiringSoon,
  TimeLeft
} from '@/lib/services/expiration';
import { Poll } from '@/lib/supabase/types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      lt: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }))
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('expiration service', () => {
  const createMockPoll = (overrides: Partial<Poll> = {}): Poll => ({
    id: 'poll-123',
    creator_id: 'user-123',
    option_a_image_url: 'https://example.com/image-a.jpg',
    option_a_label: 'Option A',
    option_b_image_url: 'https://example.com/image-b.jpg',
    option_b_label: 'Option B',
    description: 'Test poll',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    is_public: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAndUpdateExpiredPolls', () => {
    it('should update expired polls to closed status', async () => {
      const mockData = [{ id: 'poll-1' }, { id: 'poll-2' }];
      mockSupabase.from().update().lt().eq().select.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await checkAndUpdateExpiredPolls();
      
      expect(result).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    });

    it('should handle errors when updating polls', async () => {
      const mockError = new Error('Database error');
      mockSupabase.from().update().lt().eq().select.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(checkAndUpdateExpiredPolls()).rejects.toThrow('Database error');
    });
  });

  describe('getPollStatus', () => {
    it('should return closed for polls with closed status', () => {
      const poll = createMockPoll({ status: 'closed' });
      expect(getPollStatus(poll)).toBe('closed');
    });

    it('should return deleted for polls with deleted status', () => {
      const poll = createMockPoll({ status: 'deleted' });
      expect(getPollStatus(poll)).toBe('deleted');
    });

    it('should return closed for expired active polls', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const poll = createMockPoll({ 
        status: 'active',
        expires_at: pastDate
      });
      expect(getPollStatus(poll)).toBe('closed');
    });

    it('should return active for non-expired active polls', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
      const poll = createMockPoll({ 
        status: 'active',
        expires_at: futureDate
      });
      expect(getPollStatus(poll)).toBe('active');
    });
  });

  describe('isPollExpired', () => {
    it('should return true for expired polls', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const poll = createMockPoll({ 
        status: 'active',
        expires_at: pastDate
      });
      expect(isPollExpired(poll)).toBe(true);
    });

    it('should return false for active polls', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const poll = createMockPoll({ 
        status: 'active',
        expires_at: futureDate
      });
      expect(isPollExpired(poll)).toBe(false);
    });
  });

  describe('isPollActive', () => {
    it('should return true for active non-expired polls', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const poll = createMockPoll({ 
        status: 'active',
        expires_at: futureDate
      });
      expect(isPollActive(poll)).toBe(true);
    });

    it('should return false for expired polls', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const poll = createMockPoll({ 
        status: 'active',
        expires_at: pastDate
      });
      expect(isPollActive(poll)).toBe(false);
    });
  });

  describe('calculateTimeLeft', () => {
    it('should return null for expired timestamps', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      expect(calculateTimeLeft(pastDate)).toBeNull();
    });

    it('should calculate time left correctly', () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000).toISOString();
      const result = calculateTimeLeft(futureDate);
      
      expect(result).toEqual({
        days: 2,
        hours: 3,
        minutes: 30,
        seconds: 45,
        total: expect.any(Number)
      });
    });
  });

  describe('formatTimeLeft', () => {
    it('should format time with days', () => {
      const timeLeft: TimeLeft = {
        days: 2,
        hours: 3,
        minutes: 30,
        seconds: 45,
        total: 0
      };
      expect(formatTimeLeft(timeLeft)).toBe('2d 3h 30m');
    });

    it('should format time with hours only', () => {
      const timeLeft: TimeLeft = {
        days: 0,
        hours: 3,
        minutes: 30,
        seconds: 45,
        total: 0
      };
      expect(formatTimeLeft(timeLeft)).toBe('3h 30m 45s');
    });

    it('should format time with minutes only', () => {
      const timeLeft: TimeLeft = {
        days: 0,
        hours: 0,
        minutes: 30,
        seconds: 45,
        total: 0
      };
      expect(formatTimeLeft(timeLeft)).toBe('30m 45s');
    });

    it('should format time with seconds only', () => {
      const timeLeft: TimeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 45,
        total: 0
      };
      expect(formatTimeLeft(timeLeft)).toBe('45s');
    });
  });

  describe('getExpirationWarningLevel', () => {
    it('should return critical for time less than 5 minutes', () => {
      const timeLeft: TimeLeft = {
        days: 0,
        hours: 0,
        minutes: 3,
        seconds: 0,
        total: 3 * 60 * 1000
      };
      expect(getExpirationWarningLevel(timeLeft)).toBe('critical');
    });

    it('should return warning for time less than 30 minutes', () => {
      const timeLeft: TimeLeft = {
        days: 0,
        hours: 0,
        minutes: 15,
        seconds: 0,
        total: 15 * 60 * 1000
      };
      expect(getExpirationWarningLevel(timeLeft)).toBe('warning');
    });

    it('should return none for time more than 30 minutes', () => {
      const timeLeft: TimeLeft = {
        days: 0,
        hours: 1,
        minutes: 0,
        seconds: 0,
        total: 60 * 60 * 1000
      };
      expect(getExpirationWarningLevel(timeLeft)).toBe('none');
    });

    it('should return none for null time', () => {
      expect(getExpirationWarningLevel(null)).toBe('none');
    });
  });

  describe('closePoll', () => {
    it('should close a specific poll', async () => {
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      });

      await closePoll('poll-123');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    });

    it('should handle errors when closing poll', async () => {
      const mockError = new Error('Database error');
      mockSupabase.from().update().eq.mockResolvedValue({
        error: mockError
      });

      await expect(closePoll('poll-123')).rejects.toThrow('Database error');
    });
  });

  describe('getPollsExpiringSoon', () => {
    it('should get polls expiring within the next hour', async () => {
      const mockPolls = [createMockPoll(), createMockPoll({ id: 'poll-456' })];
      mockSupabase.from().select().eq().gte().lte().order.mockResolvedValue({
        data: mockPolls,
        error: null
      });

      const result = await getPollsExpiringSoon();
      
      expect(result).toEqual(mockPolls);
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    });

    it('should handle errors when getting expiring polls', async () => {
      const mockError = new Error('Database error');
      mockSupabase.from().select().eq().gte().lte().order.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(getPollsExpiringSoon()).rejects.toThrow('Database error');
    });
  });
});
