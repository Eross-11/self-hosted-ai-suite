import express from 'express';
import { Request, Response } from 'express';
import { supabase } from '../lib/supabaseClient';
import { adminAuthMiddleware } from '../middleware/authMiddleware';

// Helper function for consistent error handling
const handleSupabaseError = (error: Error, res: Response) => {
  console.error('Supabase error:', error); // Log the error for debugging
  res.status(500).json({ error: error.message });
};

const router = express.Router();

// Get all users (admin only)
router.get('/users', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json(data.users);
});

// Change user role (admin only)
router.post('/users/:id/role', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, workspace_id } = req.body;
  if (!workspace_id) {
    res.status(400).json({ error: 'workspace_id is required' });
    return;
  }
  // Update role in workspace_members for the specific workspace
  const { error } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('user_id', id)
    .eq('workspace_id', workspace_id);
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});

// Add user to workspace
router.post('/workspaces/:id/add-user', async (req: Request, res: Response) => {
  const { id: workspace_id } = req.params;
  const { userId } = req.body;
  // Default role: member
  const { error } = await supabase.from('workspace_members').insert({ workspace_id, user_id: userId, role: 'member' });
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});

// Get all workspaces
router.get('/workspaces', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('workspaces').select('*');
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json(data);
});

// Create workspace
router.post('/workspaces', async (req: Request, res: Response) => {
  const { name, owner_id } = req.body;
  const { data, error } = await supabase.from('workspaces').insert({ name, owner_id });
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json(data);
});

// Rename workspace
router.post('/workspaces/:id/rename', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const { error } = await supabase.from('workspaces').update({ name }).eq('id', id);
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});

// Delete workspace
router.delete('/workspaces/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('workspaces').delete().eq('id', id);
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});

// Deactivate/reactivate user
router.post('/users/:id/deactivate', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.auth.admin.updateUserById(id, { app_metadata: { banned: true } });
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});
router.post('/users/:id/reactivate', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.auth.admin.updateUserById(id, { app_metadata: { banned: false } });
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});

// Roles CRUD (example: create, rename, delete)
router.post('/roles', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { name } = req.body;
  const { error } = await supabase.from('roles').insert({ name });
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});
router.post('/roles/:id/rename', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const { error } = await supabase.from('roles').update({ name }).eq('id', id);
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});
router.delete('/roles/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});

// --- Audit Log Table and Endpoints ---
// (Assume a table 'admin_audit_logs' with columns: id, action, user_id, details, created_at)

// Log an admin action
router.post('/audit-log', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { action, user_id, details } = req.body;

  if (!action) {
    res.status(400).json({ error: 'Action is required for audit log' });
    return;
  }

  const { error } = await supabase
    .from('admin_audit_logs')
    .insert({ action, user_id, details });
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json({ success: true });
});

// Get recent audit logs
router.get('/audit-log', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) {
    handleSupabaseError(error, res);
    return;
  }
  res.json(data);
});

export default router;
