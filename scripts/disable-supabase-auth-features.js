import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase URL or service role key.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function disableAuthFeatures() {
  const { data, error } = await supabase.auth.admin.update({
    email_confirm: false,
    captcha_enabled: false,
  });

  if (error) {
    console.error('Error disabling auth features:', error);
  } else {
    console.log('Auth features disabled successfully:', data);
  }
}

disableAuthFeatures();
