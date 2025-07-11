/**
 * Workspace Middleware
 * 
 * This middleware verifies that the authenticated user has access to the
 * workspace associated with the requested resource.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware to verify workspace access
 */
export async function verifyWorkspaceAccess(req, res, next) {
  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get the user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get the workspace ID from the request
    // This could be from the URL params, query params, or request body
    const workspaceId = req.params.workspaceId || req.query.workspaceId || req.body.workspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }
    
    // Check if the user is a member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();
      
    if (membershipError || !membership) {
      return res.status(403).json({ error: 'You do not have access to this workspace' });
    }
    
    // Add the user and workspace info to the request object
    req.user = user;
    req.workspaceId = workspaceId;
    req.workspaceRole = membership.role;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error in workspace middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to verify admin or owner access
 */
export function requireAdminOrOwner(req, res, next) {
  if (!req.workspaceRole || !['admin', 'owner'].includes(req.workspaceRole)) {
    return res.status(403).json({ error: 'This action requires admin or owner privileges' });
  }
  
  next();
}

/**
 * Middleware to verify owner access
 */
export function requireOwner(req, res, next) {
  if (!req.workspaceRole || req.workspaceRole !== 'owner') {
    return res.status(403).json({ error: 'This action requires owner privileges' });
  }
  
  next();
}
