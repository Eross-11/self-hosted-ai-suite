// scripts/seedUsers.js
// Automate user creation using Supabase Admin API
// Usage: node scripts/seedUsers.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    workspace: 'Demo Workspace',
  },
  {
    email: 'user@example.com',
    password: 'password123',
    role: 'member',
    workspace: 'Demo Workspace',
  },
  {
    email: 'nonmember@example.com',
    password: 'password123',
    // No workspace or role, will not be added to any workspace
  },
];

async function main() {
  for (const user of users) {
    // Check if user exists
    const { data: existing, error: findErr } = await supabase.auth.admin.listUsers({
      email: user.email,
    });
    if (findErr) throw findErr;
    if (existing && existing.users && existing.users.length > 0) {
      console.log(`User ${user.email} already exists.`);
      continue;
    }
    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });
    if (error) throw error;
    const userId = data.user?.id;
    if (!userId) throw new Error('No user ID returned for ' + user.email);
    console.log(`Created user: ${user.email} (id: ${userId})`);

    // Only add workspace membership if workspace and role are defined
    if (user.workspace && user.role) {
      // Find workspace and role IDs
      const { data: ws, error: wsErr } = await supabase
        .from('workspaces')
        .select('id')
        .eq('name', user.workspace)
        .single();
      if (wsErr) throw wsErr;
      const workspaceId = ws.id;

      // Insert workspace membership
      const { error: memErr } = await supabase
        .from('workspace_members')
        .insert({ workspace_id: workspaceId, user_id: userId, role: user.role });
      if (memErr) throw memErr;
      console.log(`Added ${user.email} to workspace '${user.workspace}' as ${user.role}`);
    }
  }
}

main().catch((e) => {
  console.error('❌ Error seeding users:', e.message);
  process.exit(1);
});
