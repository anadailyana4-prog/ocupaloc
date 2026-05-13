#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const userEmail = 'demo-salon@local.test';

  console.log('🔐 Finding user with email:', userEmail);

  // Get the user
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error listing users:', listError);
    return;
  }

  const user = users?.users?.find(u => u.email === userEmail);
  if (!user) {
    console.error('❌ User not found:', userEmail);
    return;
  }

  console.log(`✓ Found user: ${user.id}`);

  // Create owner record
  console.log('\n📝 Creating owner admin record...');
  const { data: ownerRecord, error: insertError } = await supabase
    .from('owner_admin_users')
    .insert({
      user_id: user.id,
      role: 'owner',
      is_active: true
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error creating owner:', insertError);
    return;
  }

  console.log('✅ Owner admin created!');
  console.log(`\n📊 Owner Details:`);
  console.log(`  ID: ${ownerRecord.id}`);
  console.log(`  User ID: ${ownerRecord.user_id}`);
  console.log(`  Role: ${ownerRecord.role}`);
  console.log(`  Active: ${ownerRecord.is_active}`);
  console.log(`  Created: ${ownerRecord.created_at}`);

  console.log('\n✓ Owner portal is now ready!');
  console.log(`\n🔗 Access at: https://ocupaloc.ro/owner/login`);
  console.log(`📧 Email: ${userEmail}`);
}

main().catch(console.error);
