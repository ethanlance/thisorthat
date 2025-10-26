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

interface UserFeedPreferences {
  id: string;
  user_id: string;
  feed_type: 'personalized' | 'trending' | 'recent' | 'following';
  show_categories: string[];
  hide_categories: string[];
  show_tags: string[];
  hide_tags: string[];
  min_engagement_score: number;
  max_poll_age_days: number;
  include_private_polls: boolean;
  created_at: string;
  updated_at: string;
}

interface FeedInteraction {
  id: string;
  user_id: string;
  poll_id: string;
  interaction_type:
    | 'view'
    | 'vote'
    | 'comment'
    | 'share'
    | 'save'
    | 'hide'
    | 'report';
  interaction_data: Record<string, unknown>;
  created_at: string;
}

interface TrendingTopic {
  id: string;
  topic_type: 'category' | 'tag' | 'keyword';
  topic_value: string;
  trending_score: number;
  velocity: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface PollFeedItem {
  poll_id: string;
  poll_title: string;
  poll_description: string;
  option_a_label: string;
  option_b_label: string;
  option_a_image_url: string | null;
  option_b_image_url: string | null;
  user_id: string;
  user_display_name: string | null;
  user_avatar_url: string | null;
  created_at: string;
  expires_at: string | null;
  vote_count: number;
  comment_count: number;
  engagement_score: number;
  trending_score: number;
  popularity_score: number;
  categories: string[];
  tags: string[];
  feed_score: number;
}

export interface SearchFilters {
  query?: string;
  categories?: string[];
  tags?: string[];
  dateRange?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'relevance' | 'popularity' | 'trending' | 'recent';
  minEngagement?: number;
  maxAge?: number;
}

export interface TrendingContent {
  polls: PollFeedItem[];
  topics: TrendingTopic[];
  categories: PollCategory[];
}

export class DiscoveryService {
  /**
   * Get personalized feed for a user
   */
  static async getPersonalizedFeed(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PollFeedItem[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_personalized_feed', {
        user_uuid: userId,
        feed_limit: limit,
        feed_offset: offset,
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
  ): Promise<PollFeedItem[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('polls')
        .select(
          `
          *,
          profiles!inner(display_name, avatar_url),
          poll_metrics!inner(*),
          poll_category_assignments(
            poll_categories(name)
          ),
          poll_tag_assignments(
            poll_tags(name)
          )
        `
        )
        .eq('privacy_level', 'public')
        .order('poll_metrics.trending_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching trending polls:', error);
        return [];
      }

      return this.mapPollData(data);
    } catch (error) {
      console.error('Error in getTrendingPolls:', error);
      return [];
    }
  }

  /**
   * Get popular polls
   */
  static async getPopularPolls(
    limit: number = 20,
    offset: number = 0
  ): Promise<PollFeedItem[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('polls')
        .select(
          `
          *,
          profiles!inner(display_name, avatar_url),
          poll_metrics!inner(*),
          poll_category_assignments(
            poll_categories(name)
          ),
          poll_tag_assignments(
            poll_tags(name)
          )
        `
        )
        .eq('privacy_level', 'public')
        .order('poll_metrics.popularity_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching popular polls:', error);
        return [];
      }

