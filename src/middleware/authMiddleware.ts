import { Request, Response, NextFunction, RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
// No longer need to import User or declare global namespace here, as it's in express.d.ts

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export const authenticateUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'User not found.');
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
      return;
    }

    req.user = user; // Attach user object to the request
    next();
  } catch (error) {
    console.error('Error in authenticateUser middleware:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
    return;
  }
};
