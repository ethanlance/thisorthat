-- Comments System Database Schema
-- Supports threaded comments, real-time updates, and moderation

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 500),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_reactions table for likes/dislikes
CREATE TABLE comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

-- Create comment_reports table for moderation
CREATE TABLE comment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'off_topic', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_moderation_actions table
CREATE TABLE comment_moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  moderator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('hide', 'delete', 'warn', 'approve')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_comments_poll_id ON comments(poll_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_is_deleted ON comments(is_deleted);
CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON comment_reactions(user_id);
CREATE INDEX idx_comment_reports_comment_id ON comment_reports(comment_id);
CREATE INDEX idx_comment_reports_status ON comment_reports(status);
CREATE INDEX idx_comment_moderation_actions_comment_id ON comment_moderation_actions(comment_id);

-- Enable RLS for all tables
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_moderation_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments table
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment_reactions table
CREATE POLICY "Comment reactions are viewable by everyone" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reactions" ON comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reactions" ON comment_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment_reports table
CREATE POLICY "Comment reports are viewable by reporters and moderators" ON comment_reports FOR SELECT USING (
  auth.uid() = reporter_id OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'moderator'
  )
);
CREATE POLICY "Users can insert their own reports" ON comment_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Moderators can update report status" ON comment_reports FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'moderator'
  )
);

-- RLS Policies for comment_moderation_actions table
CREATE POLICY "Moderation actions are viewable by moderators" ON comment_moderation_actions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'moderator'
  )
);
CREATE POLICY "Moderators can insert moderation actions" ON comment_moderation_actions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'moderator'
  )
);

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
  
  -- Insert new reaction if not 'none'
  IF reaction_type_param != 'none' THEN
    INSERT INTO comment_reactions (comment_id, user_id, reaction_type)
    VALUES (comment_uuid, auth.uid(), reaction_type_param);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to report comment
CREATE OR REPLACE FUNCTION report_comment(
  comment_uuid UUID,
  reason_param TEXT,
  description_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO comment_reports (comment_id, reporter_id, reason, description)
  VALUES (comment_uuid, auth.uid(), reason_param, description_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set edited_at when content is updated
CREATE OR REPLACE FUNCTION set_edited_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content != NEW.content THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_comments_edited_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_edited_at_column();
