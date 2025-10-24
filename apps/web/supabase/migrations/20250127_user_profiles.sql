-- Migration: User Profile Management
-- Description: Add comprehensive user profile management with social features

-- Extend user profiles with additional fields
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private'));
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create user_interests table for detailed interest tracking
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    interest TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, interest)
);

-- Create user_follows table for social connections
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create user_achievements table for gamification
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    achievement_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

-- Create user_activity table for tracking user actions
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON public.user_interests(interest);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON auth.users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_privacy_level ON auth.users(privacy_level);
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON auth.users(last_active_at);

-- Enable RLS on new tables
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_interests
CREATE POLICY "Users can view their own interests" ON public.user_interests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests" ON public.user_interests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests" ON public.user_interests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests" ON public.user_interests
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_follows
CREATE POLICY "Users can view their own follows" ON public.user_follows
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow others" ON public.user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON public.user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (true); -- System-level insert

-- RLS Policies for user_activity
CREATE POLICY "Users can view their own activity" ON public.user_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity" ON public.user_activity
    FOR INSERT WITH CHECK (true); -- System-level insert

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON auth.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to track user activity
CREATE OR REPLACE FUNCTION track_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_activity_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_activity (user_id, activity_type, activity_data)
    VALUES (p_user_id, p_activity_type, p_activity_data);
    
    -- Update last_active_at
    UPDATE auth.users 
    SET last_active_at = NOW() 
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with stats
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    interests TEXT[],
    privacy_level TEXT,
    profile_completed BOOLEAN,
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    polls_created BIGINT,
    polls_voted BIGINT,
    followers_count BIGINT,
    following_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.display_name,
        u.bio,
        u.avatar_url,
        u.interests,
        u.privacy_level,
        u.profile_completed,
        u.last_active_at,
        u.created_at,
        (SELECT COUNT(*) FROM public.polls WHERE creator_id = u.id AND status = 'active') as polls_created,
        (SELECT COUNT(*) FROM public.votes WHERE user_id = u.id) as polls_voted,
        (SELECT COUNT(*) FROM public.user_follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM public.user_follows WHERE follower_id = u.id) as following_count
    FROM auth.users u
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search users
CREATE OR REPLACE FUNCTION search_users(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    interests TEXT[],
    privacy_level TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE,
    polls_created BIGINT,
    followers_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.display_name,
        u.bio,
        u.avatar_url,
        u.interests,
        u.privacy_level,
        u.last_active_at,
        (SELECT COUNT(*) FROM public.polls WHERE creator_id = u.id AND status = 'active') as polls_created,
        (SELECT COUNT(*) FROM public.user_follows WHERE following_id = u.id) as followers_count
    FROM auth.users u
    WHERE 
        u.privacy_level = 'public'
        AND (
            u.display_name ILIKE '%' || p_search_term || '%'
            OR u.bio ILIKE '%' || p_search_term || '%'
            OR EXISTS (
                SELECT 1 FROM public.user_interests ui 
                WHERE ui.user_id = u.id 
                AND ui.interest ILIKE '%' || p_search_term || '%'
            )
        )
    ORDER BY u.last_active_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
