import { SharingService } from '@/lib/services/sharing';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

const mockSupabase = {
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn()
};

const mockQuery = {
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis()
};

describe('SharingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as vi.Mock).mockReturnValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockQuery);
  });

  describe('trackShare', () => {
    it('should track share analytics', async () => {
      mockQuery.insert.mockResolvedValue({ error: null });

      await SharingService.trackShare({
        pollId: 'poll-123',
        method: 'twitter',
        timestamp: '2023-01-01T00:00:00Z',
        userAgent: 'test-agent',
        referrer: 'https://example.com'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('poll_shares');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        poll_id: 'poll-123',
        method: 'twitter',
        created_at: '2023-01-01T00:00:00Z',
        user_agent: 'test-agent',
        referrer: 'https://example.com'
      });
    });

    it('should handle errors gracefully', async () => {
      mockQuery.insert.mockResolvedValue({ error: new Error('Database error') });

      await SharingService.trackShare({
        pollId: 'poll-123',
        method: 'twitter',
        timestamp: '2023-01-01T00:00:00Z'
      });

      // Should not throw error
      expect(mockQuery.insert).toHaveBeenCalled();
    });
  });

  describe('trackPollAccess', () => {
    it('should track poll access', async () => {
      mockQuery.insert.mockResolvedValue({ error: null });

      await SharingService.trackPollAccess({
        pollId: 'poll-123',
        referrer: 'https://example.com',
        userAgent: 'test-agent',
        timestamp: '2023-01-01T00:00:00Z'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('poll_access');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        poll_id: 'poll-123',
        referrer: 'https://example.com',
        user_agent: 'test-agent',
        created_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should handle errors gracefully', async () => {
      mockQuery.insert.mockResolvedValue({ error: new Error('Database error') });

      await SharingService.trackPollAccess({
        pollId: 'poll-123',
        timestamp: '2023-01-01T00:00:00Z'
      });

      // Should not throw error
      expect(mockQuery.insert).toHaveBeenCalled();
    });
  });

  describe('getPollAnalytics', () => {
    it('should return poll analytics', async () => {
      const mockShares = [
        { method: 'twitter', created_at: '2023-01-01T00:00:00Z' },
        { method: 'facebook', created_at: '2023-01-01T01:00:00Z' }
      ];

      const mockAccess = [
        { referrer: 'https://example.com', created_at: '2023-01-01T00:00:00Z' },
        { referrer: 'https://google.com', created_at: '2023-01-01T01:00:00Z' }
      ];

      mockQuery.eq.mockResolvedValueOnce({ data: mockShares, error: null });
      mockQuery.eq.mockResolvedValueOnce({ data: mockAccess, error: null });

      const result = await SharingService.getPollAnalytics('poll-123');

      expect(result).toEqual({
        totalShares: 2,
        totalAccess: 2,
        shareMethods: { twitter: 1, facebook: 1 },
        referrers: { 'https://example.com': 1, 'https://google.com': 1 },
        recentShares: [
          { method: 'twitter', timestamp: '2023-01-01T00:00:00Z' },
          { method: 'facebook', timestamp: '2023-01-01T01:00:00Z' }
        ],
        recentAccess: [
          { referrer: 'https://example.com', timestamp: '2023-01-01T00:00:00Z' },
          { referrer: 'https://google.com', timestamp: '2023-01-01T01:00:00Z' }
        ]
      });
    });

    it('should return null on error', async () => {
      mockQuery.eq.mockRejectedValue(new Error('Database error'));

      const result = await SharingService.getPollAnalytics('poll-123');

      expect(result).toBeNull();
    });
  });

  describe('generateShareableLink', () => {
    it('should generate shareable link', async () => {
      const link = await SharingService.generateShareableLink('poll-123');
      
      expect(link).toContain('/poll/poll-123');
    });
  });

  describe('generateShareText', () => {
    it('should generate share text with description', async () => {
      const text = await SharingService.generateShareText('Test Poll', 'Test Description');
      
      expect(text).toBe('Test Poll: Test Description');
    });

    it('should generate share text without description', async () => {
      const text = await SharingService.generateShareText('Test Poll');
      
      expect(text).toBe('Test Poll');
    });
  });

  describe('generateSocialShareUrls', () => {
    it('should generate social share URLs', async () => {
      const urls = await SharingService.generateSocialShareUrls('poll-123', 'Test Poll', 'Test Description');
      
      expect(urls.twitter).toContain('twitter.com/intent/tweet');
      expect(urls.facebook).toContain('facebook.com/sharer');
      expect(urls.whatsapp).toContain('wa.me');
      expect(urls.telegram).toContain('t.me/share');
    });
  });
});
