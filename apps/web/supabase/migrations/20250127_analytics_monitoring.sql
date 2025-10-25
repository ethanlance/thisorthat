-- Migration: Analytics & Monitoring System
-- Description: Add comprehensive analytics and monitoring functionality

-- Create analytics_events table for tracking user events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event TEXT NOT NULL,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    label TEXT,
    value DECIMAL,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    url TEXT,
    user_agent TEXT,
    referrer TEXT,
    device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    connection_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in milliseconds
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    referrer TEXT,
    user_agent TEXT,
    device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    connection_type TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_metrics table for storing calculated business metrics
CREATE TABLE IF NOT EXISTS public.business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_unit TEXT NOT NULL,
    time_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    date DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_analytics table for poll-specific analytics
CREATE TABLE IF NOT EXISTS public.poll_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    votes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    completion_rate DECIMAL DEFAULT 0,
    average_time_on_poll INTEGER DEFAULT 0, -- in milliseconds
    bounce_rate DECIMAL DEFAULT 0,
    conversion_rate DECIMAL DEFAULT 0,
    engagement_score DECIMAL DEFAULT 0,
    trending_score DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_analytics table for user-specific analytics
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0, -- in milliseconds
    total_page_views INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    favorite_categories TEXT[] DEFAULT '{}',
    engagement_score DECIMAL DEFAULT 0,
    retention_rate DECIMAL DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_metrics table for system monitoring
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_unit TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monitoring_alerts table for system alerts
CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metric_name TEXT,
    threshold_value DECIMAL,
    current_value DECIMAL,
    status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON public.analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON public.analytics_events(category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON public.analytics_events(action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_device_type ON public.analytics_events(device_type);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON public.user_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_business_metrics_metric_name ON public.business_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_business_metrics_time_period ON public.business_metrics(time_period);
CREATE INDEX IF NOT EXISTS idx_business_metrics_date ON public.business_metrics(date);

CREATE INDEX IF NOT EXISTS idx_poll_analytics_poll_id ON public.poll_analytics(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_analytics_date ON public.poll_analytics(date);
CREATE INDEX IF NOT EXISTS idx_poll_analytics_engagement_score ON public.poll_analytics(engagement_score);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON public.user_analytics(date);
CREATE INDEX IF NOT EXISTS idx_user_analytics_engagement_score ON public.user_analytics(engagement_score);

CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_name ON public.system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON public.system_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_alert_type ON public.monitoring_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON public.monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON public.monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at ON public.monitoring_alerts(created_at);

-- Enable RLS on new tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
CREATE POLICY "Users can view their own analytics events" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all analytics events" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert user sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all user sessions" ON public.user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for business_metrics
CREATE POLICY "Anyone can view business metrics" ON public.business_metrics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage business metrics" ON public.business_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for poll_analytics
CREATE POLICY "Users can view poll analytics for their polls" ON public.poll_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_analytics.poll_id 
            AND polls.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all poll analytics" ON public.poll_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for user_analytics
CREATE POLICY "Users can view their own analytics" ON public.user_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user analytics" ON public.user_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for system_metrics
CREATE POLICY "Admins can view system metrics" ON public.system_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "System can insert system metrics" ON public.system_metrics
    FOR INSERT WITH CHECK (true);

-- RLS Policies for monitoring_alerts
CREATE POLICY "Admins can view monitoring alerts" ON public.monitoring_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "System can insert monitoring alerts" ON public.monitoring_alerts
    FOR INSERT WITH CHECK (true);

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_events BIGINT,
    unique_users BIGINT,
    total_sessions BIGINT,
    average_session_duration DECIMAL,
    total_page_views BIGINT,
    engagement_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT ae.user_id) as unique_users,
        COUNT(DISTINCT ae.session_id) as total_sessions,
        AVG(us.duration) as average_session_duration,
        COUNT(*) FILTER (WHERE ae.event = 'page_view') as total_page_views,
        ROUND(
            (COUNT(*) FILTER (WHERE ae.action IN ('vote', 'share', 'comment'))::DECIMAL / 
             NULLIF(COUNT(*) FILTER (WHERE ae.event = 'page_view'), 0)) * 100, 
            2
        ) as engagement_rate
    FROM public.analytics_events ae
    LEFT JOIN public.user_sessions us ON ae.session_id = us.id
    WHERE ae.timestamp::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user engagement metrics
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(
    p_user_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_sessions BIGINT,
    total_page_views BIGINT,
    total_events BIGINT,
    average_session_duration DECIMAL,
    engagement_score DECIMAL,
    favorite_categories TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT ae.session_id) as total_sessions,
        COUNT(*) FILTER (WHERE ae.event = 'page_view') as total_page_views,
        COUNT(*) as total_events,
        AVG(us.duration) as average_session_duration,
        ROUND(
            (COUNT(*) FILTER (WHERE ae.action IN ('vote', 'share', 'comment'))::DECIMAL / 
             NULLIF(COUNT(*) FILTER (WHERE ae.event = 'page_view'), 0)) * 100, 
            2
        ) as engagement_score,
        ARRAY['Technology', 'Entertainment', 'Sports'] as favorite_categories
    FROM public.analytics_events ae
    LEFT JOIN public.user_sessions us ON ae.session_id = us.id
    WHERE ae.user_id = p_user_id
    AND ae.timestamp::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get poll performance metrics
CREATE OR REPLACE FUNCTION get_poll_performance_metrics(
    p_poll_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    views BIGINT,
    votes BIGINT,
    shares BIGINT,
    comments BIGINT,
    completion_rate DECIMAL,
    engagement_score DECIMAL,
    trending_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE ae.event = 'page_view' AND ae.properties->>'pollId' = p_poll_id::TEXT) as views,
        COUNT(*) FILTER (WHERE ae.action = 'vote' AND ae.properties->>'pollId' = p_poll_id::TEXT) as votes,
        COUNT(*) FILTER (WHERE ae.action = 'share' AND ae.properties->>'pollId' = p_poll_id::TEXT) as shares,
        COUNT(*) FILTER (WHERE ae.action = 'comment' AND ae.properties->>'pollId' = p_poll_id::TEXT) as comments,
        ROUND(
            (COUNT(*) FILTER (WHERE ae.action = 'vote' AND ae.properties->>'pollId' = p_poll_id::TEXT)::DECIMAL / 
             NULLIF(COUNT(*) FILTER (WHERE ae.event = 'page_view' AND ae.properties->>'pollId' = p_poll_id::TEXT), 0)) * 100, 
            2
        ) as completion_rate,
        ROUND(
            (COUNT(*) FILTER (WHERE ae.action IN ('vote', 'share', 'comment') AND ae.properties->>'pollId' = p_poll_id::TEXT)::DECIMAL / 
             NULLIF(COUNT(*) FILTER (WHERE ae.event = 'page_view' AND ae.properties->>'pollId' = p_poll_id::TEXT), 0)) * 100, 
            2
        ) as engagement_score,
        ROUND(
            (COUNT(*) FILTER (WHERE ae.action = 'share' AND ae.properties->>'pollId' = p_poll_id::TEXT)::DECIMAL / 
             NULLIF(COUNT(*) FILTER (WHERE ae.event = 'page_view' AND ae.properties->>'pollId' = p_poll_id::TEXT), 0)) * 100, 
            2
        ) as trending_score
    FROM public.analytics_events ae
    WHERE ae.timestamp::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create monitoring alerts
CREATE OR REPLACE FUNCTION create_monitoring_alert(
    p_alert_type TEXT,
    p_severity TEXT,
    p_title TEXT,
    p_description TEXT,
    p_metric_name TEXT DEFAULT NULL,
    p_threshold_value DECIMAL DEFAULT NULL,
    p_current_value DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO public.monitoring_alerts (
        alert_type,
        severity,
        title,
        description,
        metric_name,
        threshold_value,
        current_value,
        status
    ) VALUES (
        p_alert_type,
        p_severity,
        p_title,
        p_description,
        p_metric_name,
        p_threshold_value,
        p_current_value,
        'active'
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system health metrics
CREATE OR REPLACE FUNCTION get_system_health_metrics()
RETURNS TABLE (
    metric_name TEXT,
    current_value DECIMAL,
    threshold_value DECIMAL,
    status TEXT,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.metric_name,
        sm.metric_value as current_value,
        CASE 
            WHEN sm.metric_name = 'api_response_time' THEN 200
            WHEN sm.metric_name = 'error_rate' THEN 5
            WHEN sm.metric_name = 'cpu_usage' THEN 80
            WHEN sm.metric_name = 'memory_usage' THEN 85
            ELSE 100
        END as threshold_value,
        CASE 
            WHEN sm.metric_name = 'api_response_time' AND sm.metric_value > 200 THEN 'critical'
            WHEN sm.metric_name = 'error_rate' AND sm.metric_value > 5 THEN 'critical'
            WHEN sm.metric_name = 'cpu_usage' AND sm.metric_value > 80 THEN 'warning'
            WHEN sm.metric_name = 'memory_usage' AND sm.metric_value > 85 THEN 'warning'
            ELSE 'healthy'
        END as status,
        sm.timestamp as last_updated
    FROM public.system_metrics sm
    WHERE sm.timestamp > NOW() - INTERVAL '1 hour'
    ORDER BY sm.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
