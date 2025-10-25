-- Migration: Error Handling & User Feedback System
-- Description: Add comprehensive error handling and user feedback functionality

-- Create error_reports table for tracking application errors
CREATE TABLE IF NOT EXISTS public.error_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('network', 'validation', 'system', 'authentication', 'authorization', 'unknown')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    user_message TEXT NOT NULL,
    context JSONB,
    stack TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_feedback table for user feedback and bug reports
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'general')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'duplicate')) DEFAULT 'open',
    category TEXT DEFAULT 'General',
    tags TEXT[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    votes INTEGER DEFAULT 0,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback_votes table for voting on feedback
CREATE TABLE IF NOT EXISTS public.feedback_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES public.user_feedback(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(feedback_id, user_id)
);

-- Create feedback_comments table for feedback discussions
CREATE TABLE IF NOT EXISTS public.feedback_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES public.user_feedback(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_reports_type ON public.error_reports(type);
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON public.error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_resolved ON public.error_reports(resolved);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON public.error_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON public.error_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON public.user_feedback(type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_priority ON public.user_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_user_feedback_votes ON public.user_feedback(votes DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback_id ON public.feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_id ON public.feedback_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback_id ON public.feedback_comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_user_id ON public.feedback_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_created_at ON public.feedback_comments(created_at);

-- Enable RLS on new tables
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_reports
CREATE POLICY "Users can view their own error reports" ON public.error_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert error reports" ON public.error_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all error reports" ON public.error_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for user_feedback
CREATE POLICY "Users can view their own feedback" ON public.user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON public.user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON public.user_feedback
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public feedback" ON public.user_feedback
    FOR SELECT USING (true);

-- RLS Policies for feedback_votes
CREATE POLICY "Users can view feedback votes" ON public.feedback_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON public.feedback_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.feedback_votes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for feedback_comments
CREATE POLICY "Users can view feedback comments" ON public.feedback_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.feedback_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.feedback_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.feedback_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update feedback vote count
CREATE OR REPLACE FUNCTION update_feedback_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.user_feedback 
        SET votes = votes + 1 
        WHERE id = NEW.feedback_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.user_feedback 
        SET votes = votes - 1 
        WHERE id = OLD.feedback_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update vote count
CREATE TRIGGER update_feedback_votes_trigger
    AFTER INSERT OR DELETE ON public.feedback_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_votes();

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_stats()
RETURNS TABLE (
    total_errors BIGINT,
    resolved_errors BIGINT,
    critical_errors BIGINT,
    errors_by_type JSONB,
    errors_by_severity JSONB,
    recent_errors BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_errors,
        COUNT(*) FILTER (WHERE resolved = true) as resolved_errors,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_errors,
        jsonb_object_agg(type, type_count) as errors_by_type,
        jsonb_object_agg(severity, severity_count) as errors_by_severity,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_errors
    FROM (
        SELECT 
            type,
            severity,
            COUNT(*) as type_count,
            COUNT(*) as severity_count
        FROM public.error_reports
        GROUP BY type, severity
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS TABLE (
    total_feedback BIGINT,
    open_feedback BIGINT,
    high_priority_feedback BIGINT,
    feedback_by_type JSONB,
    feedback_by_status JSONB,
    recent_feedback BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_feedback,
        COUNT(*) FILTER (WHERE status = 'open') as open_feedback,
        COUNT(*) FILTER (WHERE priority IN ('high', 'urgent')) as high_priority_feedback,
        jsonb_object_agg(type, type_count) as feedback_by_type,
        jsonb_object_agg(status, status_count) as feedback_by_status,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_feedback
    FROM (
        SELECT 
            type,
            status,
            COUNT(*) as type_count,
            COUNT(*) as status_count
        FROM public.user_feedback
        GROUP BY type, status
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search feedback
CREATE OR REPLACE FUNCTION search_feedback(
    p_search_term TEXT,
    p_type TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    type TEXT,
    title TEXT,
    description TEXT,
    priority TEXT,
    status TEXT,
    category TEXT,
    tags TEXT[],
    votes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.user_id,
        f.type,
        f.title,
        f.description,
        f.priority,
        f.status,
        f.category,
        f.tags,
        f.votes,
        f.created_at,
        f.updated_at
    FROM public.user_feedback f
    WHERE 
        (p_search_term IS NULL OR (
            f.title ILIKE '%' || p_search_term || '%'
            OR f.description ILIKE '%' || p_search_term || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(f.tags) tag
                WHERE tag ILIKE '%' || p_search_term || '%'
            )
        ))
        AND (p_type IS NULL OR f.type = p_type)
        AND (p_status IS NULL OR f.status = p_status)
        AND (p_priority IS NULL OR f.priority = p_priority)
    ORDER BY f.votes DESC, f.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending feedback
CREATE OR REPLACE FUNCTION get_trending_feedback(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    type TEXT,
    priority TEXT,
    votes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.title,
        f.description,
        f.type,
        f.priority,
        f.votes,
        f.created_at
    FROM public.user_feedback f
    WHERE f.status = 'open'
    ORDER BY f.votes DESC, f.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;