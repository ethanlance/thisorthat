-- Migration: Poll Discovery & Feed System
-- Description: Add comprehensive poll discovery, categorization, and feed functionality

-- Create poll_categories table for organizing polls
CREATE TABLE IF NOT EXISTS public.poll_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_tags table for flexible tagging
CREATE TABLE IF NOT EXISTS public.poll_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_categorizations table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.poll_categorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.poll_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, category_id)
);

-- Create poll_taggings table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.poll_taggings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.poll_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, tag_id)
);

-- Create user_feed_preferences table for personalized feeds
CREATE TABLE IF NOT EXISTS public.user_feed_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_categories UUID[] DEFAULT '{}',
    preferred_tags UUID[] DEFAULT '{}',
    excluded_categories UUID[] DEFAULT '{}',
    excluded_tags UUID[] DEFAULT '{}',
    feed_algorithm TEXT DEFAULT 'mixed' CHECK (feed_algorithm IN ('chronological', 'popular', 'trending', 'personalized', 'mixed')),
    show_following_only BOOLEAN DEFAULT FALSE,
    show_public_only BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create poll_metrics table for tracking engagement
CREATE TABLE IF NOT EXISTS public.poll_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    engagement_score DECIMAL(10,2) DEFAULT 0.0,
    trending_score DECIMAL(10,2) DEFAULT 0.0,
    popularity_score DECIMAL(10,2) DEFAULT 0.0,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id)
);

-- Create user_poll_interactions table for tracking user behavior
CREATE TABLE IF NOT EXISTS public.user_poll_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'vote', 'share', 'comment', 'save', 'hide')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, poll_id, interaction_type)
);

-- Create saved_polls table for user bookmarks
CREATE TABLE IF NOT EXISTS public.saved_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, poll_id)
);

-- Create hidden_polls table for user content filtering
CREATE TABLE IF NOT EXISTS public.hidden_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, poll_id)
);

