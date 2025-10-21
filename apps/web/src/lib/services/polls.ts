import { createClient } from '@/lib/supabase/client';
import { Poll, PollInsert, PollUpdate } from '@/lib/supabase/types';

const supabase = createClient();

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

  // Get poll by ID
  static async getPollById(id: string) {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create a new poll
  static async createPoll(poll: PollInsert) {
    const { data, error } = await supabase
      .from('polls')
      .insert(poll)
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
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', id);

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
}
