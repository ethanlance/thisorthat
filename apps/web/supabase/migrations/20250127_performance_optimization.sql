-- Migration: Performance Optimization System
-- Description: Add comprehensive performance monitoring and optimization functionality

-- Create performance_metrics table for tracking performance data
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('core_web_vitals', 'custom_metric', 'performance_budget_exceeded', 'api_response', 'image_load', 'bundle_size')),
    metric TEXT NOT NULL,
    value DECIMAL NOT NULL,
    budget DECIMAL,
    timestamp BIGINT NOT NULL,
    user_agent TEXT,
    connection_type TEXT,
    device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    url TEXT,
    lcp DECIMAL,
    fid DECIMAL,
    cls DECIMAL,
    fcp DECIMAL,
    ttfb DECIMAL,
    page_load_time DECIMAL,
    api_response_time DECIMAL,
    image_load_time DECIMAL,
    bundle_size DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_budgets table for performance thresholds
CREATE TABLE IF NOT EXISTS public.performance_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric TEXT NOT NULL UNIQUE,
    budget_value DECIMAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'ms',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_alerts table for performance alerts
CREATE TABLE IF NOT EXISTS public.performance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric TEXT NOT NULL,
    threshold DECIMAL NOT NULL,
    current_value DECIMAL NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON public.performance_metrics(type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric ON public.performance_metrics(metric);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_device_type ON public.performance_metrics(device_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_connection_type ON public.performance_metrics(connection_type);

CREATE INDEX IF NOT EXISTS idx_performance_budgets_metric ON public.performance_budgets(metric);
CREATE INDEX IF NOT EXISTS idx_performance_budgets_active ON public.performance_budgets(is_active);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_metric ON public.performance_alerts(metric);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON public.performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON public.performance_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_created_at ON public.performance_alerts(created_at);

-- Enable RLS on new tables
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance_metrics
CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert performance metrics" ON public.performance_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all performance metrics" ON public.performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for performance_budgets
CREATE POLICY "Anyone can view performance budgets" ON public.performance_budgets
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage performance budgets" ON public.performance_budgets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for performance_alerts
CREATE POLICY "Users can view their own performance alerts" ON public.performance_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all performance alerts" ON public.performance_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "System can insert performance alerts" ON public.performance_alerts
    FOR INSERT WITH CHECK (true);

-- Insert default performance budgets
INSERT INTO public.performance_budgets (metric, budget_value, unit, description) VALUES
('lcp', 2500, 'ms', 'Largest Contentful Paint should be under 2.5 seconds'),
('fid', 100, 'ms', 'First Input Delay should be under 100 milliseconds'),
('cls', 0.1, '', 'Cumulative Layout Shift should be under 0.1'),
('fcp', 1500, 'ms', 'First Contentful Paint should be under 1.5 seconds'),
('ttfb', 600, 'ms', 'Time to First Byte should be under 600 milliseconds'),
('page_load_time', 2000, 'ms', 'Page load time should be under 2 seconds'),
('api_response_time', 200, 'ms', 'API response time should be under 200 milliseconds'),
('image_load_time', 1000, 'ms', 'Image load time should be under 1 second'),
('bundle_size', 200, 'KB', 'JavaScript bundle size should be under 200KB')
ON CONFLICT (metric) DO NOTHING;

-- Function to get performance statistics
CREATE OR REPLACE FUNCTION get_performance_stats(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_metric TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    metric TEXT,
    avg_value DECIMAL,
    min_value DECIMAL,
    max_value DECIMAL,
    p50_value DECIMAL,
    p95_value DECIMAL,
    p99_value DECIMAL,
    total_measurements BIGINT,
    budget_exceeded_count BIGINT,
    budget_exceeded_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.metric,
        AVG(pm.value) as avg_value,
        MIN(pm.value) as min_value,
        MAX(pm.value) as max_value,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pm.value) as p50_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.value) as p95_value,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY pm.value) as p99_value,
        COUNT(*) as total_measurements,
        COUNT(*) FILTER (WHERE pm.budget IS NOT NULL AND pm.value > pm.budget) as budget_exceeded_count,
        ROUND(
            (COUNT(*) FILTER (WHERE pm.budget IS NOT NULL AND pm.value > pm.budget)::DECIMAL / 
             NULLIF(COUNT(*) FILTER (WHERE pm.budget IS NOT NULL), 0)) * 100, 
            2
        ) as budget_exceeded_percentage
    FROM public.performance_metrics pm
    WHERE 
        (p_start_date IS NULL OR pm.timestamp >= EXTRACT(EPOCH FROM p_start_date) * 1000)
        AND (p_end_date IS NULL OR pm.timestamp <= EXTRACT(EPOCH FROM p_end_date) * 1000)
        AND (p_metric IS NULL OR pm.metric = p_metric)
        AND (p_device_type IS NULL OR pm.device_type = p_device_type)
    GROUP BY pm.metric
    ORDER BY pm.metric;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance trends
