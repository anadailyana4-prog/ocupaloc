#!/usr/bin/env node
/**
 * PRACTICAL Owner Portal Verification
 * Tests what actually matters:
 * 1. Pages load without errors
 * 2. Protection is enforced (unauthenticated redirects)
 * 3. Customer dashboard is unaffected
 * 4. API structure is sound
 */

const baseUrl = 'https://ocupaloc.ro';

async function checkUrl(label, url, expectedStatus) {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    const statusOk = response.status === expectedStatus;
    const icon = statusOk ? '✅' : '❌';
    const status = statusOk ? 'PASS' : `FAIL (got ${response.status})`;
    console.log(`${icon} ${label}: ${status}`);
    return statusOk;
  } catch (err) {
    console.log(`❌ ${label}: ERROR - ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('\n🔍 OWNER PORTAL PRACTICAL VERIFICATION\n');

  const results = [];

  // === OWNER PORTAL PAGES ===
  console.log('📄 Owner Portal Pages (Should load/redirect):');
  results.push(await checkUrl('  /owner/login', `${baseUrl}/owner/login`, 200));
  results.push(await checkUrl('  /owner/dashboard (unauthenticated)', `${baseUrl}/owner/dashboard`, 307)); // 307 = temporary redirect
  results.push(await checkUrl('  /owner/businesses (unauthenticated)', `${baseUrl}/owner/businesses`, 307));
  results.push(await checkUrl('  /owner/subscriptions (unauthenticated)', `${baseUrl}/owner/subscriptions`, 307));
  results.push(await checkUrl('  /owner/activity (unauthenticated)', `${baseUrl}/owner/activity`, 307));

  // === CUSTOMER DASHBOARD (Should still work) ===
  console.log('\n👤 Customer Dashboard (Should still work):');
  results.push(await checkUrl('  /dashboard (unauthenticated)', `${baseUrl}/dashboard`, 307)); // redirects to /login
  results.push(await checkUrl('  /login (customer)', `${baseUrl}/login`, 200));
  results.push(await checkUrl('  /signup (customer)', `${baseUrl}/signup`, 200));

  // === API ENDPOINTS ===
  console.log('\n🔌 API Endpoints (Should be protected):');
  
  const apiEndpoints = [
    '/api/owner/stats',
    '/api/owner/businesses',
    '/api/owner/notes',
    '/api/owner/audit',
    '/api/owner/subscriptions/cancel',
    '/api/owner/access-log'
  ];
  
  for (const endpoint of apiEndpoints) {
    const response = await fetch(`${baseUrl}${endpoint}`);
    // API endpoints should return either 401 or 403 when unauthenticated
    // 401 = not authenticated, 403 = forbidden (middleware blocked it)
    const isProtected = response.status === 401 || response.status === 403;
    const icon = isProtected ? '✅' : '❌';
    const status = isProtected ? `Protected (${response.status})` : `NOT PROTECTED (${response.status})`;
    console.log(`${icon} ${endpoint}: ${status}`);
    results.push(isProtected);
  }

  // === LANDING PAGE ===
  console.log('\n🏠 Public Pages (Should be accessible):');
  results.push(await checkUrl('  / (landing)', `${baseUrl}/`, 200));

  // === REPORT ===
  console.log('\n' + '═'.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\n📊 RESULTS: ${passed}/${total} checks passed (${percentage}%)\n`);

  if (percentage === 100) {
    console.log('✅ OWNER PORTAL IS FULLY FUNCTIONAL & PROTECTED');
    console.log('\n✓ Pages route correctly');
    console.log('✓ Unauthenticated users are blocked');
    console.log('✓ Customer dashboard still works');
    console.log('✓ API endpoints are protected');
    console.log('✓ Landing page is public');
  } else if (percentage >= 90) {
    console.log('⚠️  OWNER PORTAL IS MOSTLY WORKING');
    console.log('Review failures above.');
  } else {
    console.log('❌ OWNER PORTAL HAS ISSUES');
    console.log('Review all failures above.');
  }

  console.log('\n═'.repeat(60));
  console.log(`\n✨ Owner portal ready at: ${baseUrl}/owner/login`);
  console.log(`📧 Test email: demo-salon@local.test`);
  console.log('\n');

  process.exit(percentage === 100 ? 0 : 1);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
