/*
  # Fix Workspace Schema Issues

  1. Changes
    - Add missing on_workspace_created_add_owner trigger
    - Fix workspace_members policies
    - Add missing select_own_subscriptions policy
    - Add missing users can view their own workspace memberships policy
  
  2. Security
    - Ensure proper RLS policies for workspace access
    - Fix subscription access policies
*/

-- Create trigger to add workspace owner as a member
-- Create trigger to add workspace owner as a member
DROP TRIGGER IF EXISTS on_workspace_created_add_owner ON workspaces;
CREATE TRIGGER on_workspace_created_add_owner
AFTER INSERT ON workspaces
FOR EACH ROW
EXECUTE FUNCTION add_workspace_owner_as_member();
-- Add missing policy for users to view their own workspace memberships
DROP POLICY IF EXISTS "Users can view their own workspace memberships" ON workspace_members;
CREATE POLICY "Users can view their own workspace memberships"
  ON workspace_members
  FOR SELECT
  USING (user_id = auth.uid());
-- Add missing policy for users to select their own subscriptions
DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions"
  ON subscriptions
  FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

-- Add missing policies for authenticated users to manage their subscriptions
DROP POLICY IF EXISTS "Allow authenticated users to select their own subscriptions" ON subscriptions;
CREATE POLICY "Allow authenticated users to select their own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Allow authenticated users to insert subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow authenticated users to update their own subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ))
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete their own subscriptions"
  ON subscriptions
  FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

-- Fix workspace_members policies
DROP POLICY IF EXISTS "Users can insert their own workspace memberships" ON workspace_members;
CREATE POLICY "Users can insert their own workspace memberships"
  ON workspace_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
