import { createClient } from '@/lib/supabase/client';

interface PollCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PollTag {
  id: string;
  name: string;
  description: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedPoll {
  poll_id: string;
  creator_id: string;
  option_a_image_url: string;
  option_a_label: string | null;
  option_b_image_url: string;
  option_b_label: string | null;
  description: string | null;
  expires_at: string;
  is_public: boolean;
  privacy_level: 'public' | 'private' | 'group';
  created_at: string;
  engagement_score: number;
  trending_score: number;
  popularity_score: number;
  categories: string[];
  tags: string[];
}

export interface SearchPoll {
  poll_id: string;
  creator_id: string;
  option_a_image_url: string;
  option_a_label: string | null;
  option_b_image_url: string;
  option_b_label: string | null;
  description: string | null;
  expires_at: string;
  is_public: boolean;
  privacy_level: 'public' | 'private' | 'group';
  created_at: string;
  engagement_score: number;
  relevance_score: number;
  categories: string[];
  tags: string[];
}

export interface FeedPreferences {
  preferred_categories: string[];
  preferred_tags: string[];
  excluded_categories: string[];
  excluded_tags: string[];
  feed_algorithm:
    | 'chronological'
    | 'popular'
    | 'trending'
    | 'personalized'
    | 'mixed';
  show_following_only: boolean;
  show_public_only: boolean;
}

export interface SearchFilters {
  categories?: string[];
  tags?: string[];
  sort_by?: 'relevance' | 'trending' | 'popular' | 'newest';
  date_range?: 'all' | 'today' | 'week' | 'month';
}

export class FeedService {
  /**
   * Get personalized feed for user
   */
  static async getPersonalizedFeed(
    limit: number = 20,
    offset: number = 0
  ): Promise<FeedPoll[]> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_personalized_feed', {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error fetching personalized feed:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPersonalizedFeed:', error);
      return [];
    }
  }

  /**
   * Get trending polls
   */
  static async getTrendingPolls(
    limit: number = 20,
    offset: number = 0
  ): Promise<FeedPoll[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_trending_polls', {
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error fetching trending polls:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTrendingPolls:', error);
      return [];
    }
  }

  /**
   * Search polls with filters
   */
  static async searchPolls(
    searchTerm: string,
    filters: SearchFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchPoll[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('search_polls', {
        p_search_term: searchTerm,
        p_categories: filters.categories || null,
        p_tags: filters.tags || null,
        p_sort_by: filters.sort_by || 'relevance',
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error searching polls:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchPolls:', error);
      return [];
    }
  }

  /**
   * Get poll categories
   */
  static async getPollCategories(): Promise<PollCategory[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('poll_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching poll categories:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPollCategories:', error);
      return [];
    }
  }

  /**
   * Get poll tags
   */
  static async getPollTags(): Promise<PollTag[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('poll_tags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Error fetching poll tags:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPollTags:', error);
      return [];
    }
  }

  /**
   * Get user feed preferences
   */
  static async getFeedPreferences(): Promise<FeedPreferences | null> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_feed_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return default
          return {
            preferred_categories: [],
            preferred_tags: [],
            excluded_categories: [],
            excluded_tags: [],
            feed_algorithm: 'mixed',
            show_following_only: false,
            show_public_only: true,
          };
        }
        console.error('Error fetching feed preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getFeedPreferences:', error);
      return null;
    }
  }

  /**
   * Update user feed preferences
   */
  static async updateFeedPreferences(
    preferences: Partial<FeedPreferences>
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { error } = await supabase.from('user_feed_preferences').upsert({
        user_id: user.id,
        ...preferences,
      });

      if (error) {
        console.error('Error updating feed preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateFeedPreferences:', error);
      return false;
    }
  }

  /**
   * Track user interaction with poll
   */
  static async trackInteraction(
    pollId: string,
    interactionType: 'view' | 'vote' | 'share' | 'comment' | 'save' | 'hide'
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { error } = await supabase.from('user_poll_interactions').upsert({
        user_id: user.id,
        poll_id: pollId,
        interaction_type: interactionType,
      });

      if (error) {
        console.error('Error tracking interaction:', error);
        return false;
      }

      // Update poll metrics
      await supabase.rpc('update_poll_metrics', {
        p_poll_id: pollId,
      });

      return true;
    } catch (error) {
      console.error('Error in trackInteraction:', error);
      return false;
    }
  }

  /**
   * Save poll for later
   */
  static async savePoll(pollId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { error } = await supabase.from('saved_polls').insert({
        user_id: user.id,
        poll_id: pollId,
      });

      if (error) {
        console.error('Error saving poll:', error);
        return false;
      }

      // Track save interaction
      await this.trackInteraction(pollId, 'save');

      return true;
    } catch (error) {
      console.error('Error in savePoll:', error);
      return false;
    }
  }

  /**
   * Unsave poll
   */
  static async unsavePoll(pollId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('saved_polls')
        .delete()
        .eq('user_id', user.id)
        .eq('poll_id', pollId);

      if (error) {
        console.error('Error unsaving poll:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in unsavePoll:', error);
      return false;
    }
  }

  /**
   * Hide poll from feed
   */
  static async hidePoll(pollId: string, reason?: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { error } = await supabase.from('hidden_polls').insert({
        user_id: user.id,
        poll_id: pollId,
        reason: reason || null,
      });

      if (error) {
        console.error('Error hiding poll:', error);
        return false;
      }

      // Track hide interaction
      await this.trackInteraction(pollId, 'hide');

      return true;
    } catch (error) {
      console.error('Error in hidePoll:', error);
      return false;
    }
  }

  /**
   * Get saved polls
   */
  static async getSavedPolls(
    limit: number = 20,
    offset: number = 0
  ): Promise<FeedPoll[]> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('saved_polls')
        .select(
          `
          poll_id,
          created_at,
          polls!saved_polls_poll_id_fkey(
            id,
            creator_id,
            option_a_image_url,
            option_a_label,
            option_b_image_url,
            option_b_label,
            description,
            expires_at,
            is_public,
            privacy_level,
            created_at
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching saved polls:', error);
        return [];
      }

      return (data || []).map(item => ({
        poll_id: item.poll_id,
        creator_id: item.polls?.[0]?.creator_id || '',
        option_a_image_url: item.polls?.[0]?.option_a_image_url || '',
        option_a_label: item.polls?.[0]?.option_a_label || null,
        option_b_image_url: item.polls?.[0]?.option_b_image_url || '',
        option_b_label: item.polls?.[0]?.option_b_label || null,
        description: item.polls?.[0]?.description || null,
        expires_at: item.polls?.[0]?.expires_at || '',
        is_public: item.polls?.[0]?.is_public || false,
        privacy_level: item.polls?.[0]?.privacy_level || 'public',
        created_at: item.polls?.[0]?.created_at || '',
        engagement_score: 0,
        trending_score: 0,
        popularity_score: 0,
        categories: [],
        tags: [],
      }));
    } catch (error) {
      console.error('Error in getSavedPolls:', error);
      return [];
    }
  }

  /**
   * Get poll recommendations based on user behavior
   */
  static async getRecommendations(
    limit: number = 20,
    offset: number = 0
  ): Promise<FeedPoll[]> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      // Get user's interaction history to find similar polls
      const { data: interactions } = await supabase
        .from('user_poll_interactions')
        .select('poll_id, interaction_type')
        .eq('user_id', user.id)
        .eq('interaction_type', 'vote')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!interactions || interactions.length === 0) {
        // No interaction history, return trending polls
        return await this.getTrendingPolls(limit, offset);
      }

      // Get polls with similar categories/tags to user's voted polls
      const votedPollIds = interactions.map(i => i.poll_id);

      const { data, error } = await supabase
        .from('polls')
        .select(
          `
          id,
          creator_id,
          option_a_image_url,
          option_a_label,
          option_b_image_url,
          option_b_label,
          description,
          expires_at,
          is_public,
          privacy_level,
          created_at,
          poll_metrics!poll_metrics_poll_id_fkey(
            engagement_score,
            trending_score,
            popularity_score
          )
        `
        )
        .eq('status', 'active')
        .eq('is_public', true)
        .not('id', 'in', `(${votedPollIds.join(',')})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }

      return (data || []).map(poll => ({
        poll_id: poll.id,
        creator_id: poll.creator_id,
        option_a_image_url: poll.option_a_image_url,
        option_a_label: poll.option_a_label,
        option_b_image_url: poll.option_b_image_url,
        option_b_label: poll.option_b_label,
        description: poll.description,
        expires_at: poll.expires_at,
        is_public: poll.is_public,
        privacy_level: poll.privacy_level,
        created_at: poll.created_at,
        engagement_score: poll.poll_metrics?.[0]?.engagement_score || 0,
        trending_score: poll.poll_metrics?.[0]?.trending_score || 0,
        popularity_score: poll.poll_metrics?.[0]?.popularity_score || 0,
        categories: [],
        tags: [],
      }));
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      return [];
    }
  }

  /**
   * Get feed cache for performance
   */
  static async getFeedCache(
    feedType: 'personalized' | 'trending' | 'popular' | 'following'
  ): Promise<string[] | null> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('feed_cache')
        .select('poll_ids')
        .eq('user_id', user.id)
        .eq('feed_type', feedType)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        return null;
      }

      return data?.poll_ids || null;
    } catch (error) {
      console.error('Error in getFeedCache:', error);
      return null;
    }
  }

  /**
   * Set feed cache for performance
   */
  static async setFeedCache(
    feedType: 'personalized' | 'trending' | 'popular' | 'following',
    pollIds: string[]
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const { error } = await supabase.from('feed_cache').upsert({
        user_id: user.id,
        feed_type: feedType,
        poll_ids: pollIds,
        algorithm_version: '1.0',
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        console.error('Error setting feed cache:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setFeedCache:', error);
      return false;
    }
  }
}
