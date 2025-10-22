import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadPollImage, deletePollImage } from '@/lib/storage/image-upload';

// Mock Supabase client
const mockSupabase = {
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      remove: vi.fn(),
    })),
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Image Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadPollImage', () => {
    it('uploads file successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const pollId = 'test-poll-id';
      const option = 'a' as const;

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test-poll-id-a.jpg' },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test-poll-id-a.jpg' },
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const result = await uploadPollImage(file, pollId, option);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/test-poll-id-a.jpg');
      expect(mockUpload).toHaveBeenCalledWith('test-poll-id-a.jpg', file, {
        cacheControl: '3600',
        upsert: false,
      });
    });

    it('handles upload errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const pollId = 'test-poll-id';
      const option = 'a' as const;

      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: vi.fn(),
      });

      const result = await uploadPollImage(file, pollId, option);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });

    it('handles unexpected errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const pollId = 'test-poll-id';
      const option = 'a' as const;

      mockSupabase.storage.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await uploadPollImage(file, pollId, option);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('deletePollImage', () => {
    it('deletes file successfully', async () => {
      const pollId = 'test-poll-id';
      const option = 'a' as const;

      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({
        remove: mockRemove,
      });

      const result = await deletePollImage(pollId, option);

      expect(result.success).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(['test-poll-id-a']);
    });

    it('handles delete errors', async () => {
      const pollId = 'test-poll-id';
      const option = 'a' as const;

      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });

      mockSupabase.storage.from.mockReturnValue({
        remove: mockRemove,
      });

      const result = await deletePollImage(pollId, option);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });
});
