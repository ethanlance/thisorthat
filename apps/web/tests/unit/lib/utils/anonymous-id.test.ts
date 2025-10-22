import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateAnonymousId,
  getStoredAnonymousId,
  storeAnonymousId,
  hasVotedAnonymously,
  clearAnonymousId,
  getAllStoredAnonymousIds,
  clearAllAnonymousIds,
  isValidAnonymousId,
  getAnonymousIdTimestamp,
  isAnonymousIdExpired
} from '@/lib/utils/anonymous-id';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('anonymous-id utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAnonymousId', () => {
    it('should generate a valid anonymous ID', () => {
      const id = generateAnonymousId();
      
      expect(id).toMatch(/^anon_\d+_[a-z0-9]+$/);
      expect(id.startsWith('anon_')).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = generateAnonymousId();
      const id2 = generateAnonymousId();
      
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp in the ID', () => {
      const before = Date.now();
      const id = generateAnonymousId();
      const after = Date.now();
      
      const timestamp = getAnonymousIdTimestamp(id);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('getStoredAnonymousId', () => {
    it('should return stored anonymous ID', () => {
      const pollId = 'poll-123';
      const anonymousId = 'anon_1234567890_abc123';
      
      localStorageMock.getItem.mockReturnValue(anonymousId);
      
      const result = getStoredAnonymousId(pollId);
      
      expect(result).toBe(anonymousId);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('anonymous_id_poll-123');
    });

    it('should return null if no ID is stored', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = getStoredAnonymousId('poll-123');
      
      expect(result).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const result = getStoredAnonymousId('poll-123');
      
      expect(result).toBeNull();
    });

    it('should return null on server side', () => {
      // Mock server side (no window)
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      const result = getStoredAnonymousId('poll-123');
      
      expect(result).toBeNull();
      
      // Restore window
      global.window = originalWindow;
    });
  });

  describe('storeAnonymousId', () => {
    it('should store anonymous ID', () => {
      const pollId = 'poll-123';
      const anonymousId = 'anon_1234567890_abc123';
      
      storeAnonymousId(pollId, anonymousId);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('anonymous_id_poll-123', anonymousId);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      expect(() => {
        storeAnonymousId('poll-123', 'anon_1234567890_abc123');
      }).not.toThrow();
    });

    it('should do nothing on server side', () => {
      // Mock server side (no window)
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      storeAnonymousId('poll-123', 'anon_1234567890_abc123');
      
      // Should not throw
      expect(true).toBe(true);
      
      // Restore window
      global.window = originalWindow;
    });
  });

  describe('hasVotedAnonymously', () => {
    it('should return true if anonymous ID is stored', () => {
      localStorageMock.getItem.mockReturnValue('anon_1234567890_abc123');
      
      const result = hasVotedAnonymously('poll-123');
      
      expect(result).toBe(true);
    });

    it('should return false if no anonymous ID is stored', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = hasVotedAnonymously('poll-123');
      
      expect(result).toBe(false);
    });
  });

  describe('clearAnonymousId', () => {
    it('should remove stored anonymous ID', () => {
      clearAnonymousId('poll-123');
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('anonymous_id_poll-123');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      expect(() => {
        clearAnonymousId('poll-123');
      }).not.toThrow();
    });
  });

  describe('getAllStoredAnonymousIds', () => {
    it('should return all stored anonymous IDs', () => {
      localStorageMock.length = 3;
      localStorageMock.key
        .mockReturnValueOnce('anonymous_id_poll-1')
        .mockReturnValueOnce('other_key')
        .mockReturnValueOnce('anonymous_id_poll-2');
      
      localStorageMock.getItem
        .mockReturnValueOnce('anon_123_abc')
        .mockReturnValueOnce('anon_456_def');
      
      const result = getAllStoredAnonymousIds();
      
      expect(result).toEqual({
        'poll-1': 'anon_123_abc',
        'poll-2': 'anon_456_def'
      });
    });

    it('should return empty object if no anonymous IDs found', () => {
      localStorageMock.length = 2;
      localStorageMock.key
        .mockReturnValueOnce('other_key_1')
        .mockReturnValueOnce('other_key_2');
      
      const result = getAllStoredAnonymousIds();
      
      expect(result).toEqual({});
    });
  });

  describe('clearAllAnonymousIds', () => {
    it('should clear all stored anonymous IDs', () => {
      localStorageMock.length = 3;
      localStorageMock.key
        .mockReturnValueOnce('anonymous_id_poll-1')
        .mockReturnValueOnce('other_key')
        .mockReturnValueOnce('anonymous_id_poll-2');
      
      clearAllAnonymousIds();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('anonymous_id_poll-1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('anonymous_id_poll-2');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other_key');
    });
  });

  describe('isValidAnonymousId', () => {
    it('should validate correct anonymous ID format', () => {
      expect(isValidAnonymousId('anon_1234567890_abc123')).toBe(true);
      expect(isValidAnonymousId('anon_0_xyz')).toBe(true);
    });

    it('should reject invalid anonymous ID formats', () => {
      expect(isValidAnonymousId('invalid_id')).toBe(false);
      expect(isValidAnonymousId('anon_abc_123')).toBe(false);
      expect(isValidAnonymousId('anon_123')).toBe(false);
      expect(isValidAnonymousId('anon_123_')).toBe(false);
      expect(isValidAnonymousId('anon__123_abc')).toBe(false);
      expect(isValidAnonymousId('')).toBe(false);
    });
  });

  describe('getAnonymousIdTimestamp', () => {
    it('should extract timestamp from valid anonymous ID', () => {
      const timestamp = 1234567890;
      const id = `anon_${timestamp}_abc123`;
      
      const result = getAnonymousIdTimestamp(id);
      
      expect(result).toBe(timestamp);
    });

    it('should return null for invalid anonymous ID', () => {
      expect(getAnonymousIdTimestamp('invalid_id')).toBeNull();
      expect(getAnonymousIdTimestamp('anon_abc_123')).toBeNull();
    });
  });

  describe('isAnonymousIdExpired', () => {
    it('should return false for recent anonymous ID', () => {
      const recentId = `anon_${Date.now()}_abc123`;
      
      expect(isAnonymousIdExpired(recentId)).toBe(false);
    });

    it('should return true for old anonymous ID', () => {
      const thirtyOneDaysAgo = Date.now() - (31 * 24 * 60 * 60 * 1000);
      const oldId = `anon_${thirtyOneDaysAgo}_abc123`;
      
      expect(isAnonymousIdExpired(oldId)).toBe(true);
    });

    it('should return true for invalid anonymous ID', () => {
      expect(isAnonymousIdExpired('invalid_id')).toBe(true);
    });
  });
});
