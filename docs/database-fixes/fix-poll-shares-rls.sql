-- Fix infinite recursion in poll_shares RLS policies
-- Run this in your Supabase SQL Editor
-- 
-- CRITICAL: poll_shares policies must NOT reference the polls table
-- to avoid circular dependency (polls references poll_shares, which would reference polls)

-- 1. Drop any existing policies on poll_shares that might be causing recursion
DROP POLICY IF EXISTS "Users can view shares for their polls" ON poll_shares;
DROP POLICY IF EXISTS "Users can view polls shared with them" ON poll_shares;
DROP POLICY IF EXISTS "Poll creators and sharers can view shares" ON poll_shares;
DROP POLICY IF EXISTS "Users can view their shared polls" ON poll_shares;
DROP POLICY IF EXISTS "Poll creators can view shares" ON poll_shares;
DROP POLICY IF EXISTS "Users can view shares to them" ON poll_shares;
DROP POLICY IF EXISTS "Users can view shares they created" ON poll_shares;
DROP POLICY IF EXISTS "Poll creators can create shares" ON poll_shares;
DROP POLICY IF EXISTS "Poll creators can delete shares" ON poll_shares;

-- 2. Create simple, non-recursive policies for poll_shares
-- These policies do NOT reference the polls table to break the circular dependency

-- Users can view shares where they are the recipient (shared with them)
CREATE POLICY "Users can view their shared polls"
  ON poll_shares FOR SELECT
  USING (user_id = auth.uid());

-- Users can view shares they created (as the sharer)
CREATE POLICY "Sharers can view their shares"
  ON poll_shares FOR SELECT
  USING (shared_by = auth.uid());

-- Authenticated users can create shares (poll ownership checked in application layer)
-- We trust foreign key constraints and check ownership in the service layer
CREATE POLICY "Authenticated users can create shares"
  ON poll_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

-- Sharers can delete their own shares
CREATE POLICY "Sharers can delete their shares"
  ON poll_shares FOR DELETE
  USING (shared_by = auth.uid());

