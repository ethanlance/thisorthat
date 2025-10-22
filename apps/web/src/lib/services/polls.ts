import { createClient } from '@/lib/supabase/client';
import { Poll, PollInsert, PollUpdate } from '@/lib/supabase/types';
import { PollFormData } from '@/lib/validation/poll-validation';

const supabase = createClient();

export interface CreatePollData {
  creatorId: string;
  optionALabel?: string;
  optionBLabel?: string;
  description?: string;
  isPublic?: boolean;
}

export interface PollWithResults extends Poll {
  vote_counts: {
    option_a: number;
    option_b: number;
  };
  user_vote?: 'option_a' | 'option_b' | null;
}

export class PollsService {
  // Get all public polls
  static async getPublicPolls() {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get poll by ID with vote counts
  static async getPollById(
    id: string,
    userId?: string
  ): Promise<PollWithResults | null> {
    // Get poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollError || !poll) return null;

    // Get vote counts
    const { data: votes } = await supabase
      .from('votes')
      .select('choice')
      .eq('poll_id', id);

    const vote_counts = {
      option_a: votes?.filter(v => v.choice === 'option_a').length || 0,
      option_b: votes?.filter(v => v.choice === 'option_b').length || 0,
    };

    // Get user's vote if authenticated
    let user_vote = null;
    if (userId) {
      const { data: userVote } = await supabase
        .from('votes')
        .select('choice')
        .eq('poll_id', id)
        .eq('user_id', userId)
        .single();

      user_vote = userVote?.choice || null;
    }

    return {
      ...poll,
      vote_counts,
      user_vote,
    };
  }

  // Create a new poll with proper expiration
  static async createPoll(pollData: CreatePollData): Promise<Poll> {
    const { data, error } = await supabase
      .from('polls')
      .insert({
        creator_id: pollData.creatorId,
        option_a_label: pollData.optionALabel || null,
        option_b_label: pollData.optionBLabel || null,
        description: pollData.description || null,
        is_public: pollData.isPublic ?? true,
        status: 'active',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update poll with image URLs
  static async updatePollWithImages(
    id: string,
    optionAImageUrl: string,
    optionBImageUrl: string
  ): Promise<Poll> {
    const { data, error } = await supabase
      .from('polls')
      .update({
        option_a_image_url: optionAImageUrl,
        option_b_image_url: optionBImageUrl,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update a poll
  static async updatePoll(id: string, updates: PollUpdate) {
    const { data, error } = await supabase
      .from('polls')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a poll
  static async deletePoll(id: string) {
    const { error } = await supabase.from('polls').delete().eq('id', id);

    if (error) throw error;
  }

  // Get polls by creator
  static async getPollsByCreator(creatorId: string) {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Close expired polls
  static async closeExpiredPolls() {
    const { error } = await supabase
      .from('polls')
      .update({ status: 'closed' })
      .eq('status', 'active')
      .lte('expires_at', new Date().toISOString());

    if (error) throw error;
  }

  // Get polls that are expiring soon (within the next hour)
  static async getPollsExpiringSoon() {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('status', 'active')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', oneHourFromNow.toISOString())
      .order('expires_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Close a specific poll by ID
  static async closePoll(id: string) {
    const { error } = await supabase
      .from('polls')
      .update({ status: 'closed' })
      .eq('id', id);

    if (error) throw error;
  }

  // Get polls by status with vote counts
  static async getPollsByStatus(status: 'active' | 'closed' | 'deleted'): Promise<PollWithResults[]> {
    const { data: polls, error } = await supabase
      .from('polls')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!polls) return [];

    // Fetch vote counts for each poll
    const pollsWithVotes = await Promise.all(
      polls.map(async (poll) => {
        const { data: votes } = await supabase
          .from('votes')
          .select('choice')
          .eq('poll_id', poll.id);

        const vote_counts = {
          option_a: votes?.filter(v => v.choice === 'option_a').length || 0,
          option_b: votes?.filter(v => v.choice === 'option_b').length || 0,
        };

        return {
          ...poll,
          vote_counts,
        };
      })
    );

    return pollsWithVotes;
  }
}
