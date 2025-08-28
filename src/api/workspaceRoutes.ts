/**
 * Workspace API Routes
 * 
 * This file contains the API routes for workspace management.
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyWorkspaceAccess, requireAdminOrOwner, requireOwner } from '../middleware/workspaceMiddleware.js';
import { authenticateUser } from '../middleware/authMiddleware.js'; // Import the new middleware

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

/**
 * Get all workspaces for the authenticated user
 */
router.get('/workspaces', authenticateUser, async (req, res) => {
  try {
    // Get the user's workspaces
    const { data, error } = await supabase
      .rpc('get_user_workspaces', { user_uuid: req.user.id });
      
    if (error) {
      console.error('Error fetching workspaces:', error);
      return res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
    
    return res.status(200).json({ workspaces: data });
  } catch (error) {
    console.error('Error in /workspaces:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new workspace
 */
router.post('/workspaces', authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }
    
    // Create the workspace
    const { data, error } = await supabase
      .from('workspaces')
      .insert([{ name, owner_id: req.user.id }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating workspace:', error);
      return res.status(500).json({ error: 'Failed to create workspace' });
    }
    
    return res.status(201).json({ workspace: data });
  } catch (error) {
    console.error('Error in POST /workspaces:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get workspace details
 */
router.get('/workspaces/:workspaceId', verifyWorkspaceAccess, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', req.workspaceId)
      .single();
      
    if (error) {
      console.error('Error fetching workspace:', error);
      return res.status(500).json({ error: 'Failed to fetch workspace' });
    }
    
    return res.status(200).json({ workspace: data });
  } catch (error) {
    console.error(`Error in GET /workspaces/${req.workspaceId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update workspace details
 */
router.patch('/workspaces/:workspaceId', verifyWorkspaceAccess, requireOwner, async (req, res) => {
  try {
    const { name, logo_url } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (logo_url) updates.logo_url = logo_url;
    
    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', req.workspaceId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating workspace:', error);
      return res.status(500).json({ error: 'Failed to update workspace' });
    }
    
    return res.status(200).json({ workspace: data });
  } catch (error) {
    console.error(`Error in PATCH /workspaces/${req.workspaceId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a workspace
 */
router.delete('/workspaces/:workspaceId', verifyWorkspaceAccess, requireOwner, async (req, res) => {
  try {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', req.workspaceId);
      
    if (error) {
      console.error('Error deleting workspace:', error);
      return res.status(500).json({ error: 'Failed to delete workspace' });
    }
    
    return res.status(200).json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error(`Error in DELETE /workspaces/${req.workspaceId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get workspace members
 */
router.get('/workspaces/:workspaceId/members', verifyWorkspaceAccess, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        user_id,
        role,
        created_at,
        users:user_id (
          email,
          name,
          avatar_url
        )
      `)
      .eq('workspace_id', req.workspaceId);
      
    if (error) {
      console.error('Error fetching workspace members:', error);
      return res.status(500).json({ error: 'Failed to fetch workspace members' });
    }
    
    const members = data.map(item => ({
      id: item.user_id,
      email: item.users.email,
      name: item.users.name,
      role: item.role,
      avatar_url: item.users.avatar_url,
      joined_at: item.created_at
    }));
    
    return res.status(200).json({ members });
  } catch (error) {
    console.error(`Error in GET /workspaces/${req.workspaceId}/members:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update member role
 */
router.patch('/workspaces/:workspaceId/members/:userId', verifyWorkspaceAccess, requireAdminOrOwner, async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    
    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if the target user is the workspace owner
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', req.workspaceId)
      .single();
      
    if (workspaceError) {
      console.error('Error fetching workspace:', workspaceError);
      return res.status(500).json({ error: 'Failed to fetch workspace' });
    }
    
    if (workspace.owner_id === userId) {
      return res.status(403).json({ error: 'Cannot change the role of the workspace owner' });
    }
    
    // Update the member's role
    const { error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', req.workspaceId)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error updating member role:', error);
      return res.status(500).json({ error: 'Failed to update member role' });
    }
    
    return res.status(200).json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error(`Error in PATCH /workspaces/${req.workspaceId}/members/${req.params.userId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Remove member from workspace
 */
router.delete('/workspaces/:workspaceId/members/:userId', verifyWorkspaceAccess, requireAdminOrOwner, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if the target user is the workspace owner
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', req.workspaceId)
      .single();
      
    if (workspaceError) {
      console.error('Error fetching workspace:', workspaceError);
      return res.status(500).json({ error: 'Failed to fetch workspace' });
    }
    
    if (workspace.owner_id === userId) {
      return res.status(403).json({ error: 'Cannot remove the workspace owner' });
    }
    
    // Remove the member
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', req.workspaceId)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error removing member:', error);
      return res.status(500).json({ error: 'Failed to remove member' });
    }
    
    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(`Error in DELETE /workspaces/${req.workspaceId}/members/${req.params.userId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Invite user to workspace
 */
router.post('/workspaces/:workspaceId/invite', verifyWorkspaceAccess, requireAdminOrOwner, async (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Create the invitation
    const invitationId = await supabase.rpc('invite_user_to_workspace', {
      workspace_uuid: req.workspaceId,
      user_email: email,
      user_role: role,
      inviter_uuid: req.user.id
    });
    
    if (!invitationId) {
      return res.status(500).json({ error: 'Failed to create invitation' });
    }
    
    // In a real implementation, you would send an email to the user with the invitation link
    // For this example, we'll just return the invitation ID
    
    return res.status(200).json({ 
      message: 'Invitation sent successfully',
      invitationId
    });
  } catch (error) {
    console.error(`Error in POST /workspaces/${req.workspaceId}/invite:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get workspace invitations
 */
router.get('/workspaces/:workspaceId/invitations', verifyWorkspaceAccess, requireAdminOrOwner, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workspace_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        created_at,
        created_by,
        users:created_by (
          email,
          name
        )
      `)
      .eq('workspace_id', req.workspaceId);
      
    if (error) {
      console.error('Error fetching invitations:', error);
      return res.status(500).json({ error: 'Failed to fetch invitations' });
    }
    
    const invitations = data.map(item => ({
      id: item.id,
      email: item.email,
      role: item.role,
      expires_at: item.expires_at,
      created_at: item.created_at,
      created_by: {
        name: item.users?.name,
        email: item.users?.email
      }
    }));
    
    return res.status(200).json({ invitations });
  } catch (error) {
    console.error(`Error in GET /workspaces/${req.workspaceId}/invitations:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Cancel invitation
 */
router.delete('/workspaces/:workspaceId/invitations/:invitationId', verifyWorkspaceAccess, requireAdminOrOwner, async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const { error } = await supabase
      .from('workspace_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('workspace_id', req.workspaceId);
      
    if (error) {
      console.error('Error canceling invitation:', error);
      return res.status(500).json({ error: 'Failed to cancel invitation' });
    }
    
    return res.status(200).json({ message: 'Invitation canceled successfully' });
  } catch (error) {
    console.error(`Error in DELETE /workspaces/${req.workspaceId}/invitations/${req.params.invitationId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Accept invitation
 */
router.post('/invitations/accept', authenticateUser, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }
    
    // Accept the invitation
    const success = await supabase.rpc('accept_workspace_invitation', {
      invitation_token: token,
      user_uuid: req.user.id
    });
    
    if (!success) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }
    
    return res.status(200).json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Error in POST /invitations/accept:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
