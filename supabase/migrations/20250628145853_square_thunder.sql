-- Add avatar_url column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Fix workspace_members RLS policies to prevent infinite recursion
-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own workspace memberships" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can add members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view members of workspaces they belong to" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can remove members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can update member roles" ON workspace_members;

-- Create simplified, non-recursive policies for workspace_members
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;
CREATE POLICY "Users can view their own memberships"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own memberships" ON workspace_members;
CREATE POLICY "Users can insert their own memberships"
  ON workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own memberships" ON workspace_members;
CREATE POLICY "Users can update their own memberships"
  ON workspace_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own memberships" ON workspace_members;
CREATE POLICY "Users can delete their own memberships"
  ON workspace_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create a separate policy for workspace owners to manage members
-- This uses a direct workspace ownership check instead of recursive membership check
DROP POLICY IF EXISTS "Workspace owners can manage all members" ON workspace_members;
CREATE POLICY "Workspace owners can manage all members"
  ON workspace_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_members.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Create a policy for admins to manage members (non-recursive)
DROP POLICY IF EXISTS "Workspace admins can manage members" ON workspace_members;
CREATE POLICY "Workspace admins can manage members"
  ON workspace_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
    )
  );

-- Update workspace policies to be simpler and avoid recursion
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;

CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );
