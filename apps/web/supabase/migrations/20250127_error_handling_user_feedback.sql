-- Error Handling & User Feedback Database Schema
-- Supports comprehensive error tracking, user feedback, and system monitoring

-- Create error_reports table for tracking application errors
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL CHECK (error_type IN ('network', 'validation', 'authentication', 'authorization', 'system', 'unknown')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_feedback table for user feedback and bug reports
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback', 'error_report')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'in_progress', 'resolved', 'closed')),
  attachments TEXT[] DEFAULT '{}',
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback_responses table for managing feedback responses
CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES user_feedback(id) ON DELETE CASCADE NOT NULL,
  responder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('admin_response', 'status_update', 'resolution')),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create error_patterns table for identifying common error patterns
CREATE TABLE IF NOT EXISTS error_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_name TEXT NOT NULL,
  error_signature TEXT NOT NULL,
  error_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  auto_resolution TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_health_metrics table for monitoring system health
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT,
  category TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_reports_type ON error_reports(error_type);
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON error_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_priority ON user_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback_id ON feedback_responses(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_responder_id ON feedback_responses(responder_id);

CREATE INDEX IF NOT EXISTS idx_system_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_category ON system_health_metrics(category);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_timestamp ON system_health_metrics(timestamp);

-- RLS Policies for error_reports
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for service role" ON error_reports FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON error_reports FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable update for service role" ON error_reports FOR UPDATE USING (auth.role() = 'service_role');

-- RLS Policies for user_feedback
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for own feedback" ON user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON user_feedback FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for own feedback" ON user_feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable read access for service role" ON user_feedback FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Enable update for service role" ON user_feedback FOR UPDATE USING (auth.role() = 'service_role');

-- RLS Policies for feedback_responses
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for feedback owner" ON feedback_responses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_feedback 
    WHERE user_feedback.id = feedback_responses.feedback_id 
    AND user_feedback.user_id = auth.uid()
  )
);
CREATE POLICY "Enable insert for service role" ON feedback_responses FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable read access for service role" ON feedback_responses FOR SELECT USING (auth.role() = 'service_role');

-- RLS Policies for error_patterns
ALTER TABLE error_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for service role" ON error_patterns FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON error_patterns FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable update for service role" ON error_patterns FOR UPDATE USING (auth.role() = 'service_role');

-- RLS Policies for system_health_metrics
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for service role" ON system_health_metrics FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON system_health_metrics FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_error_reports_updated_at BEFORE UPDATE ON error_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_feedback_updated_at BEFORE UPDATE ON user_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_error_patterns_updated_at BEFORE UPDATE ON error_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get error statistics
CREATE OR REPLACE FUNCTION get_error_stats(timeframe_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  total_errors BIGINT,
  errors_by_type JSONB,
  errors_by_severity JSONB,
  recent_errors JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_errors,
    jsonb_object_agg(error_type, type_count) as errors_by_type,
    jsonb_object_agg(severity, severity_count) as errors_by_severity,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'error_type', error_type,
        'error_message', error_message,
        'severity', severity,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as recent_errors
  FROM (
    SELECT 
      id,
      error_type,
      error_message,
      severity,
      created_at,
      COUNT(*) OVER (PARTITION BY error_type) as type_count,
      COUNT(*) OVER (PARTITION BY severity) as severity_count
    FROM error_reports 
    WHERE created_at >= NOW() - INTERVAL '1 hour' * timeframe_hours
  ) stats;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user feedback summary
CREATE OR REPLACE FUNCTION get_user_feedback_summary(user_id_param UUID)
RETURNS TABLE (
  total_feedback BIGINT,
  feedback_by_type JSONB,
  feedback_by_status JSONB,
  recent_feedback JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_feedback,
    jsonb_object_agg(feedback_type, type_count) as feedback_by_type,
    jsonb_object_agg(status, status_count) as feedback_by_status,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'feedback_type', feedback_type,
        'title', title,
        'status', status,
        'priority', priority,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) as recent_feedback
  FROM (
    SELECT 
      id,
      feedback_type,
      title,
      status,
      priority,
      created_at,
      COUNT(*) OVER (PARTITION BY feedback_type) as type_count,
      COUNT(*) OVER (PARTITION BY status) as status_count
    FROM user_feedback 
    WHERE user_id = user_id_param
  ) stats;
END;
$$ LANGUAGE plpgsql;

