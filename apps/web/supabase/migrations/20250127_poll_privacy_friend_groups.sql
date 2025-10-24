-- Poll Privacy & Friend Groups Database Schema
-- Supports private polls, friend groups, and access management

-- Add privacy fields to polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'group'));
ALTER TABLE polls ADD COLUMN IF NOT EXISTS friend_group_id UUID REFERENCES friend_groups(id) ON DELETE SET NULL;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP WITH TIME ZONE;

-- Create friend_groups table
CREATE TABLE IF NOT EXISTS friend_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES friend_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(group_id, user_id)
);

-- Create poll_shares table for access management
CREATE TABLE IF NOT EXISTS poll_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_level TEXT DEFAULT 'view_vote' CHECK (access_level IN ('view', 'view_vote', 'admin')),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(poll_id, user_id)
);

-- Create poll_invitations table
CREATE TABLE IF NOT EXISTS poll_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create group_invitations table
CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES friend_groups(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_polls_privacy ON polls(privacy_level);
CREATE INDEX IF NOT EXISTS idx_polls_friend_group ON polls(friend_group_id);
CREATE INDEX IF NOT EXISTS idx_friend_groups_created_by ON friend_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_friend_groups_public ON friend_groups(is_public);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_shares_poll ON poll_shares(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_shares_user ON poll_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_shares_active ON poll_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_poll_invitations_poll ON poll_invitations(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_invitations_user ON poll_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_poll_invitations_status ON poll_invitations(status);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_user ON group_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON group_invitations(status);

-- RLS Policies for friend_groups
CREATE POLICY "Users can create friend groups" ON friend_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view public groups and their own groups" ON friend_groups
  FOR SELECT USING (
    is_public = TRUE OR 
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = friend_groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can update their groups" ON friend_groups
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" ON friend_groups
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for group_members
CREATE POLICY "Group members can view group membership" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friend_groups 
      WHERE id = group_id AND (
        is_public = TRUE OR 
        created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM group_members gm2 
          WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Group admins can manage members" ON group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM friend_groups 
      WHERE id = group_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for poll_shares
CREATE POLICY "Poll creators can manage shares" ON poll_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE id = poll_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own shares" ON poll_shares
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for poll_invitations
CREATE POLICY "Poll creators can send invitations" ON poll_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE id = poll_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own invitations" ON poll_invitations
  FOR SELECT USING (auth.uid() = invited_user_id);

CREATE POLICY "Users can respond to their invitations" ON poll_invitations
  FOR UPDATE USING (auth.uid() = invited_user_id);

-- RLS Policies for group_invitations
CREATE POLICY "Group admins can send invitations" ON group_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM friend_groups 
      WHERE id = group_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_invitations.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own group invitations" ON group_invitations
  FOR SELECT USING (auth.uid() = invited_user_id);

CREATE POLICY "Users can respond to their group invitations" ON group_invitations
  FOR UPDATE USING (auth.uid() = invited_user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_friend_groups_updated_at
  BEFORE UPDATE ON friend_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's accessible polls
CREATE OR REPLACE FUNCTION get_user_accessible_polls(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  poll_id UUID,
  title TEXT,
  description TEXT,
  privacy_level TEXT,
  friend_group_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  access_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.option_a_label || ' vs ' || p.option_b_label as title,
    p.description,
    p.privacy_level,
    p.friend_group_id,
    p.created_at,
    COALESCE(ps.access_level, 'view_vote') as access_level
  FROM polls p
  LEFT JOIN poll_shares ps ON p.id = ps.poll_id AND ps.user_id = p_user_id AND ps.is_active = TRUE
  WHERE 
    p.privacy_level = 'public' OR
    (p.privacy_level = 'private' AND ps.user_id = p_user_id) OR
    (p.privacy_level = 'group' AND EXISTS (
      SELECT 1 FROM group_members gm 
      WHERE gm.group_id = p.friend_group_id AND gm.user_id = p_user_id
    ))
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friend group members
CREATE OR REPLACE FUNCTION get_group_members(
  p_group_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.user_id,
    COALESCE(profiles.display_name, u.email) as display_name,
    u.email,
    gm.role,
    gm.joined_at
  FROM group_members gm
  JOIN auth.users u ON gm.user_id = u.id
  LEFT JOIN profiles ON gm.user_id = profiles.id
  WHERE gm.group_id = p_group_id
  ORDER BY gm.joined_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to poll
CREATE OR REPLACE FUNCTION user_has_poll_access(
  p_user_id UUID,
  p_poll_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
BEGIN
  SELECT privacy_level, friend_group_id, creator_id INTO poll_record
  FROM polls WHERE id = p_poll_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Public polls are accessible to everyone
  IF poll_record.privacy_level = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Poll creator always has access
  IF poll_record.creator_id = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check private poll access
  IF poll_record.privacy_level = 'private' THEN
    RETURN EXISTS (
      SELECT 1 FROM poll_shares 
      WHERE poll_id = p_poll_id AND user_id = p_user_id AND is_active = TRUE
    );
  END IF;
  
  -- Check group poll access
  IF poll_record.privacy_level = 'group' AND poll_record.friend_group_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = poll_record.friend_group_id AND user_id = p_user_id
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
