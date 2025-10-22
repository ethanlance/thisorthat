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
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(null);
      (anonymousIdUtils.generateAnonymousId as any).mockReturnValue(
        mockAnonymousId
      );
      (anonymousIdUtils.storeAnonymousId as any).mockImplementation(() => {});
      (anonymousIdUtils.isValidAnonymousId as any).mockReturnValue(true);
      (anonymousIdUtils.isAnonymousIdExpired as any).mockReturnValue(false);

      // Mock no existing vote
      (VotesService.getAnonymousVote as any).mockResolvedValue(null);

      // Mock successful vote submission
      (VotesService.submitVote as any).mockResolvedValue({
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
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(
        mockAnonymousId
      );
      (anonymousIdUtils.isValidAnonymousId as any).mockReturnValue(true);
      (anonymousIdUtils.isAnonymousIdExpired as any).mockReturnValue(false);

      // Mock no existing vote
      (VotesService.getAnonymousVote as any).mockResolvedValue(null);

      // Mock successful vote submission
      (VotesService.submitVote as any).mockResolvedValue({
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
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(
        mockAnonymousId
      );
      (anonymousIdUtils.isValidAnonymousId as any).mockReturnValue(true);
      (anonymousIdUtils.isAnonymousIdExpired as any).mockReturnValue(true);
      (anonymousIdUtils.generateAnonymousId as any).mockReturnValue(
        newAnonymousId
      );
      (anonymousIdUtils.storeAnonymousId as any).mockImplementation(() => {});

      // Mock no existing vote
      (VotesService.getAnonymousVote as any).mockResolvedValue(null);

      // Mock successful vote submission
      (VotesService.submitVote as any).mockResolvedValue({
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
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(
        mockAnonymousId
      );
      (anonymousIdUtils.isValidAnonymousId as any).mockReturnValue(true);
      (anonymousIdUtils.isAnonymousIdExpired as any).mockReturnValue(false);

      // Mock existing vote
      (VotesService.getAnonymousVote as any).mockResolvedValue('option_a');

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
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(
        mockAnonymousId
      );
      (anonymousIdUtils.isValidAnonymousId as any).mockReturnValue(true);
      (anonymousIdUtils.isAnonymousIdExpired as any).mockReturnValue(false);

      // Mock no existing vote
      (VotesService.getAnonymousVote as any).mockResolvedValue(null);

      // Mock vote submission error
      (VotesService.submitVote as any).mockResolvedValue({
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
      (anonymousIdUtils.getStoredAnonymousId as any).mockImplementation(() => {
        throw new Error('localStorage error');
      });

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
      (anonymousIdUtils.hasVotedAnonymously as any).mockReturnValue(true);

      const result = AnonymousVotingService.hasVotedAnonymously(mockPollId);

      expect(result).toBe(true);
      expect(anonymousIdUtils.hasVotedAnonymously).toHaveBeenCalledWith(
        mockPollId
      );
    });

    it('should return false if user has not voted', () => {
      (anonymousIdUtils.hasVotedAnonymously as any).mockReturnValue(false);

      const result = AnonymousVotingService.hasVotedAnonymously(mockPollId);

      expect(result).toBe(false);
    });
  });

  describe('getAnonymousId', () => {
    it('should return stored anonymous ID', () => {
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(
        mockAnonymousId
      );

      const result = AnonymousVotingService.getAnonymousId(mockPollId);

      expect(result).toBe(mockAnonymousId);
      expect(anonymousIdUtils.getStoredAnonymousId).toHaveBeenCalledWith(
        mockPollId
      );
    });

    it('should return null if no ID is stored', () => {
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(null);

      const result = AnonymousVotingService.getAnonymousId(mockPollId);

      expect(result).toBeNull();
    });
  });

  describe('getAnonymousVote', () => {
    it('should return user vote if ID exists', async () => {
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(
        mockAnonymousId
      );
      (VotesService.getAnonymousVote as any).mockResolvedValue('option_a');

      const result = await AnonymousVotingService.getAnonymousVote(mockPollId);

      expect(result).toBe('option_a');
      expect(VotesService.getAnonymousVote).toHaveBeenCalledWith(
        mockPollId,
        mockAnonymousId
      );
    });

    it('should return null if no ID is stored', async () => {
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(null);

      const result = await AnonymousVotingService.getAnonymousVote(mockPollId);

      expect(result).toBeNull();
      expect(VotesService.getAnonymousVote).not.toHaveBeenCalled();
    });
  });

  describe('clearAnonymousData', () => {
    it('should clear anonymous data for poll', () => {
      (anonymousIdUtils.clearAnonymousId as any).mockImplementation(() => {});

      AnonymousVotingService.clearAnonymousData(mockPollId);

      expect(anonymousIdUtils.clearAnonymousId).toHaveBeenCalledWith(
        mockPollId
      );
    });
  });

  describe('generateNewAnonymousId', () => {
    it('should generate and store new anonymous ID', () => {
      (anonymousIdUtils.generateAnonymousId as any).mockReturnValue(
        mockAnonymousId
      );
      (anonymousIdUtils.storeAnonymousId as any).mockImplementation(() => {});

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
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(
        mockAnonymousId
      );
      (anonymousIdUtils.isValidAnonymousId as any).mockReturnValue(true);
      (anonymousIdUtils.isAnonymousIdExpired as any).mockReturnValue(false);
      (anonymousIdUtils.hasVotedAnonymously as any).mockReturnValue(true);

      const result = AnonymousVotingService.validateAnonymousData(mockPollId);

      expect(result).toEqual({
        hasStoredId: true,
        isValidId: true,
        isExpired: false,
        hasVoted: true,
      });
    });

    it('should return validation results for no stored data', () => {
      (anonymousIdUtils.getStoredAnonymousId as any).mockReturnValue(null);
      (anonymousIdUtils.hasVotedAnonymously as any).mockReturnValue(false);

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

      (anonymousIdUtils.isValidAnonymousId as any).mockReturnValue(true);
      (anonymousIdUtils.isAnonymousIdExpired as any).mockReturnValue(false);

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
      // @ts-ignore
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

      (anonymousIdUtils.isAnonymousIdExpired as any)
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

      (anonymousIdUtils.isAnonymousIdExpired as any).mockReturnValue(false);

      const result = AnonymousVotingService.cleanupExpiredIds();

      expect(result).toBe(0);
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
