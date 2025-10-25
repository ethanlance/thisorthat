-- Comments System RPC Functions
-- This migration adds the missing RPC functions for the comments system

-- Create function to get comment thread with user info
CREATE OR REPLACE FUNCTION get_comment_thread(poll_uuid UUID, limit_count INTEGER DEFAULT 50, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  poll_id UUID,
  user_id UUID,
  parent_id UUID,
  content TEXT,
  is_edited BOOLEAN,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_display_name TEXT,
  user_avatar_url TEXT,
  like_count BIGINT,
  dislike_count BIGINT,
  user_reaction TEXT,
  reply_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.poll_id,
    c.user_id,
    c.parent_id,
    c.content,
    c.is_edited,
    c.edited_at,
    c.is_deleted,
    c.created_at,
    c.updated_at,
    COALESCE(u.display_name, u.email) as user_display_name,
    u.avatar_url as user_avatar_url,
    COALESCE(like_stats.like_count, 0) as like_count,
    COALESCE(dislike_stats.dislike_count, 0) as dislike_count,
    user_reactions.reaction_type as user_reaction,
    COALESCE(reply_stats.reply_count, 0) as reply_count
  FROM comments c
  LEFT JOIN auth.users u ON c.user_id = u.id
  LEFT JOIN (
    SELECT comment_id, COUNT(*) as like_count
    FROM comment_reactions
    WHERE reaction_type = 'like'
    GROUP BY comment_id
  ) like_stats ON c.id = like_stats.comment_id
  LEFT JOIN (
    SELECT comment_id, COUNT(*) as dislike_count
    FROM comment_reactions
    WHERE reaction_type = 'dislike'
    GROUP BY comment_id
  ) dislike_stats ON c.id = dislike_stats.comment_id
  LEFT JOIN (
    SELECT comment_id, reaction_type
    FROM comment_reactions
    WHERE user_id = auth.uid()
  ) user_reactions ON c.id = user_reactions.comment_id
  LEFT JOIN (
    SELECT parent_id, COUNT(*) as reply_count
    FROM comments
    WHERE parent_id IS NOT NULL AND is_deleted = FALSE
    GROUP BY parent_id
  ) reply_stats ON c.id = reply_stats.parent_id
  WHERE c.poll_id = poll_uuid
    AND c.is_deleted = FALSE
  ORDER BY c.created_at ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get comment replies
CREATE OR REPLACE FUNCTION get_comment_replies(parent_uuid UUID, limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  poll_id UUID,
  user_id UUID,
  parent_id UUID,
  content TEXT,
  is_edited BOOLEAN,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_display_name TEXT,
  user_avatar_url TEXT,
  like_count BIGINT,
  dislike_count BIGINT,
  user_reaction TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.poll_id,
    c.user_id,
    c.parent_id,
    c.content,
    c.is_edited,
    c.edited_at,
    c.is_deleted,
    c.created_at,
    c.updated_at,
    COALESCE(u.display_name, u.email) as user_display_name,
    u.avatar_url as user_avatar_url,
    COALESCE(like_stats.like_count, 0) as like_count,
    COALESCE(dislike_stats.dislike_count, 0) as dislike_count,
    user_reactions.reaction_type as user_reaction
  FROM comments c
  LEFT JOIN auth.users u ON c.user_id = u.id
  LEFT JOIN (
    SELECT comment_id, COUNT(*) as like_count
    FROM comment_reactions
    WHERE reaction_type = 'like'
    GROUP BY comment_id
  ) like_stats ON c.id = like_stats.comment_id
  LEFT JOIN (
    SELECT comment_id, COUNT(*) as dislike_count
    FROM comment_reactions
    WHERE reaction_type = 'dislike'
    GROUP BY comment_id
  ) dislike_stats ON c.id = dislike_stats.comment_id
  LEFT JOIN (
    SELECT comment_id, reaction_type
    FROM comment_reactions
    WHERE user_id = auth.uid()
  ) user_reactions ON c.id = user_reactions.comment_id
  WHERE c.parent_id = parent_uuid
    AND c.is_deleted = FALSE
  ORDER BY c.created_at ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update comment reaction
CREATE OR REPLACE FUNCTION update_comment_reaction(
  comment_uuid UUID,
  reaction_type_param TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Delete existing reaction if it exists
  DELETE FROM comment_reactions 
  WHERE comment_id = comment_uuid AND user_id = auth.uid();
  
  -- Insert new reaction if reaction_type is not null
  IF reaction_type_param IS NOT NULL THEN
    INSERT INTO comment_reactions (comment_id, user_id, reaction_type)
    VALUES (comment_uuid, auth.uid(), reaction_type_param);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