      return this.mapPollData(data);
    } catch (error) {
      console.error('Error in getPopularPolls:', error);
      return [];
    }
  }

  /**
   * Search polls with filters
   */
  static async searchPolls(
    filters: SearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<PollFeedItem[]> {
    try {
      const supabase = createClient();

      let query = supabase
        .from('polls')
        .select(
          `
          *,
          profiles!inner(display_name, avatar_url),
          poll_metrics!inner(*),
          poll_category_assignments(
            poll_categories(name)
          ),
          poll_tag_assignments(
            poll_tags(name)
          )
        `
        )
        .eq('privacy_level', 'public');

      // Apply search query
      if (filters.query) {
        query = query.or(
          `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`
        );
      }

      // Apply category filter
      if (filters.categories && filters.categories.length > 0) {
        query = query.in(
          'poll_category_assignments.poll_categories.name',
          filters.categories
        );
      }

      // Apply tag filter
      if (filters.tags && filters.tags.length > 0) {
        query = query.in('poll_tag_assignments.poll_tags.name', filters.tags);
      }

      // Apply date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply engagement filter
      if (filters.minEngagement) {
        query = query.gte(
          'poll_metrics.engagement_score',
          filters.minEngagement
        );
      }

      // Apply age filter
      if (filters.maxAge) {
        const maxDate = new Date(
          Date.now() - filters.maxAge * 24 * 60 * 60 * 1000
        );
        query = query.gte('created_at', maxDate.toISOString());
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'popularity':
          query = query.order('poll_metrics.popularity_score', {
            ascending: false,
          });
          break;
        case 'trending':
          query = query.order('poll_metrics.trending_score', {
            ascending: false,
          });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'relevance':
        default:
          query = query.order('poll_metrics.engagement_score', {
            ascending: false,
          });
          break;
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error('Error searching polls:', error);
        return [];
      }

      return this.mapPollData(data);
    } catch (error) {
      console.error('Error in searchPolls:', error);
      return [];
    }
  }

  /**
   * Get poll categories
   */
  static async getCategories(): Promise<PollCategory[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('poll_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }

  /**
   * Get poll tags
   */
  static async getTags(): Promise<PollTag[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('poll_tags')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Error fetching tags:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTags:', error);
      return [];
    }
  }

  /**
   * Get trending topics
   */
  static async getTrendingTopics(limit: number = 10): Promise<TrendingTopic[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('trending_topics')
        .select('*')
        .order('trending_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching trending topics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTrendingTopics:', error);
      return [];
    }
  }

  /**
   * Get user feed preferences
   */
  static async getUserFeedPreferences(
    userId: string
  ): Promise<UserFeedPreferences | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('user_feed_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user feed preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserFeedPreferences:', error);
      return null;
    }
  }

  /**
   * Update user feed preferences
   */
  static async updateUserFeedPreferences(
    userId: string,
    preferences: Partial<UserFeedPreferences>
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase.from('user_feed_preferences').upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error updating user feed preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserFeedPreferences:', error);
      return false;
    }
  }

  /**
   * Track user interaction with feed
   */
  static async trackInteraction(
    userId: string,
    pollId: string,
    interactionType: FeedInteraction['interaction_type'],
    interactionData: Record<string, unknown> = {}
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase.from('feed_interactions').insert({
        user_id: userId,
        poll_id: pollId,
        interaction_type: interactionType,
        interaction_data: interactionData,
      });

      if (error) {
        console.error('Error tracking interaction:', error);
        return false;
      }

      // Update poll metrics if needed
      if (
        interactionType === 'view' ||
        interactionType === 'vote' ||
        interactionType === 'comment'
      ) {
        await supabase.rpc('update_poll_metrics', { poll_uuid: pollId });
      }

      return true;
    } catch (error) {
      console.error('Error in trackInteraction:', error);
      return false;
    }
  }

  /**
   * Add user interest
   */
  static async addUserInterest(
    userId: string,
    interestType: 'category' | 'tag' | 'keyword',
    interestValue: string,
    weight: number = 1.0,
    source: 'manual' | 'behavioral' | 'inferred' = 'manual'
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase.from('user_interests').upsert({
        user_id: userId,
        interest_type: interestType,
        interest_value: interestValue,
        weight: weight,
        source: source,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error adding user interest:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addUserInterest:', error);
      return false;
    }
  }

  /**
   * Remove user interest
   */
  static async removeUserInterest(
    userId: string,
    interestType: 'category' | 'tag' | 'keyword',
    interestValue: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId)
        .eq('interest_type', interestType)
        .eq('interest_value', interestValue);

      if (error) {
        console.error('Error removing user interest:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeUserInterest:', error);
      return false;
    }
  }

  /**
   * Get user interests
   */
  static async getUserInterests(userId: string): Promise<
    Array<{
      interest_type: string;
      interest_value: string;
      weight: number;
      source: string;
    }>
  > {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('user_interests')
        .select('interest_type, interest_value, weight, source')
        .eq('user_id', userId)
        .order('weight', { ascending: false });

      if (error) {
        console.error('Error fetching user interests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserInterests:', error);
      return [];
    }
  }

  /**
   * Map poll data to PollFeedItem format
   */
  private static mapPollData(data: Record<string, unknown>[]): PollFeedItem[] {
    return data.map((poll: Record<string, unknown>) => ({
      poll_id: poll.id as string,
      poll_title: poll.title as string,
      poll_description: poll.description as string,
      option_a_label: poll.option_a_label as string,
      option_b_label: poll.option_b_label as string,
      option_a_image_url: poll.option_a_image_url as string,
      option_b_image_url: poll.option_b_image_url as string,
      user_id: poll.user_id as string,
      user_display_name:
        ((poll.profiles as Record<string, unknown>)?.display_name as string) ||
        null,
      user_avatar_url:
        ((poll.profiles as Record<string, unknown>)?.avatar_url as string) ||
        null,
      created_at: poll.created_at as string,
      expires_at: poll.expires_at as string,
      vote_count:
        ((poll.poll_metrics as Record<string, unknown>)
          ?.vote_count as number) || 0,
      comment_count:
        ((poll.poll_metrics as Record<string, unknown>)
          ?.comment_count as number) || 0,
      engagement_score:
        ((poll.poll_metrics as Record<string, unknown>)
          ?.engagement_score as number) || 0,
      trending_score:
        ((poll.poll_metrics as Record<string, unknown>)
          ?.trending_score as number) || 0,
      popularity_score:
        ((poll.poll_metrics as Record<string, unknown>)
          ?.popularity_score as number) || 0,
      categories:
        ((
          poll.poll_category_assignments as
            | Record<string, unknown>[]
            | undefined
        )
          ?.map(
            (ca: Record<string, unknown>) =>
              (ca.poll_categories as Record<string, unknown>)?.name as string
          )
          .filter(Boolean) as string[]) || [],
      tags:
        ((poll.poll_tag_assignments as Record<string, unknown>[] | undefined)
          ?.map(
            (ta: Record<string, unknown>) =>
              (ta.poll_tags as Record<string, unknown>)?.name as string
          )
          .filter(Boolean) as string[]) || [],
      feed_score: 0, // Will be calculated by the database function
    }));
  }
}
