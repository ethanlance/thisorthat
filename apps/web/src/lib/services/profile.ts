import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['user_interests']['Row'];
type UserFollow = Database['public']['Tables']['user_follows']['Row'];
type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];
type UserActivity = Database['public']['Tables']['user_activity']['Row'];

export interface UserProfileData {
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

export interface ProfileUpdateData {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  interests?: string[];
  privacy_level?: 'public' | 'friends' | 'private';
}

export interface UserActivityData {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: Record<string, unknown> | null;
  created_at: string;
}

export class ProfileService {
  /**
   * Get user profile with statistics
   */
  static async getUserProfile(userId: string): Promise<UserProfileData | null> {
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
   * Get current user's profile
   */
  static async getCurrentUserProfile(): Promise<UserProfileData | null> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      return await this.getUserProfile(user.id);
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData: ProfileUpdateData): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update auth.users table
      const { error: userError } = await supabase.auth.updateUser({
        data: profileData,
      });

      if (userError) {
        console.error('Error updating user profile:', userError);
        return false;
      }

      // Update interests if provided
      if (profileData.interests) {
        // First, delete existing interests
        await supabase.from('user_interests').delete().eq('user_id', user.id);

        // Then, insert new interests
        if (profileData.interests.length > 0) {
          const interestsData = profileData.interests.map(interest => ({
            user_id: user.id,
            interest: interest.trim(),
          }));

          const { error: interestsError } = await supabase
            .from('user_interests')
            .insert(interestsData);

          if (interestsError) {
            console.error('Error updating user interests:', interestsError);
            return false;
          }
        }
      }

      // Track profile update activity
      await this.trackActivity('profile_updated', {
        updated_fields: Object.keys(profileData),
      });

      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  }

  /**
   * Upload profile avatar
   */
  static async uploadAvatar(file: File): Promise<string | null> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.id}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        return null;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return null;
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
  static async followUser(userId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (user.id === userId) {
        throw new Error('Cannot follow yourself');
      }

      const { error } = await supabase.from('user_follows').insert({
        follower_id: user.id,
        following_id: userId,
      });

      if (error) {
        console.error('Error following user:', error);
        return false;
      }

      // Track follow activity
      await this.trackActivity('user_followed', {
        followed_user_id: userId,
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
  static async unfollowUser(userId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) {
        console.error('Error unfollowing user:', error);
        return false;
      }

      // Track unfollow activity
      await this.trackActivity('user_unfollowed', {
        unfollowed_user_id: userId,
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

      if (error) {
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
  static async getUserFollowers(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserSearchResult[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('user_follows')
        .select(
          `
          follower_id,
          created_at,
          follower:auth.users!user_follows_follower_id_fkey(
            id,
            display_name,
            bio,
            avatar_url,
            interests,
            privacy_level,
            last_active_at
          )
        `
        )
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user followers:', error);
        return [];
      }

      return (data || []).map(follow => ({
        id: follow.follower_id,
        display_name: follow.follower?.display_name || null,
        bio: follow.follower?.bio || null,
        avatar_url: follow.follower?.avatar_url || null,
        interests: follow.follower?.interests || null,
        privacy_level: follow.follower?.privacy_level || 'public',
        last_active_at:
          follow.follower?.last_active_at || new Date().toISOString(),
        polls_created: 0, // Would need separate query
        followers_count: 0, // Would need separate query
      }));
    } catch (error) {
      console.error('Error in getUserFollowers:', error);
      return [];
    }
  }

  /**
   * Get users that a user is following
   */
  static async getUserFollowing(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserSearchResult[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('user_follows')
        .select(
          `
          following_id,
          created_at,
          following:auth.users!user_follows_following_id_fkey(
            id,
            display_name,
            bio,
            avatar_url,
            interests,
            privacy_level,
            last_active_at
          )
        `
        )
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user following:', error);
        return [];
      }

      return (data || []).map(follow => ({
        id: follow.following_id,
        display_name: follow.following?.display_name || null,
        bio: follow.following?.bio || null,
        avatar_url: follow.following?.avatar_url || null,
        interests: follow.following?.interests || null,
        privacy_level: follow.following?.privacy_level || 'public',
        last_active_at:
          follow.following?.last_active_at || new Date().toISOString(),
        polls_created: 0, // Would need separate query
        followers_count: 0, // Would need separate query
      }));
    } catch (error) {
      console.error('Error in getUserFollowing:', error);
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
  ): Promise<UserActivityData[]> {
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
    activityType: string,
    activityData?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { error } = await supabase.rpc('track_user_activity', {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_activity_data: activityData || null,
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
        console.error('Error fetching user achievements:', error);
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
        achievement_data: achievementData || null,
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

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<{
    polls_created: number;
    polls_voted: number;
    followers_count: number;
    following_count: number;
    achievements_count: number;
  }> {
    try {
      const supabase = createClient();

      const [
        pollsResult,
        votesResult,
        followersResult,
        followingResult,
        achievementsResult,
      ] = await Promise.all([
        supabase
          .from('polls')
          .select('id', { count: 'exact' })
          .eq('creator_id', userId)
          .eq('status', 'active'),
        supabase
          .from('votes')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact' })
          .eq('following_id', userId),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact' })
          .eq('follower_id', userId),
        supabase
          .from('user_achievements')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
      ]);

      return {
        polls_created: pollsResult.count || 0,
        polls_voted: votesResult.count || 0,
        followers_count: followersResult.count || 0,
        following_count: followingResult.count || 0,
        achievements_count: achievementsResult.count || 0,
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return {
        polls_created: 0,
        polls_voted: 0,
        followers_count: 0,
        following_count: 0,
        achievements_count: 0,
      };
    }
  }
}
