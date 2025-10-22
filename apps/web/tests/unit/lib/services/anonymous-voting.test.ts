import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnonymousVotingService } from '@/lib/services/anonymous-voting';
import { VotesService } from '@/lib/services/votes';
import * as anonymousIdUtils from '@/lib/utils/anonymous-id';

// Mock the dependencies
vi.mock('@/lib/services/votes');
vi.mock('@/lib/utils/anonymous-id');

describe('AnonymousVotingService', () => {
  const mockPollId = 'poll-123';
  const mockAnonymousId = 'anon_1234567890_abc123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitAnonymousVote', () => {
    it('should submit vote successfully with new anonymous ID', async () => {
      // Mock no stored ID
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(null);
      vi.mocked(anonymousIdUtils.generateAnonymousId).mockReturnValue(
        mockAnonymousId
      );
      vi.mocked(anonymousIdUtils.storeAnonymousId).mockImplementation(() => {});
      vi.mocked(anonymousIdUtils.isValidAnonymousId).mockReturnValue(true);
      vi.mocked(anonymousIdUtils.isAnonymousIdExpired).mockReturnValue(false);

      // Mock no existing vote
      vi.mocked(VotesService.getAnonymousVote).mockResolvedValue(null);

      // Mock successful vote submission
      vi.mocked(VotesService.submitVote).mockResolvedValue({
        success: true,
        voteId: 'vote-123',
      });

      const result = await AnonymousVotingService.submitAnonymousVote(
        mockPollId,
        'option_a'
      );

      expect(result.success).toBe(true);
      expect(result.anonymousId).toBe(mockAnonymousId);
      expect(anonymousIdUtils.generateAnonymousId).toHaveBeenCalled();
      expect(anonymousIdUtils.storeAnonymousId).toHaveBeenCalledWith(
        mockPollId,
        mockAnonymousId
      );
      expect(VotesService.submitVote).toHaveBeenCalledWith({
        pollId: mockPollId,
        choice: 'option_a',
        anonymousId: mockAnonymousId,
      });
    });

    it('should submit vote successfully with existing valid anonymous ID', async () => {
      // Mock existing valid ID
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(
        mockAnonymousId
      );
      vi.mocked(anonymousIdUtils.isValidAnonymousId).mockReturnValue(true);
      vi.mocked(anonymousIdUtils.isAnonymousIdExpired).mockReturnValue(false);

      // Mock no existing vote
      vi.mocked(VotesService.getAnonymousVote).mockResolvedValue(null);

      // Mock successful vote submission
      vi.mocked(VotesService.submitVote).mockResolvedValue({
        success: true,
        voteId: 'vote-123',
      });

      const result = await AnonymousVotingService.submitAnonymousVote(
        mockPollId,
        'option_b'
      );

      expect(result.success).toBe(true);
      expect(result.anonymousId).toBe(mockAnonymousId);
      expect(anonymousIdUtils.generateAnonymousId).not.toHaveBeenCalled();
      expect(VotesService.submitVote).toHaveBeenCalledWith({
        pollId: mockPollId,
        choice: 'option_b',
        anonymousId: mockAnonymousId,
      });
    });

    it('should generate new ID if existing ID is expired', async () => {
      const newAnonymousId = 'anon_9876543210_xyz789';

      // Mock expired existing ID
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(
        mockAnonymousId
      );
      vi.mocked(anonymousIdUtils.isValidAnonymousId).mockReturnValue(true);
      vi.mocked(anonymousIdUtils.isAnonymousIdExpired).mockReturnValue(true);
      vi.mocked(anonymousIdUtils.generateAnonymousId).mockReturnValue(
        newAnonymousId
      );
      vi.mocked(anonymousIdUtils.storeAnonymousId).mockImplementation(() => {});

      // Mock no existing vote
      vi.mocked(VotesService.getAnonymousVote).mockResolvedValue(null);

      // Mock successful vote submission
      vi.mocked(VotesService.submitVote).mockResolvedValue({
        success: true,
        voteId: 'vote-123',
      });

      const result = await AnonymousVotingService.submitAnonymousVote(
        mockPollId,
        'option_a'
      );

      expect(result.success).toBe(true);
      expect(result.anonymousId).toBe(newAnonymousId);
      expect(anonymousIdUtils.generateAnonymousId).toHaveBeenCalled();
      expect(anonymousIdUtils.storeAnonymousId).toHaveBeenCalledWith(
        mockPollId,
        newAnonymousId
      );
    });

    it('should return error if user has already voted', async () => {
      // Mock existing valid ID
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(
        mockAnonymousId
      );
      vi.mocked(anonymousIdUtils.isValidAnonymousId).mockReturnValue(true);
      vi.mocked(anonymousIdUtils.isAnonymousIdExpired).mockReturnValue(false);

      // Mock existing vote
      vi.mocked(VotesService.getAnonymousVote).mockResolvedValue('option_a');

      const result = await AnonymousVotingService.submitAnonymousVote(
        mockPollId,
        'option_b'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already voted on this poll');
      expect(result.anonymousId).toBe(mockAnonymousId);
      expect(VotesService.submitVote).not.toHaveBeenCalled();
    });

    it('should handle vote submission errors', async () => {
      // Mock existing valid ID
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(
        mockAnonymousId
      );
      vi.mocked(anonymousIdUtils.isValidAnonymousId).mockReturnValue(true);
      vi.mocked(anonymousIdUtils.isAnonymousIdExpired).mockReturnValue(false);

      // Mock no existing vote
      vi.mocked(VotesService.getAnonymousVote).mockResolvedValue(null);

      // Mock vote submission error
      vi.mocked(VotesService.submitVote).mockResolvedValue({
        success: false,
        error: 'Poll is closed',
      });

      const result = await AnonymousVotingService.submitAnonymousVote(
        mockPollId,
        'option_a'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Poll is closed');
    });

    it('should handle unexpected errors', async () => {
      // Mock error in getStoredAnonymousId
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockImplementation(
        () => {
          throw new Error('localStorage error');
        }
      );

      const result = await AnonymousVotingService.submitAnonymousVote(
        mockPollId,
        'option_a'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'An unexpected error occurred while submitting your vote'
      );
    });
  });

  describe('hasVotedAnonymously', () => {
    it('should return true if user has voted', () => {
      vi.mocked(anonymousIdUtils.hasVotedAnonymously).mockReturnValue(true);

      const result = AnonymousVotingService.hasVotedAnonymously(mockPollId);

      expect(result).toBe(true);
      expect(anonymousIdUtils.hasVotedAnonymously).toHaveBeenCalledWith(
        mockPollId
      );
    });

    it('should return false if user has not voted', () => {
      vi.mocked(anonymousIdUtils.hasVotedAnonymously).mockReturnValue(false);

      const result = AnonymousVotingService.hasVotedAnonymously(mockPollId);

      expect(result).toBe(false);
    });
  });

  describe('getAnonymousId', () => {
    it('should return stored anonymous ID', () => {
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(
        mockAnonymousId
      );

      const result = AnonymousVotingService.getAnonymousId(mockPollId);

      expect(result).toBe(mockAnonymousId);
      expect(anonymousIdUtils.getStoredAnonymousId).toHaveBeenCalledWith(
        mockPollId
      );
    });

    it('should return null if no ID is stored', () => {
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(null);

      const result = AnonymousVotingService.getAnonymousId(mockPollId);

      expect(result).toBeNull();
    });
  });

  describe('getAnonymousVote', () => {
    it('should return user vote if ID exists', async () => {
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(
        mockAnonymousId
      );
      vi.mocked(VotesService.getAnonymousVote).mockResolvedValue('option_a');

      const result = await AnonymousVotingService.getAnonymousVote(mockPollId);

      expect(result).toBe('option_a');
      expect(VotesService.getAnonymousVote).toHaveBeenCalledWith(
        mockPollId,
        mockAnonymousId
      );
    });

    it('should return null if no ID is stored', async () => {
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(null);

      const result = await AnonymousVotingService.getAnonymousVote(mockPollId);

      expect(result).toBeNull();
      expect(VotesService.getAnonymousVote).not.toHaveBeenCalled();
    });
  });

  describe('clearAnonymousData', () => {
    it('should clear anonymous data for poll', () => {
      vi.mocked(anonymousIdUtils.clearAnonymousId).mockImplementation(() => {});

      AnonymousVotingService.clearAnonymousData(mockPollId);

      expect(anonymousIdUtils.clearAnonymousId).toHaveBeenCalledWith(
        mockPollId
      );
    });
  });

  describe('generateNewAnonymousId', () => {
    it('should generate and store new anonymous ID', () => {
      vi.mocked(anonymousIdUtils.generateAnonymousId).mockReturnValue(
        mockAnonymousId
      );
      vi.mocked(anonymousIdUtils.storeAnonymousId).mockImplementation(() => {});

      const result = AnonymousVotingService.generateNewAnonymousId(mockPollId);

      expect(result).toBe(mockAnonymousId);
      expect(anonymousIdUtils.generateAnonymousId).toHaveBeenCalled();
      expect(anonymousIdUtils.storeAnonymousId).toHaveBeenCalledWith(
        mockPollId,
        mockAnonymousId
      );
    });
  });

  describe('validateAnonymousData', () => {
    it('should return validation results for stored data', () => {
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(
        mockAnonymousId
      );
      vi.mocked(anonymousIdUtils.isValidAnonymousId).mockReturnValue(true);
      vi.mocked(anonymousIdUtils.isAnonymousIdExpired).mockReturnValue(false);
      vi.mocked(anonymousIdUtils.hasVotedAnonymously).mockReturnValue(true);

      const result = AnonymousVotingService.validateAnonymousData(mockPollId);

      expect(result).toEqual({
        hasStoredId: true,
        isValidId: true,
        isExpired: false,
        hasVoted: true,
      });
    });

    it('should return validation results for no stored data', () => {
      vi.mocked(anonymousIdUtils.getStoredAnonymousId).mockReturnValue(null);
      vi.mocked(anonymousIdUtils.hasVotedAnonymously).mockReturnValue(false);

      const result = AnonymousVotingService.validateAnonymousData(mockPollId);

      expect(result).toEqual({
        hasStoredId: false,
        isValidId: false,
        isExpired: false,
        hasVoted: false,
      });
    });
  });

  describe('getAnonymousVotingStats', () => {
    it('should return voting statistics', () => {
      // Mock localStorage iteration
      const mockLocalStorage = {
        length: 3,
        key: vi
          .fn()
          .mockReturnValueOnce('anonymous_id_poll-1')
          .mockReturnValueOnce('other_key')
          .mockReturnValueOnce('anonymous_id_poll-2'),
        getItem: vi
          .fn()
          .mockReturnValueOnce('anon_123_abc')
          .mockReturnValueOnce('anon_456_def'),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      vi.mocked(anonymousIdUtils.isValidAnonymousId).mockReturnValue(true);
      vi.mocked(anonymousIdUtils.isAnonymousIdExpired).mockReturnValue(false);

      const result = AnonymousVotingService.getAnonymousVotingStats();

      expect(result).toEqual({
        totalStoredIds: 2,
        validIds: 2,
        expiredIds: 0,
        pollsWithVotes: 2,
      });
    });

    it('should return zero stats on server side', () => {
      // Mock server side (no window)
      const originalWindow = global.window;
      // @ts-expect-error - Testing invalid input
      delete global.window;

      const result = AnonymousVotingService.getAnonymousVotingStats();

      expect(result).toEqual({
        totalStoredIds: 0,
        validIds: 0,
        expiredIds: 0,
        pollsWithVotes: 0,
      });

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('cleanupExpiredIds', () => {
    it('should clean up expired IDs', () => {
      const mockLocalStorage = {
        length: 2,
        key: vi
          .fn()
          .mockReturnValueOnce('anonymous_id_poll-1')
          .mockReturnValueOnce('anonymous_id_poll-2'),
        getItem: vi
          .fn()
          .mockReturnValueOnce('anon_123_abc')
          .mockReturnValueOnce('anon_456_def'),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      vi.mocked(anonymousIdUtils.isAnonymousIdExpired)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = AnonymousVotingService.cleanupExpiredIds();

      expect(result).toBe(1);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'anonymous_id_poll-1'
      );
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith(
        'anonymous_id_poll-2'
      );
    });

    it('should return zero if no expired IDs found', () => {
      const mockLocalStorage = {
        length: 1,
        key: vi.fn().mockReturnValueOnce('anonymous_id_poll-1'),
        getItem: vi.fn().mockReturnValueOnce('anon_123_abc'),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      vi.mocked(anonymousIdUtils.isAnonymousIdExpired).mockReturnValue(false);

      const result = AnonymousVotingService.cleanupExpiredIds();

      expect(result).toBe(0);
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
