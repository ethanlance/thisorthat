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

      // First, get the comments with basic info
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(
          `
          id,
          poll_id,
          user_id,
          parent_id,
          content,
          is_edited,
          edited_at,
          is_deleted,
          deleted_at,
          deleted_by,
          created_at,
          updated_at
        `
        )
        .eq('poll_id', pollId)
        .eq('is_deleted', false)
        .is('parent_id', null) // Only get top-level comments
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (commentsError) {
        console.error('Error fetching poll comments:', commentsError);
        return [];
      }

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get user info for each comment
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return [];
      }

      // Get reaction counts for each comment
      const commentIds = comments.map(c => c.id);
      const { data: reactions, error: reactionsError } = await supabase
        .from('comment_reactions')
        .select('comment_id, reaction_type, user_id')
        .in('comment_id', commentIds);

      if (reactionsError) {
        console.error('Error fetching reactions:', reactionsError);
      }

      // Get reply counts for each comment
      const { data: replies, error: repliesError } = await supabase
        .from('comments')
        .select('parent_id')
        .in('parent_id', commentIds)
        .eq('is_deleted', false);

      if (repliesError) {
        console.error('Error fetching replies:', repliesError);
      }

      // Combine all data
      const userMap = new Map(users?.map(u => [u.id, u]) || []);
      const reactionMap = new Map<
        string,
        { like: number; dislike: number; userReaction?: string }
      >();

      // Process reactions
      reactions?.forEach(reaction => {
        const key = reaction.comment_id;
        if (!reactionMap.has(key)) {
          reactionMap.set(key, { like: 0, dislike: 0 });
        }
        const stats = reactionMap.get(key)!;
        if (reaction.reaction_type === 'like') {
          stats.like++;
        } else if (reaction.reaction_type === 'dislike') {
          stats.dislike++;
        }
      });

      // Process reply counts
      const replyCountMap = new Map<string, number>();
      replies?.forEach(reply => {
        const key = reply.parent_id;
        replyCountMap.set(key, (replyCountMap.get(key) || 0) + 1);
      });

      // Build the final result
      const result: CommentWithUser[] = comments.map(comment => {
        const user = userMap.get(comment.user_id);
        const reactionStats = reactionMap.get(comment.id) || {
          like: 0,
          dislike: 0,
        };
        const replyCount = replyCountMap.get(comment.id) || 0;

        return {
          id: comment.id,
          poll_id: comment.poll_id,
          user_id: comment.user_id,
          parent_id: comment.parent_id,
          content: comment.content,
          is_edited: comment.is_edited,
          edited_at: comment.edited_at,
          is_deleted: comment.is_deleted,
          deleted_at: comment.deleted_at,
          deleted_by: comment.deleted_by,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user_display_name:
            user?.raw_user_meta_data?.display_name ||
            user?.email ||
            'Anonymous',
          user_avatar_url: user?.raw_user_meta_data?.avatar_url || null,
          like_count: reactionStats.like,
          dislike_count: reactionStats.dislike,
          user_reaction: reactionStats.userReaction || null,
          reply_count: replyCount,
        };
      });

      return result;
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

      // Get replies with basic info
      const { data: replies, error: repliesError } = await supabase
        .from('comments')
        .select(
          `
          id,
          poll_id,
          user_id,
          parent_id,
          content,
          is_edited,
          edited_at,
          is_deleted,
          deleted_at,
          deleted_by,
          created_at,
          updated_at
        `
        )
        .eq('parent_id', parentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (repliesError) {
        console.error('Error fetching comment replies:', repliesError);
        return [];
      }

      if (!replies || replies.length === 0) {
        return [];
      }

      // Get user info for each reply
      const userIds = [...new Set(replies.map(r => r.user_id))];
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return [];
      }

      // Get reaction counts for each reply
      const replyIds = replies.map(r => r.id);
      const { data: reactions, error: reactionsError } = await supabase
        .from('comment_reactions')
        .select('comment_id, reaction_type, user_id')
        .in('comment_id', replyIds);

      if (reactionsError) {
        console.error('Error fetching reactions:', reactionsError);
      }

      // Combine all data
      const userMap = new Map(users?.map(u => [u.id, u]) || []);
      const reactionMap = new Map<
        string,
        { like: number; dislike: number; userReaction?: string }
      >();

      // Process reactions
      reactions?.forEach(reaction => {
        const key = reaction.comment_id;
        if (!reactionMap.has(key)) {
          reactionMap.set(key, { like: 0, dislike: 0 });
        }
        const stats = reactionMap.get(key)!;
        if (reaction.reaction_type === 'like') {
          stats.like++;
        } else if (reaction.reaction_type === 'dislike') {
          stats.dislike++;
        }
      });

      // Build the final result
      const result: CommentReply[] = replies.map(reply => {
        const user = userMap.get(reply.user_id);
        const reactionStats = reactionMap.get(reply.id) || {
          like: 0,
          dislike: 0,
        };

        return {
          id: reply.id,
          poll_id: reply.poll_id,
          user_id: reply.user_id,
          parent_id: reply.parent_id,
          content: reply.content,
          is_edited: reply.is_edited,
          edited_at: reply.edited_at,
          is_deleted: reply.is_deleted,
          deleted_at: reply.deleted_at,
          deleted_by: reply.deleted_by,
          created_at: reply.created_at,
          updated_at: reply.updated_at,
          user_display_name:
            user?.raw_user_meta_data?.display_name ||
            user?.email ||
            'Anonymous',
          user_avatar_url: user?.raw_user_meta_data?.avatar_url || null,
          like_count: reactionStats.like,
          dislike_count: reactionStats.dislike,
          user_reaction: reactionStats.userReaction || null,
        };
      });

      return result;
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