CREATE OR REPLACE FUNCTION get_performance_trends(
    p_metric TEXT,
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    hour_bucket TIMESTAMP WITH TIME ZONE,
    avg_value DECIMAL,
    measurement_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('hour', TO_TIMESTAMP(pm.timestamp / 1000)) as hour_bucket,
        AVG(pm.value) as avg_value,
        COUNT(*) as measurement_count
    FROM public.performance_metrics pm
    WHERE 
        pm.metric = p_metric
        AND pm.timestamp >= EXTRACT(EPOCH FROM NOW() - INTERVAL '1 hour' * p_hours) * 1000
    GROUP BY DATE_TRUNC('hour', TO_TIMESTAMP(pm.timestamp / 1000))
    ORDER BY hour_bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check performance budgets
CREATE OR REPLACE FUNCTION check_performance_budgets()
RETURNS TABLE (
    metric TEXT,
    current_avg DECIMAL,
    budget_value DECIMAL,
    budget_exceeded BOOLEAN,
    exceedance_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.metric,
        AVG(pm.value) as current_avg,
        pb.budget_value,
        AVG(pm.value) > pb.budget_value as budget_exceeded,
        ROUND(
            ((AVG(pm.value) - pb.budget_value) / pb.budget_value) * 100, 
            2
        ) as exceedance_percentage
    FROM public.performance_budgets pb
    LEFT JOIN public.performance_metrics pm ON pb.metric = pm.metric
    WHERE pb.is_active = true
    GROUP BY pb.metric, pb.budget_value
    ORDER BY pb.metric;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create performance alerts
CREATE OR REPLACE FUNCTION create_performance_alerts()
RETURNS INTEGER AS $$
DECLARE
    alert_count INTEGER := 0;
    budget_check RECORD;
BEGIN
    FOR budget_check IN 
        SELECT * FROM check_performance_budgets() 
        WHERE budget_exceeded = true
    LOOP
        INSERT INTO public.performance_alerts (
            metric,
            threshold,
            current_value,
            severity,
            message
        ) VALUES (
            budget_check.metric,
            budget_check.budget_value,
            budget_check.current_avg,
            CASE 
                WHEN budget_check.exceedance_percentage > 50 THEN 'critical'
                WHEN budget_check.exceedance_percentage > 25 THEN 'high'
                WHEN budget_check.exceedance_percentage > 10 THEN 'medium'
                ELSE 'low'
            END,
            'Performance budget exceeded for ' || budget_check.metric || 
            ': ' || ROUND(budget_check.current_avg, 2) || 
            ' (budget: ' || ROUND(budget_check.budget_value, 2) || ')'
        );
        alert_count := alert_count + 1;
    END LOOP;
    
    RETURN alert_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance dashboard data
CREATE OR REPLACE FUNCTION get_performance_dashboard()
RETURNS TABLE (
    total_measurements BIGINT,
    active_alerts BIGINT,
    avg_performance_score DECIMAL,
    top_slow_metrics JSONB,
    device_breakdown JSONB,
    recent_alerts JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_measurements,
        COUNT(*) FILTER (WHERE pa.resolved = false) as active_alerts,
        ROUND(AVG(
            CASE 
                WHEN pm.metric = 'lcp' THEN GREATEST(0, 100 - (pm.value / 25))
                WHEN pm.metric = 'fid' THEN GREATEST(0, 100 - (pm.value * 10))
                WHEN pm.metric = 'cls' THEN GREATEST(0, 100 - (pm.value * 1000))
                ELSE 100
            END
        ), 2) as avg_performance_score,
        jsonb_agg(
            jsonb_build_object(
                'metric', pm.metric,
                'avg_value', ROUND(AVG(pm.value), 2),
                'budget', pb.budget_value,
                'exceeded', AVG(pm.value) > pb.budget_value
            )
        ) FILTER (WHERE pm.metric IS NOT NULL) as top_slow_metrics,
        jsonb_agg(
            jsonb_build_object(
                'device_type', pm.device_type,
                'count', COUNT(*)
            )
        ) FILTER (WHERE pm.device_type IS NOT NULL) as device_breakdown,
        jsonb_agg(
            jsonb_build_object(
                'id', pa.id,
                'metric', pa.metric,
                'severity', pa.severity,
                'message', pa.message,
                'created_at', pa.created_at
            )
        ) FILTER (WHERE pa.id IS NOT NULL) as recent_alerts
    FROM public.performance_metrics pm
    LEFT JOIN public.performance_budgets pb ON pm.metric = pb.metric
    LEFT JOIN public.performance_alerts pa ON pm.metric = pa.metric
    WHERE pm.timestamp >= EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours') * 1000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
