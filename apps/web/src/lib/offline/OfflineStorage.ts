import { Database } from '@/types/database';

export interface OfflinePoll {
  id: string;
  title: string;
  description?: string;
  option_a: string;
  option_b: string;
  image_a_url?: string;
  image_b_url?: string;
  created_at: string;
  expires_at?: string;
  is_public: boolean;
  creator_id: string;
  creator_name?: string;
  votes_count: number;
  option_a_votes: number;
  option_b_votes: number;
  user_vote?: 'option_a' | 'option_b';
  cached_at: string;
}

export interface OfflineVote {
  id: string;
  poll_id: string;
  choice: 'option_a' | 'option_b';
  user_id?: string;
  anonymous_id?: string;
  created_at: string;
  synced: boolean;
}

export interface OfflineDraft {
  id: string;
  title: string;
  description?: string;
  option_a: string;
  option_b: string;
  image_a_file?: File;
  image_b_file?: File;
  image_a_url?: string;
  image_b_url?: string;
  is_public: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface OfflineSyncQueue {
  votes: OfflineVote[];
  drafts: OfflineDraft[];
  last_sync: string;
}

export class OfflineStorage {
  private static instance: OfflineStorage;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ThisOrThatOffline';
  private readonly DB_VERSION = 1;

  private constructor() {
    this.initDB();
  }

  public static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create polls store
        if (!db.objectStoreNames.contains('polls')) {
          const pollsStore = db.createObjectStore('polls', { keyPath: 'id' });
          pollsStore.createIndex('cached_at', 'cached_at', { unique: false });
          pollsStore.createIndex('creator_id', 'creator_id', { unique: false });
        }

        // Create votes store
        if (!db.objectStoreNames.contains('votes')) {
          const votesStore = db.createObjectStore('votes', { keyPath: 'id' });
          votesStore.createIndex('poll_id', 'poll_id', { unique: false });
          votesStore.createIndex('synced', 'synced', { unique: false });
          votesStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // Create drafts store
        if (!db.objectStoreNames.contains('drafts')) {
          const draftsStore = db.createObjectStore('drafts', { keyPath: 'id' });
          draftsStore.createIndex('synced', 'synced', { unique: false });
          draftsStore.createIndex('created_at', 'created_at', {
            unique: false,
          });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  private async waitForDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const checkDB = () => {
        if (this.db) {
          resolve(this.db);
        } else {
          setTimeout(checkDB, 100);
        }
      };
      checkDB();
    });
  }

  // Poll Management
  public async cachePoll(poll: OfflinePoll): Promise<void> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['polls'], 'readwrite');
    const store = transaction.objectStore('polls');

    return new Promise((resolve, reject) => {
      const request = store.put(poll);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getCachedPoll(pollId: string): Promise<OfflinePoll | null> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['polls'], 'readonly');
    const store = transaction.objectStore('polls');

    return new Promise((resolve, reject) => {
      const request = store.get(pollId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async getCachedPolls(limit = 50): Promise<OfflinePoll[]> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['polls'], 'readonly');
    const store = transaction.objectStore('polls');
    const index = store.index('cached_at');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const polls: OfflinePoll[] = [];

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && polls.length < limit) {
          polls.push(cursor.value);
          cursor.continue();
        } else {
          resolve(polls);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async updatePollVotes(
    pollId: string,
    optionA: number,
    optionB: number,
    total: number
  ): Promise<void> {
    const poll = await this.getCachedPoll(pollId);
    if (poll) {
      poll.option_a_votes = optionA;
      poll.option_b_votes = optionB;
      poll.votes_count = total;
      await this.cachePoll(poll);
    }
  }

  // Vote Management
  public async saveOfflineVote(vote: OfflineVote): Promise<void> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['votes'], 'readwrite');
    const store = transaction.objectStore('votes');

    return new Promise((resolve, reject) => {
      const request = store.put(vote);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getOfflineVotes(pollId?: string): Promise<OfflineVote[]> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['votes'], 'readonly');
    const store = transaction.objectStore('votes');

    return new Promise((resolve, reject) => {
      const request = pollId
        ? store.index('poll_id').getAll(pollId)
        : store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async getUnsyncedVotes(): Promise<OfflineVote[]> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['votes'], 'readonly');
    const store = transaction.objectStore('votes');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async markVoteSynced(voteId: string): Promise<void> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['votes'], 'readwrite');
    const store = transaction.objectStore('votes');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(voteId);
      getRequest.onsuccess = () => {
        const vote = getRequest.result;
        if (vote) {
          vote.synced = true;
          const putRequest = store.put(vote);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Draft Management
  public async saveDraft(draft: OfflineDraft): Promise<void> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['drafts'], 'readwrite');
    const store = transaction.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const request = store.put(draft);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getDrafts(): Promise<OfflineDraft[]> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['drafts'], 'readonly');
    const store = transaction.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async getUnsyncedDrafts(): Promise<OfflineDraft[]> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['drafts'], 'readonly');
    const store = transaction.objectStore('drafts');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteDraft(draftId: string): Promise<void> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['drafts'], 'readwrite');
    const store = transaction.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const request = store.delete(draftId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings Management
  public async setSetting(key: string, value: any): Promise<void> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getSetting(key: string): Promise<any> {
    const db = await this.waitForDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // Storage Management
  public async getStorageUsage(): Promise<{
    used: number;
    quota: number;
    percentage: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;

      return { used, quota, percentage };
    }

    return { used: 0, quota: 0, percentage: 0 };
  }

  public async cleanupOldData(maxAge = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoffTime = new Date(Date.now() - maxAge).toISOString();

    // Clean up old cached polls
    const db = await this.waitForDB();
    const transaction = db.transaction(['polls'], 'readwrite');
    const store = transaction.objectStore('polls');
    const index = store.index('cached_at');

    return new Promise((resolve, reject) => {
      const request = index.openCursor();
      const deletePromises: Promise<void>[] = [];

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.cached_at < cutoffTime) {
            deletePromises.push(
              new Promise<void>((resolveDelete, rejectDelete) => {
                const deleteRequest = cursor.delete();
                deleteRequest.onsuccess = () => resolveDelete();
                deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
              })
            );
          }
          cursor.continue();
        } else {
          Promise.all(deletePromises)
            .then(() => resolve())
            .catch(reject);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async clearAllData(): Promise<void> {
    const db = await this.waitForDB();
    const stores = ['polls', 'votes', 'drafts', 'sync_queue', 'settings'];

    const clearPromises = stores.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(clearPromises);
  }
}
