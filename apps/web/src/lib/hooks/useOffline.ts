import { useState, useEffect, useCallback } from 'react';
import { OfflineStorage } from '@/lib/offline/OfflineStorage';
import { OfflineSync } from '@/lib/offline/OfflineSync';
import {
  OfflinePoll,
  OfflineVote,
  OfflineDraft,
} from '@/lib/offline/OfflineStorage';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    lastSync: null as Date | null,
    pendingVotes: 0,
    pendingDrafts: 0,
    syncInProgress: false,
  });

  const offlineStorage = OfflineStorage.getInstance();
  const offlineSync = OfflineSync.getInstance();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateSyncStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateSyncStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updateSyncStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateSyncStatus = useCallback(async () => {
    const status = await offlineSync.getSyncStatus();
    setSyncStatus(status);
  }, [offlineSync]);

  const syncWhenOnline = useCallback(async () => {
    const result = await offlineSync.syncWhenOnline();
    await updateSyncStatus();
    return result;
  }, [offlineSync, updateSyncStatus]);

  return {
    isOnline,
    syncStatus,
    updateSyncStatus,
    syncWhenOnline,
  };
}

export function useOfflinePolls() {
  const [polls, setPolls] = useState<OfflinePoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offlineStorage = OfflineStorage.getInstance();
  const offlineSync = OfflineSync.getInstance();

  const loadPolls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cachedPolls = await offlineStorage.getCachedPolls();
      setPolls(cachedPolls);
    } catch (err) {
      setError('Failed to load offline polls');
      console.error('Error loading offline polls:', err);
    } finally {
      setLoading(false);
    }
  }, [offlineStorage]);

  const downloadRecentPolls = useCallback(async () => {
    try {
      const success = await offlineSync.downloadRecentPolls();
      if (success) {
        await loadPolls();
      }
      return success;
    } catch (err) {
      console.error('Error downloading recent polls:', err);
      return false;
    }
  }, [offlineSync, loadPolls]);

  const downloadPoll = useCallback(
    async (pollId: string) => {
      try {
        const success = await offlineSync.downloadPollData(pollId);
        if (success) {
          await loadPolls();
        }
        return success;
      } catch (err) {
        console.error('Error downloading poll:', err);
        return false;
      }
    },
    [offlineSync, loadPolls]
  );

  const getPoll = useCallback(
    async (pollId: string) => {
      try {
        const poll = await offlineStorage.getCachedPoll(pollId);
        return poll;
      } catch (err) {
        console.error('Error getting poll:', err);
        return null;
      }
    },
    [offlineStorage]
  );

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  return {
    polls,
    loading,
    error,
    loadPolls,
    downloadRecentPolls,
    downloadPoll,
    getPoll,
  };
}

export function useOfflineVoting() {
  const [userVotes, setUserVotes] = useState<Map<string, OfflineVote>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  const offlineStorage = OfflineStorage.getInstance();

  const loadUserVotes = useCallback(async () => {
    try {
      setLoading(true);
      const votes = await offlineStorage.getOfflineVotes();
      const voteMap = new Map();
      votes.forEach(vote => {
        voteMap.set(vote.poll_id, vote);
      });
      setUserVotes(voteMap);
    } catch (err) {
      console.error('Error loading user votes:', err);
    } finally {
      setLoading(false);
    }
  }, [offlineStorage]);

  const vote = useCallback(
    async (
      pollId: string,
      choice: 'option_a' | 'option_b',
      userId?: string,
      anonymousId?: string
    ) => {
      try {
        const vote: OfflineVote = {
          id: `offline_${Date.now()}_${Math.random()}`,
          poll_id: pollId,
          choice,
          user_id: userId,
          anonymous_id: anonymousId,
          created_at: new Date().toISOString(),
          synced: false,
        };

        await offlineStorage.saveOfflineVote(vote);

        // Update local state
        setUserVotes(prev => new Map(prev.set(pollId, vote)));

        return vote;
      } catch (err) {
        console.error('Error saving vote:', err);
        throw err;
      }
    },
    [offlineStorage]
  );

  const getUserVote = useCallback(
    (pollId: string) => {
      return userVotes.get(pollId);
    },
    [userVotes]
  );

  const hasVoted = useCallback(
    (pollId: string) => {
      return userVotes.has(pollId);
    },
    [userVotes]
  );

  useEffect(() => {
    loadUserVotes();
  }, [loadUserVotes]);

  return {
    userVotes,
    loading,
    vote,
    getUserVote,
    hasVoted,
    loadUserVotes,
  };
}

export function useOfflineDrafts() {
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offlineStorage = OfflineStorage.getInstance();

  const loadDrafts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const draftList = await offlineStorage.getDrafts();
      setDrafts(draftList);
    } catch (err) {
      setError('Failed to load drafts');
      console.error('Error loading drafts:', err);
    } finally {
      setLoading(false);
    }
  }, [offlineStorage]);

  const saveDraft = useCallback(
    async (draft: OfflineDraft) => {
      try {
        await offlineStorage.saveDraft(draft);
        await loadDrafts();
      } catch (err) {
        setError('Failed to save draft');
        console.error('Error saving draft:', err);
        throw err;
      }
    },
    [offlineStorage, loadDrafts]
  );

  const deleteDraft = useCallback(
    async (draftId: string) => {
      try {
        await offlineStorage.deleteDraft(draftId);
        await loadDrafts();
      } catch (err) {
        setError('Failed to delete draft');
        console.error('Error deleting draft:', err);
        throw err;
      }
    },
    [offlineStorage, loadDrafts]
  );

  const getDraft = useCallback(
    async (draftId: string) => {
      try {
        const drafts = await offlineStorage.getDrafts();
        return drafts.find(d => d.id === draftId) || null;
      } catch (err) {
        console.error('Error getting draft:', err);
        return null;
      }
    },
    [offlineStorage]
  );

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  return {
    drafts,
    loading,
    error,
    loadDrafts,
    saveDraft,
    deleteDraft,
    getDraft,
  };
}

export function useOfflineStorage() {
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    quota: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  const offlineStorage = OfflineStorage.getInstance();

  const updateStorageUsage = useCallback(async () => {
    try {
      setLoading(true);
      const usage = await offlineStorage.getStorageUsage();
      setStorageUsage(usage);
    } catch (err) {
      console.error('Error getting storage usage:', err);
    } finally {
      setLoading(false);
    }
  }, [offlineStorage]);

  const cleanupOldData = useCallback(
    async (maxAge = 7 * 24 * 60 * 60 * 1000) => {
      try {
        await offlineStorage.cleanupOldData(maxAge);
        await updateStorageUsage();
      } catch (err) {
        console.error('Error cleaning up old data:', err);
        throw err;
      }
    },
    [offlineStorage, updateStorageUsage]
  );

  const clearAllData = useCallback(async () => {
    try {
      await offlineStorage.clearAllData();
      await updateStorageUsage();
    } catch (err) {
      console.error('Error clearing all data:', err);
      throw err;
    }
  }, [offlineStorage, updateStorageUsage]);

  useEffect(() => {
    updateStorageUsage();
  }, [updateStorageUsage]);

  return {
    storageUsage,
    loading,
    updateStorageUsage,
    cleanupOldData,
    clearAllData,
  };
}
