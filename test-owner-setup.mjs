#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log('🔍 Checking Supabase auth users...\n');
  
  // List auth users
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('❌ Error listing users:', error);
    return;
  }
  
  console.log(`Found ${data?.users?.length || 0} users in auth:\n`);
  data?.users?.forEach(u => {
    console.log(`  - ID: ${u.id}`);
    console.log(`    Email: ${u.email}`);
    console.log(`    Created: ${u.created_at}\n`);
  });

  console.log('\n🔍 Checking owner_admin_users table...\n');
  
  // Check owner_admin_users
  const { data: owners, error: ownersError } = await supabase
    .from('owner_admin_users')
    .select('*');
  
  if (ownersError) {
    console.error('❌ Error reading owner_admin_users:', ownersError);
  } else {
    console.log(`Found ${owners?.length || 0} owner admin users:`);
    owners?.forEach(o => {
      console.log(`  - ID: ${o.id}`);
      console.log(`    User ID: ${o.user_id}`);
      console.log(`    Role: ${o.role}`);
      console.log(`    Active: ${o.is_active}\n`);
    });
  }

  // If no owner exists and we have users, offer to create one
  if (data?.users?.length > 0 && (!owners || owners.length === 0)) {
    const firstUser = data.users[0];
    console.log('✅ Can create owner for:', firstUser.email);
  }
}

main().catch(console.error);
