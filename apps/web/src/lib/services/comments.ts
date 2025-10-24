import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type Comment = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];
type CommentReaction = Database['public']['Tables']['comment_reactions']['Row'];

export interface CommentWithUser extends Comment {
  user_display_name: string;
  user_avatar_url: string | null;
  like_count: number;
  dislike_count: number;
  user_reaction: string | null;
  reply_count: number;
  is_deleted: boolean;
  is_edited: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface CommentReply extends Comment {
  user_display_name: string;
  user_avatar_url: string | null;
  like_count: number;
  dislike_count: number;
  user_reaction: string | null;
}

export interface CommentFormData {
  content: string;
  parent_id?: string;
}

export class CommentService {
  /**
   * Get comments for a poll with user info and reactions
   */
  static async getPollComments(
    pollId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CommentWithUser[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_comment_thread', {
        poll_uuid: pollId,
        limit_count: limit,
        offset_count: offset,
      });

      if (error) {
        console.error('Error fetching poll comments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPollComments:', error);
      return [];
    }
  }

  /**
   * Get replies for a specific comment
   */
  static async getCommentReplies(
    parentId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<CommentReply[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_comment_replies', {
        parent_uuid: parentId,
        limit_count: limit,
        offset_count: offset,
      });

      if (error) {
        console.error('Error fetching comment replies:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCommentReplies:', error);
      return [];
    }
  }

  /**
   * Create a new comment
   */
  static async createComment(
    pollId: string,
    commentData: CommentFormData,
    userId: string
  ): Promise<Comment | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('comments')
        .insert({
          poll_id: pollId,
          user_id: userId,
          parent_id: commentData.parent_id || null,
          content: commentData.content.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createComment:', error);
      return null;
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(
    commentId: string,
    content: string,
    userId: string
  ): Promise<Comment | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating comment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateComment:', error);
      return null;
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  static async deleteComment(
    commentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('comments')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
        })
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return false;
    }
  }

  /**
   * Update comment reaction (like/dislike)
   */
  static async updateCommentReaction(
    commentId: string,
    reactionType: 'like' | 'dislike' | 'none'
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('update_comment_reaction', {
        comment_uuid: commentId,
        reaction_type_param: reactionType,
      });

      if (error) {
        console.error('Error updating comment reaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateCommentReaction:', error);
      return false;
    }
  }

  /**
   * Report a comment
   */
  static async reportComment(
    commentId: string,
    reason: 'spam' | 'harassment' | 'inappropriate' | 'off_topic' | 'other',
    description?: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('report_comment', {
        comment_uuid: commentId,
        reason_param: reason,
        description_param: description || null,
      });

      if (error) {
        console.error('Error reporting comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in reportComment:', error);
      return false;
    }
  }

  /**
   * Get comment by ID with user info
   */
  static async getCommentById(
    commentId: string
  ): Promise<CommentWithUser | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('id', commentId)
        .eq('is_deleted', false)
        .single();

      if (error || !data) {
        console.error('Error fetching comment:', error);
        return null;
      }

      // Get user information
      const { data: userData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', data.user_id)
        .single();

      // Get reaction counts
      const { data: reactions } = await supabase
        .from('comment_reactions')
        .select('reaction_type')
        .eq('comment_id', commentId);

      const likeCount =
        reactions?.filter(r => r.reaction_type === 'like').length || 0;
      const dislikeCount =
        reactions?.filter(r => r.reaction_type === 'dislike').length || 0;

      // Get user's reaction
      const { data: userReaction } = await supabase
        .from('comment_reactions')
        .select('reaction_type')
        .eq('comment_id', commentId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Get reply count
      const { count: replyCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', commentId)
        .eq('is_deleted', false);

      return {
        id: data.id,
        poll_id: data.poll_id,
        user_id: data.user_id,
        parent_id: data.parent_id,
        content: data.content,
        is_edited: data.is_edited,
        edited_at: data.edited_at,
        is_deleted: data.is_deleted,
        deleted_at: data.deleted_at,
        deleted_by: data.deleted_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_display_name: userData?.display_name || 'Anonymous',
        user_avatar_url: userData?.avatar_url,
        like_count: likeCount,
        dislike_count: dislikeCount,
        user_reaction: userReaction?.reaction_type || null,
        reply_count: replyCount || 0,
      } as CommentWithUser;
    } catch (error) {
      console.error('Error in getCommentById:', error);
      return null;
    }
  }

  /**
   * Validate comment content
   */
  static validateComment(content: string): {
    isValid: boolean;
    error?: string;
  } {
    const trimmed = content.trim();

    if (!trimmed) {
      return { isValid: false, error: 'Comment cannot be empty' };
    }

    if (trimmed.length < 1) {
      return { isValid: false, error: 'Comment must be at least 1 character' };
    }

    if (trimmed.length > 500) {
      return { isValid: false, error: 'Comment cannot exceed 500 characters' };
    }

    return { isValid: true };
  }

  /**
   * Get comment statistics for a poll
   */
  static async getPollCommentStats(pollId: string): Promise<{
    total_comments: number;
    total_replies: number;
    recent_activity: string | null;
  }> {
    try {
      const supabase = createClient();

      // Get total comments (excluding replies)
      const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', pollId)
        .is('parent_id', null)
        .eq('is_deleted', false);

      // Get total replies
      const { count: totalReplies } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', pollId)
        .not('parent_id', 'is', null)
        .eq('is_deleted', false);

      // Get most recent comment
      const { data: recentComment } = await supabase
        .from('comments')
        .select('created_at')
        .eq('poll_id', pollId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        total_comments: totalComments || 0,
        total_replies: totalReplies || 0,
        recent_activity: recentComment?.created_at || null,
      };
    } catch (error) {
      console.error('Error in getPollCommentStats:', error);
      return {
        total_comments: 0,
        total_replies: 0,
        recent_activity: null,
      };
    }
  }
}
