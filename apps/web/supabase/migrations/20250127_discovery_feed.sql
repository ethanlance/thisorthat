-- Discovery Feed Database Schema
-- Supports poll categorization, user interests, trending metrics, and feed optimization

-- Create poll_categories table for organizing polls
CREATE TABLE IF NOT EXISTS poll_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'tag',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_tags table for flexible tagging
CREATE TABLE IF NOT EXISTS poll_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_category_assignments table
CREATE TABLE IF NOT EXISTS poll_category_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES poll_categories(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, category_id)
);

-- Create poll_tag_assignments table
CREATE TABLE IF NOT EXISTS poll_tag_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES poll_tags(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, tag_id)
);

-- Create user_interests table for tracking user preferences
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interest_type TEXT NOT NULL CHECK (interest_type IN ('category', 'tag', 'keyword')),
  interest_value TEXT NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'behavioral', 'inferred')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, interest_type, interest_value)
);

-- Create poll_metrics table for tracking engagement and trending
CREATE TABLE IF NOT EXISTS poll_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  view_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(10,4) DEFAULT 0,
  trending_score DECIMAL(10,4) DEFAULT 0,
  popularity_score DECIMAL(10,4) DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id)
);

-- Create user_feed_preferences table
CREATE TABLE IF NOT EXISTS user_feed_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feed_type TEXT DEFAULT 'personalized' CHECK (feed_type IN ('personalized', 'trending', 'recent', 'following')),
  show_categories TEXT[] DEFAULT '{}',
  hide_categories TEXT[] DEFAULT '{}',
  show_tags TEXT[] DEFAULT '{}',
  hide_tags TEXT[] DEFAULT '{}',
  min_engagement_score DECIMAL(10,4) DEFAULT 0,
  max_poll_age_days INTEGER DEFAULT 30,
  include_private_polls BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create feed_interactions table for tracking user behavior
CREATE TABLE IF NOT EXISTS feed_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'vote', 'comment', 'share', 'save', 'hide', 'report')),
  interaction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trending_topics table
