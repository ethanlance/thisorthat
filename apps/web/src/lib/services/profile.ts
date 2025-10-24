import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['user_interests']['Row'];
type UserFollow = Database['public']['Tables']['user_follows']['Row'];
type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];
type UserActivity = Database['public']['Tables']['user_activity']['Row'];

export interface ProfileData {
  id: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  privacy_level: 'public' | 'friends' | 'private';
  profile_completed: boolean;
  last_active_at: string;
  created_at: string;
  polls_created: number;
  polls_voted: number;
  followers_count: number;
  following_count: number;
}

export interface UserSearchResult {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  privacy_level: 'public' | 'friends' | 'private';
  last_active_at: string;
  polls_created: number;
  followers_count: number;
}

export class ProfileService {
  /**
   * Get user profile with statistics
   */
  static async getUserProfile(userId: string): Promise<ProfileData | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_user_profile', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: {
      display_name?: string;
      bio?: string;
      avatar_url?: string;
      interests?: string[];
      privacy_level?: 'public' | 'friends' | 'private';
    }
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('auth.users')
        .update({
          display_name: updates.display_name,
          bio: updates.bio,
          avatar_url: updates.avatar_url,
          interests: updates.interests,
          privacy_level: updates.privacy_level,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      // Track profile update activity
      await this.trackActivity(userId, 'profile_updated', {
        updated_fields: Object.keys(updates),
      });

      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  }

  /**
   * Search users
   */
  static async searchUsers(
    searchTerm: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserSearchResult[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('search_users', {
        p_search_term: searchTerm,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  }

  /**
   * Follow a user
   */
  static async followUser(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('user_follows').insert({
        follower_id: followerId,
        following_id: followingId,
      });

      if (error) {
        console.error('Error following user:', error);
        return false;
      }

      // Track follow activity
      await this.trackActivity(followerId, 'user_followed', {
        following_id: followingId,
      });

      return true;
    } catch (error) {
      console.error('Error in followUser:', error);
      return false;
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) {
        console.error('Error unfollowing user:', error);
        return false;
      }

      // Track unfollow activity
      await this.trackActivity(followerId, 'user_unfollowed', {
        following_id: followingId,
      });

      return true;
    } catch (error) {
      console.error('Error in unfollowUser:', error);
      return false;
    }
  }

  /**
   * Check if user is following another user
   */
  static async isFollowing(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isFollowing:', error);
      return false;
    }
  }

  /**
   * Get user's followers
   */
  static async getFollowers(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserSearchResult[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_follows')
        .select('follower_id, created_at')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching followers:', error);
        return [];
      }

      // Get user data for each follower
      const followers = [];
      for (const follow of data || []) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', follow.follower_id)
          .single();

        if (userData) {
          followers.push({
            id: userData.id,
            display_name: userData.display_name,
            bio: userData.bio,
            avatar_url: userData.avatar_url,
            interests: userData.interests,
            privacy_level: userData.privacy_level,
            last_active_at: userData.last_active_at,
            polls_created: 0, // Would need additional query
            followers_count: 0, // Would need additional query
          });
        }
      }

      return followers;
    } catch (error) {
      console.error('Error in getFollowers:', error);
      return [];
    }
  }

  /**
   * Get users that a user is following
   */
  static async getFollowing(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserSearchResult[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id, created_at')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching following:', error);
        return [];
      }

      // Get user data for each following
      const following = [];
      for (const follow of data || []) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', follow.following_id)
          .single();

        if (userData) {
          following.push({
            id: userData.id,
            display_name: userData.display_name,
            bio: userData.bio,
            avatar_url: userData.avatar_url,
            interests: userData.interests,
            privacy_level: userData.privacy_level,
            last_active_at: userData.last_active_at,
            polls_created: 0, // Would need additional query
            followers_count: 0, // Would need additional query
          });
        }
      }

      return following;
    } catch (error) {
      console.error('Error in getFollowing:', error);
      return [];
    }
  }

  /**
   * Get user activity
   */
  static async getUserActivity(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserActivity[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user activity:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserActivity:', error);
      return [];
    }
  }

  /**
   * Track user activity
   */
  static async trackActivity(
    userId: string,
    activityType: string,
    activityData?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('track_user_activity', {
        p_user_id: userId,
        p_activity_type: activityType,
        p_activity_data: activityData,
      });

      if (error) {
        console.error('Error tracking activity:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in trackActivity:', error);
      return false;
    }
  }

  /**
   * Get user achievements
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserAchievements:', error);
      return [];
    }
  }

  /**
   * Add user achievement
   */
  static async addAchievement(
    userId: string,
    achievementType: string,
    achievementData?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_type: achievementType,
        achievement_data: achievementData,
      });

      if (error) {
        console.error('Error adding achievement:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addAchievement:', error);
      return false;
    }
  }
}
