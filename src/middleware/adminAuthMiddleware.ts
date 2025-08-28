import { Request, Response, NextFunction, RequestHandler } from 'express';
import { supabase } from '../lib/supabaseClient'; // Keep this for Supabase client initialization
import { authenticateUser } from './authMiddleware.js'; // Import the generic authentication middleware

// Define a constant for the admin role to avoid magic strings
const ADMIN_ROLE = 'admin';

export const adminAuthMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First, authenticate the user using the generic middleware
    await new Promise((resolve, reject) => {
      authenticateUser(req, res, (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    // If authentication fails, authenticateUser will have already sent a response
    if (!req.user) {
      return; // Exit if user is not authenticated
    }

    // Check if the user is an admin in any workspace
    const { data: memberData, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('role', ADMIN_ROLE)
      .limit(1);

    if (memberError) {
      console.error(`Error checking admin role for user ${req.user.id}: ${memberError.message}`);
      res.status(500).json({ error: 'Internal server error during role verification.' });
      return;
    }

    if (!memberData || memberData.length === 0) {
      console.warn(`Access denied for user ${req.user.id}: Not an administrator.`);
      res.status(403).json({ error: 'Access denied: User is not an administrator.' });
      return;
    }

    // Attach admin status to the request for further use
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Unhandled admin authentication middleware error:', error instanceof Error ? error.message : error);
    // If authenticateUser already sent a response, we don't send another
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error during authentication process.' });
    }
    return;
  }
};
