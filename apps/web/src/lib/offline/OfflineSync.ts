import { OfflineStorage, OfflineVote, OfflineDraft } from './OfflineStorage';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database';

type Poll = Database['public']['Tables']['polls']['Row'];
type Vote = Database['public']['Tables']['votes']['Row'];

export interface SyncResult {
  success: boolean;
  syncedVotes: number;
  syncedDrafts: number;
  errors: string[];
}

export interface ConflictResolution {
  strategy: 'server' | 'client' | 'merge' | 'manual';
  resolved: boolean;
  data: any;
}

export class OfflineSync {
  private static instance: OfflineSync;
  private storage: OfflineStorage;
  private supabase = createClient();
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  private constructor() {
    this.storage = OfflineStorage.getInstance();
    this.setupNetworkListeners();
  }

  public static getInstance(): OfflineSync {
    if (!OfflineSync.instance) {
      OfflineSync.instance = new OfflineSync();
    }
    return OfflineSync.instance;
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public async syncWhenOnline(): Promise<SyncResult> {
    if (!this.isOnline || this.syncInProgress) {
      return { success: false, syncedVotes: 0, syncedDrafts: 0, errors: ['Not online or sync in progress'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      syncedVotes: 0,
      syncedDrafts: 0,
      errors: []
    };

    try {
      // Sync votes first
      const voteResult = await this.syncVotes();
      result.syncedVotes = voteResult.synced;
      result.errors.push(...voteResult.errors);

      // Sync drafts
      const draftResult = await this.syncDrafts();
      result.syncedDrafts = draftResult.synced;
      result.errors.push(...draftResult.errors);

      // Update last sync time
      await this.storage.setSetting('last_sync', new Date().toISOString());

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async syncVotes(): Promise<{ synced: number; errors: string[] }> {
    const unsyncedVotes = await this.storage.getUnsyncedVotes();
    const errors: string[] = [];
    let synced = 0;

    for (const vote of unsyncedVotes) {
      try {
        const { data, error } = await this.supabase
          .from('votes')
          .insert({
            poll_id: vote.poll_id,
            choice: vote.choice,
            user_id: vote.user_id,
            anonymous_id: vote.anonymous_id,
          })
          .select()
          .single();

        if (error) {
          // Check for conflict (duplicate vote)
          if (error.code === '23505') {
            // Handle vote conflict
            const conflictResolution = await this.resolveVoteConflict(vote);
            if (conflictResolution.resolved) {
              await this.storage.markVoteSynced(vote.id);
              synced++;
            } else {
              errors.push(`Vote conflict for poll ${vote.poll_id}: ${error.message}`);
            }
          } else {
            errors.push(`Failed to sync vote for poll ${vote.poll_id}: ${error.message}`);
          }
        } else {
          await this.storage.markVoteSynced(vote.id);
          synced++;
        }
      } catch (error) {
        errors.push(`Vote sync error for poll ${vote.poll_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { synced, errors };
  }

  private async syncDrafts(): Promise<{ synced: number; errors: string[] }> {
    const unsyncedDrafts = await this.storage.getUnsyncedDrafts();
    const errors: string[] = [];
    let synced = 0;

    for (const draft of unsyncedDrafts) {
      try {
        // Upload images first if they exist
        let imageAUrl = draft.image_a_url;
        let imageBUrl = draft.image_b_url;

        if (draft.image_a_file) {
          imageAUrl = await this.uploadImage(draft.image_a_file);
        }
        if (draft.image_b_file) {
          imageBUrl = await this.uploadImage(draft.image_b_file);
        }

        // Create poll
        const { data, error } = await this.supabase
          .from('polls')
          .insert({
            title: draft.title,
            description: draft.description,
            option_a: draft.option_a,
            option_b: draft.option_b,
            image_a_url: imageAUrl,
            image_b_url: imageBUrl,
            is_public: draft.is_public,
            expires_at: draft.expires_at,
          })
          .select()
          .single();

        if (error) {
          errors.push(`Failed to sync draft "${draft.title}": ${error.message}`);
        } else {
          // Mark draft as synced and remove from local storage
          await this.storage.deleteDraft(draft.id);
          synced++;
        }
      } catch (error) {
        errors.push(`Draft sync error for "${draft.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { synced, errors };
  }

  private async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `poll-images/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('poll-images')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: { publicUrl } } = this.supabase.storage
      .from('poll-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  private async resolveVoteConflict(vote: OfflineVote): Promise<ConflictResolution> {
    // Get the server's current vote for this poll/user
    const { data: serverVote, error } = await this.supabase
      .from('votes')
      .select('*')
      .eq('poll_id', vote.poll_id)
      .or(`user_id.eq.${vote.user_id},anonymous_id.eq.${vote.anonymous_id}`)
      .single();

    if (error || !serverVote) {
      return { strategy: 'client', resolved: false, data: vote };
    }

    // If server vote is newer, use server version
    if (new Date(serverVote.created_at) > new Date(vote.created_at)) {
      return { strategy: 'server', resolved: true, data: serverVote };
    }

    // If client vote is newer, keep client version (already synced)
    return { strategy: 'client', resolved: true, data: vote };
  }

  public async downloadPollData(pollId: string): Promise<boolean> {
    try {
      const { data: poll, error } = await this.supabase
        .from('polls')
        .select(`
          *,
          votes(count),
          votes!inner(choice, count)
        `)
        .eq('id', pollId)
        .single();

      if (error || !poll) {
        return false;
      }

      // Get vote counts
      const { data: voteCounts } = await this.supabase
        .from('votes')
        .select('choice')
        .eq('poll_id', pollId);

      const optionAVotes = voteCounts?.filter(v => v.choice === 'option_a').length || 0;
      const optionBVotes = voteCounts?.filter(v => v.choice === 'option_b').length || 0;

      // Cache poll data
      const offlinePoll = {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        option_a: poll.option_a,
        option_b: poll.option_b,
        image_a_url: poll.image_a_url,
        image_b_url: poll.image_b_url,
        created_at: poll.created_at,
        expires_at: poll.expires_at,
        is_public: poll.is_public,
        creator_id: poll.creator_id,
        creator_name: poll.creator_name,
        votes_count: optionAVotes + optionBVotes,
        option_a_votes: optionAVotes,
        option_b_votes: optionBVotes,
        cached_at: new Date().toISOString(),
      };

      await this.storage.cachePoll(offlinePoll);
      return true;
    } catch (error) {
      console.error('Failed to download poll data:', error);
      return false;
    }
  }

  public async downloadRecentPolls(limit = 20): Promise<boolean> {
    try {
      const { data: polls, error } = await this.supabase
        .from('polls')
        .select(`
          *,
          votes(count),
          votes!inner(choice, count)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !polls) {
        return false;
      }

      // Cache each poll
      for (const poll of polls) {
        const { data: voteCounts } = await this.supabase
          .from('votes')
          .select('choice')
          .eq('poll_id', poll.id);

        const optionAVotes = voteCounts?.filter(v => v.choice === 'option_a').length || 0;
        const optionBVotes = voteCounts?.filter(v => v.choice === 'option_b').length || 0;

        const offlinePoll = {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          option_a: poll.option_a,
          option_b: poll.option_b,
          image_a_url: poll.image_a_url,
          image_b_url: poll.image_b_url,
          created_at: poll.created_at,
          expires_at: poll.expires_at,
          is_public: poll.is_public,
          creator_id: poll.creator_id,
          creator_name: poll.creator_name,
          votes_count: optionAVotes + optionBVotes,
          option_a_votes: optionAVotes,
          option_b_votes: optionBVotes,
          cached_at: new Date().toISOString(),
        };

        await this.storage.cachePoll(offlinePoll);
      }

      return true;
    } catch (error) {
      console.error('Failed to download recent polls:', error);
      return false;
    }
  }

  public async getLastSyncTime(): Promise<Date | null> {
    const lastSync = await this.storage.getSetting('last_sync');
    return lastSync ? new Date(lastSync) : null;
  }

  public async isSyncNeeded(): Promise<boolean> {
    const lastSync = await this.getLastSyncTime();
    if (!lastSync) return true;

    const now = new Date();
    const timeSinceSync = now.getTime() - lastSync.getTime();
    const syncInterval = 5 * 60 * 1000; // 5 minutes

    return timeSinceSync > syncInterval;
  }

  public async getSyncStatus(): Promise<{
    isOnline: boolean;
    lastSync: Date | null;
    pendingVotes: number;
    pendingDrafts: number;
    syncInProgress: boolean;
  }> {
    const pendingVotes = (await this.storage.getUnsyncedVotes()).length;
    const pendingDrafts = (await this.storage.getUnsyncedDrafts()).length;
    const lastSync = await this.getLastSyncTime();

    return {
      isOnline: this.isOnline,
      lastSync,
      pendingVotes,
      pendingDrafts,
      syncInProgress: this.syncInProgress,
    };
  }

  public async forceSync(): Promise<SyncResult> {
    return this.syncWhenOnline();
  }

  public async clearSyncQueue(): Promise<void> {
    const unsyncedVotes = await this.storage.getUnsyncedVotes();
    const unsyncedDrafts = await this.storage.getUnsyncedDrafts();

    // Mark all votes as synced (they'll be ignored)
    for (const vote of unsyncedVotes) {
      await this.storage.markVoteSynced(vote.id);
    }

    // Delete all drafts
    for (const draft of unsyncedDrafts) {
      await this.storage.deleteDraft(draft.id);
    }
  }
}