-- Create feed_cache table for performance optimization
CREATE TABLE IF NOT EXISTS public.feed_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feed_type TEXT NOT NULL CHECK (feed_type IN ('personalized', 'trending', 'popular', 'following')),
    poll_ids UUID[] NOT NULL,
    algorithm_version TEXT DEFAULT '1.0',
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    UNIQUE(user_id, feed_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poll_categorizations_poll_id ON public.poll_categorizations(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_categorizations_category_id ON public.poll_categorizations(category_id);
CREATE INDEX IF NOT EXISTS idx_poll_taggings_poll_id ON public.poll_taggings(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_taggings_tag_id ON public.poll_taggings(tag_id);
CREATE INDEX IF NOT EXISTS idx_poll_metrics_poll_id ON public.poll_metrics(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_metrics_engagement_score ON public.poll_metrics(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_poll_metrics_trending_score ON public.poll_metrics(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_poll_metrics_popularity_score ON public.poll_metrics(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_poll_interactions_user_id ON public.user_poll_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_poll_interactions_poll_id ON public.user_poll_interactions(poll_id);
CREATE INDEX IF NOT EXISTS idx_user_poll_interactions_type ON public.user_poll_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_saved_polls_user_id ON public.saved_polls(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_polls_poll_id ON public.saved_polls(poll_id);
CREATE INDEX IF NOT EXISTS idx_hidden_polls_user_id ON public.hidden_polls(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_polls_poll_id ON public.hidden_polls(poll_id);
CREATE INDEX IF NOT EXISTS idx_feed_cache_user_id ON public.feed_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_cache_feed_type ON public.feed_cache(feed_type);
CREATE INDEX IF NOT EXISTS idx_feed_cache_expires_at ON public.feed_cache(expires_at);

-- Enable RLS on new tables
ALTER TABLE public.poll_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_categorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_taggings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feed_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_poll_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for poll_categories
CREATE POLICY "Anyone can view poll categories" ON public.poll_categories
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert poll categories" ON public.poll_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update poll categories" ON public.poll_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for poll_tags
CREATE POLICY "Anyone can view poll tags" ON public.poll_tags
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert poll tags" ON public.poll_tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update poll tags" ON public.poll_tags
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for poll_categorizations
CREATE POLICY "Anyone can view poll categorizations" ON public.poll_categorizations
    FOR SELECT USING (true);

CREATE POLICY "Poll creators can manage categorizations" ON public.poll_categorizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_categorizations.poll_id 
            AND polls.creator_id = auth.uid()
        )
    );

-- RLS Policies for poll_taggings
CREATE POLICY "Anyone can view poll taggings" ON public.poll_taggings
    FOR SELECT USING (true);

CREATE POLICY "Poll creators can manage taggings" ON public.poll_taggings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_taggings.poll_id 
            AND polls.creator_id = auth.uid()
        )
    );

-- RLS Policies for user_feed_preferences
CREATE POLICY "Users can view their own feed preferences" ON public.user_feed_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own feed preferences" ON public.user_feed_preferences
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for poll_metrics
CREATE POLICY "Anyone can view poll metrics" ON public.poll_metrics
    FOR SELECT USING (true);

CREATE POLICY "System can manage poll metrics" ON public.poll_metrics
    FOR ALL USING (true);

-- RLS Policies for user_poll_interactions
CREATE POLICY "Users can view their own interactions" ON public.user_poll_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interactions" ON public.user_poll_interactions
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for saved_polls
CREATE POLICY "Users can view their own saved polls" ON public.saved_polls
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved polls" ON public.saved_polls
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for hidden_polls
CREATE POLICY "Users can view their own hidden polls" ON public.hidden_polls
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own hidden polls" ON public.hidden_polls
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for feed_cache
CREATE POLICY "Users can view their own feed cache" ON public.feed_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage feed cache" ON public.feed_cache
    FOR ALL USING (true);

-- Function to update poll metrics
CREATE OR REPLACE FUNCTION update_poll_metrics(p_poll_id UUID)
RETURNS VOID AS $$
DECLARE
    v_view_count INTEGER;
    v_vote_count INTEGER;
    v_share_count INTEGER;
    v_comment_count INTEGER;
    v_engagement_score DECIMAL(10,2);
    v_trending_score DECIMAL(10,2);
    v_popularity_score DECIMAL(10,2);
BEGIN
    -- Get current counts
    SELECT 
        COALESCE(COUNT(DISTINCT CASE WHEN interaction_type = 'view' THEN user_id END), 0),
        COALESCE(COUNT(DISTINCT CASE WHEN interaction_type = 'vote' THEN user_id END), 0),
        COALESCE(COUNT(DISTINCT CASE WHEN interaction_type = 'share' THEN user_id END), 0),
        COALESCE(COUNT(DISTINCT CASE WHEN interaction_type = 'comment' THEN user_id END), 0)
    INTO v_view_count, v_vote_count, v_share_count, v_comment_count
    FROM public.user_poll_interactions
    WHERE poll_id = p_poll_id;

    -- Calculate engagement score (weighted combination)
    v_engagement_score := (v_vote_count * 2.0) + (v_comment_count * 1.5) + (v_share_count * 3.0) + (v_view_count * 0.1);

    -- Calculate trending score (recent activity weighted)
    v_trending_score := v_engagement_score * (
        SELECT EXTRACT(EPOCH FROM (NOW() - polls.created_at)) / 3600.0
        FROM public.polls 
        WHERE id = p_poll_id
    );

    -- Calculate popularity score (total engagement)
    v_popularity_score := v_engagement_score;

    -- Insert or update metrics
    INSERT INTO public.poll_metrics (
        poll_id, view_count, vote_count, share_count, comment_count,
        engagement_score, trending_score, popularity_score, last_calculated_at
    ) VALUES (
        p_poll_id, v_view_count, v_vote_count, v_share_count, v_comment_count,
        v_engagement_score, v_trending_score, v_popularity_score, NOW()
    )
    ON CONFLICT (poll_id) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        vote_count = EXCLUDED.vote_count,
        share_count = EXCLUDED.share_count,
        comment_count = EXCLUDED.comment_count,
        engagement_score = EXCLUDED.engagement_score,
        trending_score = EXCLUDED.trending_score,
        popularity_score = EXCLUDED.popularity_score,
        last_calculated_at = EXCLUDED.last_calculated_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get personalized feed
CREATE OR REPLACE FUNCTION get_personalized_feed(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    poll_id UUID,
    creator_id UUID,
    option_a_image_url TEXT,
    option_a_label TEXT,
    option_b_image_url TEXT,
    option_b_label TEXT,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN,
    privacy_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    engagement_score DECIMAL(10,2),
    trending_score DECIMAL(10,2),
    popularity_score DECIMAL(10,2),
    categories TEXT[],
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.creator_id,
        p.option_a_image_url,
        p.option_a_label,
        p.option_b_image_url,
        p.option_b_label,
        p.description,
        p.expires_at,
        p.is_public,
        p.privacy_level,
        p.created_at,
        COALESCE(pm.engagement_score, 0.0),
        COALESCE(pm.trending_score, 0.0),
        COALESCE(pm.popularity_score, 0.0),
        ARRAY_AGG(DISTINCT pc.name) FILTER (WHERE pc.name IS NOT NULL),
        ARRAY_AGG(DISTINCT pt.name) FILTER (WHERE pt.name IS NOT NULL)
    FROM public.polls p
    LEFT JOIN public.poll_metrics pm ON p.id = pm.poll_id
    LEFT JOIN public.poll_categorizations pcat ON p.id = pcat.poll_id
    LEFT JOIN public.poll_categories pc ON pcat.category_id = pc.id
    LEFT JOIN public.poll_taggings ptag ON p.id = ptag.poll_id
    LEFT JOIN public.poll_tags pt ON ptag.tag_id = pt.id
    LEFT JOIN public.hidden_polls hp ON p.id = hp.poll_id AND hp.user_id = p_user_id
    WHERE 
        p.status = 'active'
        AND p.is_public = true
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        AND hp.poll_id IS NULL
    GROUP BY p.id, p.creator_id, p.option_a_image_url, p.option_a_label, 
             p.option_b_image_url, p.option_b_label, p.description, 
             p.expires_at, p.is_public, p.privacy_level, p.created_at,
             pm.engagement_score, pm.trending_score, pm.popularity_score
    ORDER BY 
        COALESCE(pm.trending_score, 0.0) DESC,
        COALESCE(pm.engagement_score, 0.0) DESC,
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search polls
CREATE OR REPLACE FUNCTION search_polls(
    p_search_term TEXT,
    p_categories UUID[] DEFAULT NULL,
    p_tags UUID[] DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'relevance',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    poll_id UUID,
    creator_id UUID,
    option_a_image_url TEXT,
    option_a_label TEXT,
    option_b_image_url TEXT,
    option_b_label TEXT,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN,
    privacy_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    engagement_score DECIMAL(10,2),
    relevance_score DECIMAL(10,2),
    categories TEXT[],
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.creator_id,
        p.option_a_image_url,
        p.option_a_label,
        p.option_b_image_url,
        p.option_b_label,
        p.description,
        p.expires_at,
        p.is_public,
        p.privacy_level,
        p.created_at,
        COALESCE(pm.engagement_score, 0.0),
        CASE 
            WHEN p.description ILIKE '%' || p_search_term || '%' THEN 3.0
            WHEN p.option_a_label ILIKE '%' || p_search_term || '%' THEN 2.0
            WHEN p.option_b_label ILIKE '%' || p_search_term || '%' THEN 2.0
            ELSE 1.0
        END as relevance_score,
        ARRAY_AGG(DISTINCT pc.name) FILTER (WHERE pc.name IS NOT NULL),
        ARRAY_AGG(DISTINCT pt.name) FILTER (WHERE pt.name IS NOT NULL)
    FROM public.polls p
    LEFT JOIN public.poll_metrics pm ON p.id = pm.poll_id
    LEFT JOIN public.poll_categorizations pcat ON p.id = pcat.poll_id
    LEFT JOIN public.poll_categories pc ON pcat.category_id = pc.id
    LEFT JOIN public.poll_taggings ptag ON p.id = ptag.poll_id
    LEFT JOIN public.poll_tags pt ON ptag.tag_id = pt.id
    WHERE 
        p.status = 'active'
        AND p.is_public = true
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        AND (
            p.description ILIKE '%' || p_search_term || '%'
            OR p.option_a_label ILIKE '%' || p_search_term || '%'
            OR p.option_b_label ILIKE '%' || p_search_term || '%'
            OR EXISTS (
                SELECT 1 FROM public.poll_taggings pt2
                JOIN public.poll_tags pt3 ON pt2.tag_id = pt3.id
                WHERE pt2.poll_id = p.id
                AND pt3.name ILIKE '%' || p_search_term || '%'
            )
        )
        AND (p_categories IS NULL OR pcat.category_id = ANY(p_categories))
        AND (p_tags IS NULL OR ptag.tag_id = ANY(p_tags))
    GROUP BY p.id, p.creator_id, p.option_a_image_url, p.option_a_label, 
             p.option_b_image_url, p.option_b_label, p.description, 
             p.expires_at, p.is_public, p.privacy_level, p.created_at,
             pm.engagement_score
    ORDER BY 
        CASE p_sort_by
            WHEN 'relevance' THEN 
                CASE 
                    WHEN p.description ILIKE '%' || p_search_term || '%' THEN 3.0
                    WHEN p.option_a_label ILIKE '%' || p_search_term || '%' THEN 2.0
                    WHEN p.option_b_label ILIKE '%' || p_search_term || '%' THEN 2.0
                    ELSE 1.0
                END DESC
            WHEN 'trending' THEN COALESCE(pm.engagement_score, 0.0) DESC
            WHEN 'popular' THEN COALESCE(pm.popularity_score, 0.0) DESC
            ELSE p.created_at DESC
        END
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending polls
CREATE OR REPLACE FUNCTION get_trending_polls(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    poll_id UUID,
    creator_id UUID,
    option_a_image_url TEXT,
    option_a_label TEXT,
    option_b_image_url TEXT,
    option_b_label TEXT,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN,
    privacy_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    trending_score DECIMAL(10,2),
    engagement_score DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.creator_id,
        p.option_a_image_url,
        p.option_a_label,
        p.option_b_image_url,
        p.option_b_label,
        p.description,
        p.expires_at,
        p.is_public,
        p.privacy_level,
        p.created_at,
        COALESCE(pm.trending_score, 0.0),
        COALESCE(pm.engagement_score, 0.0)
    FROM public.polls p
    LEFT JOIN public.poll_metrics pm ON p.id = pm.poll_id
    WHERE 
        p.status = 'active'
        AND p.is_public = true
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        AND p.created_at > NOW() - INTERVAL '7 days'
    ORDER BY 
        COALESCE(pm.trending_score, 0.0) DESC,
        COALESCE(pm.engagement_score, 0.0) DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default categories
INSERT INTO public.poll_categories (name, description, color, icon) VALUES
('Entertainment', 'Movies, TV shows, music, and entertainment content', '#FF6B6B', '🎬'),
('Food & Drink', 'Culinary preferences, restaurants, and food choices', '#4ECDC4', '🍕'),
('Technology', 'Tech products, software, and digital innovations', '#45B7D1', '💻'),
('Sports', 'Athletic activities, teams, and sports preferences', '#96CEB4', '⚽'),
('Travel', 'Destinations, experiences, and travel preferences', '#FFEAA7', '✈️'),
('Fashion', 'Style, clothing, and fashion trends', '#DDA0DD', '👗'),
('Gaming', 'Video games, gaming preferences, and esports', '#98D8C8', '🎮'),
('Lifestyle', 'Daily life, habits, and personal preferences', '#F7DC6F', '🏠'),
('Education', 'Learning, courses, and educational content', '#BB8FCE', '📚'),
('Health & Fitness', 'Wellness, exercise, and health-related topics', '#85C1E9', '💪')
ON CONFLICT (name) DO NOTHING;

-- Insert default tags
INSERT INTO public.poll_tags (name, description) VALUES
('fun', 'Light-hearted and entertaining content'),
('serious', 'Important and thought-provoking topics'),
('quick', 'Fast and easy to answer'),
('detailed', 'Requires more thought and consideration'),
('visual', 'Heavily image-based content'),
('text', 'Text-focused content'),
('trending', 'Currently popular topics'),
('classic', 'Timeless and evergreen content'),
('seasonal', 'Time-sensitive or seasonal content'),
('controversial', 'Debatable or controversial topics')
ON CONFLICT (name) DO NOTHING;