CREATE TABLE IF NOT EXISTS trending_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_type TEXT NOT NULL CHECK (topic_type IN ('category', 'tag', 'keyword')),
  topic_value TEXT NOT NULL,
  trending_score DECIMAL(10,4) NOT NULL,
  velocity DECIMAL(10,4) DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poll_category_assignments_poll_id ON poll_category_assignments(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_category_assignments_category_id ON poll_category_assignments(category_id);
CREATE INDEX IF NOT EXISTS idx_poll_tag_assignments_poll_id ON poll_tag_assignments(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_tag_assignments_tag_id ON poll_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_type_value ON user_interests(interest_type, interest_value);
CREATE INDEX IF NOT EXISTS idx_poll_metrics_poll_id ON poll_metrics(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_metrics_engagement ON poll_metrics(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_poll_metrics_trending ON poll_metrics(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_poll_metrics_popularity ON poll_metrics(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_interactions_user_id ON feed_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_interactions_poll_id ON feed_interactions(poll_id);
CREATE INDEX IF NOT EXISTS idx_feed_interactions_type ON feed_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_trending_topics_score ON trending_topics(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_period ON trending_topics(period_start, period_end);

-- Enable RLS
ALTER TABLE poll_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feed_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for poll_categories
CREATE POLICY "Anyone can view active categories" ON poll_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create categories" ON poll_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update categories they created" ON poll_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for poll_tags
CREATE POLICY "Anyone can view active tags" ON poll_tags
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create tags" ON poll_tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tags they created" ON poll_tags
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for poll_category_assignments
CREATE POLICY "Anyone can view category assignments" ON poll_category_assignments
  FOR SELECT USING (true);

CREATE POLICY "Poll owners can assign categories" ON poll_category_assignments
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_category_assignments.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

CREATE POLICY "Poll owners can remove category assignments" ON poll_category_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_category_assignments.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

-- RLS Policies for poll_tag_assignments
CREATE POLICY "Anyone can view tag assignments" ON poll_tag_assignments
  FOR SELECT USING (true);

CREATE POLICY "Poll owners can assign tags" ON poll_tag_assignments
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_tag_assignments.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

CREATE POLICY "Poll owners can remove tag assignments" ON poll_tag_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_tag_assignments.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

-- RLS Policies for user_interests
CREATE POLICY "Users can view their own interests" ON user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interests" ON user_interests
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for poll_metrics
CREATE POLICY "Anyone can view poll metrics" ON poll_metrics
  FOR SELECT USING (true);

CREATE POLICY "System can update poll metrics" ON poll_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for user_feed_preferences
CREATE POLICY "Users can view their own preferences" ON user_feed_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" ON user_feed_preferences
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for feed_interactions
CREATE POLICY "Users can view their own interactions" ON feed_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions" ON feed_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trending_topics
CREATE POLICY "Anyone can view trending topics" ON trending_topics
  FOR SELECT USING (true);

CREATE POLICY "System can manage trending topics" ON trending_topics
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default categories
INSERT INTO poll_categories (name, description, color, icon) VALUES
  ('General', 'General interest polls and discussions', '#3B82F6', 'message-circle'),
  ('Entertainment', 'Movies, TV shows, music, and entertainment', '#EF4444', 'tv'),
  ('Sports', 'Sports, games, and athletic competitions', '#10B981', 'trophy'),
  ('Technology', 'Tech news, gadgets, and digital trends', '#8B5CF6', 'cpu'),
  ('Food & Dining', 'Food preferences, restaurants, and cooking', '#F59E0B', 'utensils'),
  ('Travel', 'Travel destinations, experiences, and tips', '#06B6D4', 'map-pin'),
  ('Fashion', 'Clothing, style, and fashion trends', '#EC4899', 'shirt'),
  ('Politics', 'Political discussions and opinions', '#6B7280', 'vote'),
  ('Science', 'Scientific topics and discoveries', '#84CC16', 'microscope'),
  ('Lifestyle', 'Personal lifestyle and daily choices', '#F97316', 'heart')
ON CONFLICT (name) DO NOTHING;

-- Insert default tags
INSERT INTO poll_tags (name, description) VALUES
  ('fun', 'Fun and entertaining polls'),
  ('serious', 'Serious and thought-provoking polls'),
  ('quick', 'Quick polls that take seconds to answer'),
  ('debate', 'Polls that spark debate and discussion'),
  ('trending', 'Currently trending topics'),
  ('viral', 'Viral and popular content'),
  ('local', 'Local and regional topics'),
  ('global', 'Global and international topics'),
  ('seasonal', 'Seasonal and time-sensitive topics'),
  ('evergreen', 'Timeless and always relevant topics')
ON CONFLICT (name) DO NOTHING;

-- Create function to update poll metrics
CREATE OR REPLACE FUNCTION update_poll_metrics(poll_uuid UUID)
RETURNS VOID AS $$
DECLARE
  poll_data RECORD;
  engagement_score DECIMAL(10,4);
  trending_score DECIMAL(10,4);
  popularity_score DECIMAL(10,4);
BEGIN
  -- Get poll data
  SELECT 
    p.id,
    p.created_at,
    p.expires_at,
    COALESCE(v.vote_count, 0) as vote_count,
    COALESCE(c.comment_count, 0) as comment_count,
    COALESCE(s.share_count, 0) as share_count,
    COALESCE(vi.view_count, 0) as view_count
  INTO poll_data
  FROM polls p
  LEFT JOIN (
    SELECT poll_id, COUNT(*) as vote_count
    FROM votes
    GROUP BY poll_id
  ) v ON p.id = v.poll_id
  LEFT JOIN (
    SELECT poll_id, COUNT(*) as comment_count
    FROM comments
    WHERE is_deleted = false
    GROUP BY poll_id
  ) c ON p.id = c.poll_id
  LEFT JOIN (
    SELECT poll_id, COUNT(*) as share_count
    FROM poll_shares
    WHERE is_active = true
    GROUP BY poll_id
  ) s ON p.id = s.poll_id
  LEFT JOIN (
    SELECT poll_id, COUNT(*) as view_count
    FROM feed_interactions
    WHERE interaction_type = 'view'
    GROUP BY poll_id
  ) vi ON p.id = vi.poll_id
  WHERE p.id = poll_uuid;

  -- Calculate engagement score (weighted combination of interactions)
  engagement_score := (
    (poll_data.vote_count * 1.0) +
    (poll_data.comment_count * 2.0) +
    (poll_data.share_count * 3.0) +
    (poll_data.view_count * 0.1)
  );

  -- Calculate trending score (recent engagement velocity)
  trending_score := engagement_score / GREATEST(EXTRACT(EPOCH FROM (NOW() - poll_data.created_at)) / 3600, 1);

  -- Calculate popularity score (total engagement over time)
  popularity_score := engagement_score / GREATEST(EXTRACT(EPOCH FROM (NOW() - poll_data.created_at)) / 86400, 1);

  -- Insert or update metrics
  INSERT INTO poll_metrics (
    poll_id,
    view_count,
    vote_count,
    comment_count,
    share_count,
    engagement_score,
    trending_score,
    popularity_score,
    last_calculated
  ) VALUES (
    poll_uuid,
    poll_data.view_count,
    poll_data.vote_count,
    poll_data.comment_count,
    poll_data.share_count,
    engagement_score,
    trending_score,
    popularity_score,
    NOW()
  )
  ON CONFLICT (poll_id) DO UPDATE SET
    view_count = EXCLUDED.view_count,
    vote_count = EXCLUDED.vote_count,
    comment_count = EXCLUDED.comment_count,
    share_count = EXCLUDED.share_count,
    engagement_score = EXCLUDED.engagement_score,
    trending_score = EXCLUDED.trending_score,
    popularity_score = EXCLUDED.popularity_score,
    last_calculated = EXCLUDED.last_calculated,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get personalized feed
CREATE OR REPLACE FUNCTION get_personalized_feed(
  user_uuid UUID,
  feed_limit INTEGER DEFAULT 20,
  feed_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  poll_id UUID,
  poll_title TEXT,
  poll_description TEXT,
  option_a_label TEXT,
  option_b_label TEXT,
  option_a_image_url TEXT,
  option_b_image_url TEXT,
  user_id UUID,
  user_display_name TEXT,
  user_avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  vote_count INTEGER,
  comment_count INTEGER,
  engagement_score DECIMAL(10,4),
  trending_score DECIMAL(10,4),
  popularity_score DECIMAL(10,4),
  categories TEXT[],
  tags TEXT[],
  feed_score DECIMAL(10,4)
) AS $$
BEGIN
  RETURN QUERY
  WITH user_interests AS (
    SELECT 
      interest_value,
      weight,
      CASE 
        WHEN interest_type = 'category' THEN 1.0
        WHEN interest_type = 'tag' THEN 0.8
        WHEN interest_type = 'keyword' THEN 0.6
        ELSE 0.4
      END as interest_weight
    FROM user_interests
    WHERE user_id = user_uuid
  ),
  poll_scores AS (
    SELECT 
      p.id as poll_id,
      p.title as poll_title,
      p.description as poll_description,
      p.option_a_label,
      p.option_b_label,
      p.option_a_image_url,
      p.option_b_image_url,
      p.user_id,
      pr.display_name as user_display_name,
      pr.avatar_url as user_avatar_url,
      p.created_at,
      p.expires_at,
      COALESCE(pm.vote_count, 0) as vote_count,
      COALESCE(pm.comment_count, 0) as comment_count,
      COALESCE(pm.engagement_score, 0) as engagement_score,
      COALESCE(pm.trending_score, 0) as trending_score,
      COALESCE(pm.popularity_score, 0) as popularity_score,
      ARRAY_AGG(DISTINCT pc.name) FILTER (WHERE pc.name IS NOT NULL) as categories,
      ARRAY_AGG(DISTINCT pt.name) FILTER (WHERE pt.name IS NOT NULL) as tags,
      -- Calculate personalized feed score
      (
        COALESCE(pm.engagement_score, 0) * 0.3 +
        COALESCE(pm.trending_score, 0) * 0.2 +
        COALESCE(pm.popularity_score, 0) * 0.2 +
        -- Interest matching bonus
        COALESCE((
          SELECT SUM(ui.weight * ui.interest_weight)
          FROM user_interests ui
          WHERE ui.interest_value = ANY(
            ARRAY_AGG(DISTINCT pc.name) || 
            ARRAY_AGG(DISTINCT pt.name)
          )
        ), 0) * 0.3
      ) as feed_score
    FROM polls p
    LEFT JOIN profiles pr ON p.user_id = pr.user_id
    LEFT JOIN poll_metrics pm ON p.id = pm.poll_id
    LEFT JOIN poll_category_assignments pca ON p.id = pca.poll_id
    LEFT JOIN poll_categories pc ON pca.category_id = pc.id
    LEFT JOIN poll_tag_assignments pta ON p.id = pta.poll_id
    LEFT JOIN poll_tags pt ON pta.tag_id = pt.id
    WHERE p.privacy_level = 'public'
      AND (p.expires_at IS NULL OR p.expires_at > NOW())
    GROUP BY p.id, p.title, p.description, p.option_a_label, p.option_b_label,
             p.option_a_image_url, p.option_b_image_url, p.user_id,
             pr.display_name, pr.avatar_url, p.created_at, p.expires_at,
             pm.vote_count, pm.comment_count, pm.engagement_score,
             pm.trending_score, pm.popularity_score
  )
  SELECT 
    ps.poll_id,
    ps.poll_title,
    ps.poll_description,
    ps.option_a_label,
    ps.option_b_label,
    ps.option_a_image_url,
    ps.option_b_image_url,
    ps.user_id,
    ps.user_display_name,
    ps.user_avatar_url,
    ps.created_at,
    ps.expires_at,
    ps.vote_count,
    ps.comment_count,
    ps.engagement_score,
    ps.trending_score,
    ps.popularity_score,
    ps.categories,
    ps.tags,
    ps.feed_score
  FROM poll_scores ps
  ORDER BY ps.feed_score DESC, ps.created_at DESC
  LIMIT feed_limit
  OFFSET feed_offset;
END;
$$ LANGUAGE plpgsql;
