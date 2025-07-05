import { Request, Response, NextFunction, RequestHandler } from 'express';
import { supabase } from '../lib/supabaseClient';

// Define a constant for the admin role to avoid magic strings
const ADMIN_ROLE = 'admin';

export const adminAuthMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.warn('Authentication attempt without token.');
      res.status(401).json({ error: 'Authentication required: No token provided.' });
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error(`Supabase user fetch error: ${userError.message}`);
      res.status(401).json({ error: `Authentication failed: ${userError.message}` });
      return;
    }
    if (!user) {
      console.warn('Authentication failed: User not found or token expired.');
      res.status(401).json({ error: 'Authentication failed: Invalid or expired token.' });
      return;
    }

    // Check if the user is an admin in any workspace
    const { data: memberData, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', ADMIN_ROLE)
      .limit(1);

    if (memberError) {
      console.error(`Error checking admin role for user ${user.id}: ${memberError.message}`);
      res.status(500).json({ error: 'Internal server error during role verification.' });
      return;
    }

    if (!memberData || memberData.length === 0) {
      console.warn(`Access denied for user ${user.id}: Not an administrator.`);
      res.status(403).json({ error: 'Access denied: User is not an administrator.' });
      return;
    }

    // Attach user and their admin status to the request for further use
    req.user = user;
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Unhandled authentication middleware error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Internal server error during authentication process.' });
    return;
  }
};
