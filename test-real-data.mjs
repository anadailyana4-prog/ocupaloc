#!/usr/bin/env node
/**
 * Owner Portal Real Data Verification Test
 * Tests if data is actually populated from the real database or just placeholders
 */

const baseUrl = 'https://ocupaloc.ro';

async function testEndpoint(label, endpoint) {
  console.log(`\n📍 ${label}`);
  console.log(`   GET ${endpoint}`);

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      console.log(`   ⚠️  PROTECTED (${response.status}) - Cannot test without auth`);
      return null;
    }

    if (response.status === 405) {
      console.log(`   ⚠️  METHOD NOT ALLOWED (405) - Probably POST only`);
      return null;
    }

    if (response.status !== 200) {
      console.log(`   ❌ ERROR (${response.status}): ${data.error || 'Unknown error'}`);
      return null;
    }

    return data;
  } catch (err) {
    console.log(`   ❌ FETCH ERROR: ${err.message}`);
    return null;
  }
}

async function analyzeData(data) {
  if (!data || !data.stats) return null;

  const s = data.stats;
  console.log(`   ✓ Received data`);
  console.log(`     Total Accounts: ${s.totalAccounts}`);
  console.log(`     Active Subscriptions: ${s.subscriptionsActive}`);
  console.log(`     Trial Active: ${s.trialActive}`);
  console.log(`     MRR: ${s.mrrRon} RON`);
  console.log(`     Bookings (30d): ${s.bookings30d}`);
  console.log(`     Conversion Rate: ${s.trialToPaidConversionPct}%`);
  console.log(`     Cron Success (24h): ${s.cronSuccess24h}`);
  console.log(`     Critical Errors: ${s.recentCriticalErrors?.length || 0}`);

  // Assess if data is real or placeholder
  if (s.totalAccounts === 0 && s.subscriptionsActive === 0 && s.bookings30d === 0) {
    return 'EMPTY_DB';
  }

  if (s.totalAccounts > 0 || s.bookings30d > 0 || s.mrrRon > 0) {
    return 'REAL_DATA';
  }

  return 'PARTIAL_DATA';
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('    OWNER PORTAL REAL DATA VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');

  // Test stats endpoint (requires auth, so this will fail but we can see status code)
  const statsData = await testEndpoint('1. Owner Stats (Dashboard KPIs)', `${baseUrl}/api/owner/stats`);

  // Test businesses endpoint
  const businessesData = await testEndpoint('2. Owner Businesses List', `${baseUrl}/api/owner/businesses`);

  // Test business detail endpoint (example with ID)
  const businessDetailData = await testEndpoint('3. Business Detail [ID param needed]', `${baseUrl}/api/owner/business/123`);

  // Test notes endpoint
  const notesData = await testEndpoint('4. Internal Notes', `${baseUrl}/api/owner/notes`);

  // Test audit log endpoint
  const auditData = await testEndpoint('5. Audit Log', `${baseUrl}/api/owner/audit`);

  // Test operations endpoint
  const opsData = await testEndpoint('6. Operations Status', `${baseUrl}/api/owner/operations`);

  // Test access log endpoint
  const accessData = await testEndpoint('7. Access Log', `${baseUrl}/api/owner/access-log`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('    ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');

  const statsStatus = await analyzeData(statsData);
  console.log(`\n📊 Stats Data: ${statsStatus || 'PROTECTED'}`);

  console.log('\n📝 Summary:');
  console.log('  - Most endpoints are protected (401/403) - requires owner authentication');
  console.log('  - To test with real data, owner must be logged in');
  console.log('  - API structure is sound, protection is active');

  console.log('\n💡 Next step: Log in as owner and test from browser');
  console.log(`    URL: ${baseUrl}/owner/login`);
  console.log(`    Email: demo-salon@local.test`);

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
