-- Content Moderation System Database Schema
-- Supports automated content detection, user reporting, and moderation tools

-- Create content_reports table for user reports
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('poll', 'comment', 'user', 'image')),
  content_id UUID NOT NULL, -- ID of the reported content
  report_category TEXT NOT NULL CHECK (report_category IN (
    'inappropriate_content', 'spam', 'harassment', 'violence', 'hate_speech', 'other'
  )),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation_actions table for tracking moderator decisions
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('poll', 'comment', 'user', 'image')),
  content_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'approve', 'reject', 'delete', 'hide', 'escalate', 'warn_user'
  )),
  reason TEXT,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_classifications table for storing detection results
CREATE TABLE IF NOT EXISTS content_classifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('poll', 'comment', 'image')),
  content_id UUID NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('safe', 'questionable', 'inappropriate', 'spam')),
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  detection_method TEXT NOT NULL, -- 'automated', 'manual', 'api'
  details JSONB, -- Additional classification details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation_policies table for configurable rules
CREATE TABLE IF NOT EXISTS moderation_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_name TEXT NOT NULL UNIQUE,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('content', 'behavior', 'spam')),
  rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_appeals table for appeals process
CREATE TABLE IF NOT EXISTS content_appeals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appealer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  moderation_action_id UUID REFERENCES moderation_actions(id) ON DELETE CASCADE NOT NULL,
  appeal_reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_moderation_history table for tracking user violations
CREATE TABLE IF NOT EXISTS user_moderation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  violation_type TEXT NOT NULL,
  violation_description TEXT,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action_taken TEXT NOT NULL,
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_content ON moderation_actions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_content_classifications_content ON content_classifications(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_classifications_classification ON content_classifications(classification);
CREATE INDEX IF NOT EXISTS idx_content_appeals_status ON content_appeals(status);
CREATE INDEX IF NOT EXISTS idx_user_moderation_history_user ON user_moderation_history(user_id);

-- RLS Policies for content_reports
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports" ON content_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'moderator'
    )
  );

CREATE POLICY "Moderators can update reports" ON content_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'moderator'
    )
  );

-- RLS Policies for moderation_actions
CREATE POLICY "Moderators can create actions" ON moderation_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'moderator'
    )
  );

CREATE POLICY "Moderators can view all actions" ON moderation_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'moderator'
    )
  );

-- RLS Policies for content_classifications
CREATE POLICY "System can create classifications" ON content_classifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Moderators can view classifications" ON content_classifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'moderator'
    )
  );

-- RLS Policies for moderation_policies
CREATE POLICY "Moderators can manage policies" ON moderation_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'moderator'
    )
  );

-- RLS Policies for content_appeals
CREATE POLICY "Users can create appeals" ON content_appeals
  FOR INSERT WITH CHECK (auth.uid() = appealer_id);

CREATE POLICY "Users can view their own appeals" ON content_appeals
  FOR SELECT USING (auth.uid() = appealer_id);

CREATE POLICY "Moderators can view all appeals" ON content_appeals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'moderator'
    )
  );

CREATE POLICY "Moderators can update appeals" ON content_appeals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'moderator'
    )
  );

-- RLS Policies for user_moderation_history
CREATE POLICY "Moderators can manage user history" ON user_moderation_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'moderator'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_content_reports_updated_at
  BEFORE UPDATE ON content_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_policies_updated_at
  BEFORE UPDATE ON moderation_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_appeals_updated_at
  BEFORE UPDATE ON content_appeals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get moderation queue for moderators
CREATE OR REPLACE FUNCTION get_moderation_queue(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  report_id UUID,
  content_type TEXT,
  content_id UUID,
  report_category TEXT,
  description TEXT,
  reporter_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.content_type,
    cr.content_id,
    cr.report_category,
    cr.description,
    u.email as reporter_email,
    cr.created_at,
    cr.status
  FROM content_reports cr
  LEFT JOIN auth.users u ON cr.reporter_id = u.id
  WHERE cr.status = 'pending'
  ORDER BY cr.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content moderation statistics
CREATE OR REPLACE FUNCTION get_moderation_stats()
RETURNS TABLE (
  total_reports BIGINT,
  pending_reports BIGINT,
  resolved_reports BIGINT,
  total_actions BIGINT,
  appeals_pending BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM content_reports) as total_reports,
    (SELECT COUNT(*) FROM content_reports WHERE status = 'pending') as pending_reports,
    (SELECT COUNT(*) FROM content_reports WHERE status = 'resolved') as resolved_reports,
    (SELECT COUNT(*) FROM moderation_actions) as total_actions,
    (SELECT COUNT(*) FROM content_appeals WHERE status = 'pending') as appeals_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default moderation policies
INSERT INTO moderation_policies (policy_name, policy_type, rules, created_by) VALUES
(
  'image_content_policy',
  'content',
  '{
    "blocked_categories": ["adult", "violence", "hate_speech"],
    "confidence_threshold": 0.8,
    "auto_reject_threshold": 0.9,
    "human_review_threshold": 0.7
  }'::jsonb,
  NULL
),
(
  'spam_detection_policy',
  'spam',
  '{
    "max_reports_per_user": 5,
    "max_reports_per_content": 3,
    "auto_hide_threshold": 0.8,
    "spam_keywords": ["spam", "scam", "fake"]
  }'::jsonb,
  NULL
),
(
  'user_behavior_policy',
  'behavior',
  '{
    "max_violations_before_ban": 3,
    "warning_threshold": 1,
    "escalation_threshold": 2,
    "ban_duration_days": 7
  }'::jsonb,
  NULL
) ON CONFLICT (policy_name) DO NOTHING;
