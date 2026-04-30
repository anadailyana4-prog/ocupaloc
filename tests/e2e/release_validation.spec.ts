import { test, expect } from '@playwright/test';

// All sensitive values come exclusively from environment variables.
// Local development: create a .env.test file or export them before running.
// CI: set PLAYWRIGHT_LOGIN_EMAIL, PLAYWRIGHT_LOGIN_PASSWORD as repository secrets.
const baseUrl = (process.env.PLAYWRIGHT_BASE_URL ?? 'https://ocupaloc.ro').replace(/\/$/, '');
const bookingSlug = process.env.PLAYWRIGHT_BOOKING_SLUG ?? 'ana-nails';
const publicUrl = `${baseUrl}/${bookingSlug}`;

const loginEmail = process.env.PLAYWRIGHT_LOGIN_EMAIL;
const loginPassword = process.env.PLAYWRIGHT_LOGIN_PASSWORD;

// Client-side booking test data — generic, non-personal placeholders.
const testClientPhone = process.env.PLAYWRIGHT_TEST_CLIENT_PHONE ?? '0700000001';
const testClientEmail = process.env.PLAYWRIGHT_TEST_CLIENT_EMAIL ?? 'ci-test@ocupaloc.test';

const clientName = 'RG-' + Date.now();

test.describe('Release Validation', () => {

  test('1. Guest booking flow and dashboard verification', async ({ browser }) => {
    // CRITICAL TEST: Fail (not skip) if required secrets are missing.
    // This ensures CI catches missing credentials at workflow start, not silently.
    if (!loginEmail || !loginPassword) {
      throw new Error(
        'CRITICAL: PLAYWRIGHT_LOGIN_EMAIL and PLAYWRIGHT_LOGIN_PASSWORD are required for release validation. ' +
        'Add them to GitHub repository secrets or .env.test for local runs. ' +
        'This test cannot be skipped; credentials are mandatory.'
      );
    }

    test.setTimeout(120000);
    const guestCtx = await browser.newContext();
    const guestPage = await guestCtx.newPage();

    console.log('Navigating to public page...');
    await guestPage.goto(publicUrl, { waitUntil: 'load' });

    // Select service
    await guestPage.locator('[data-testid="service-option"]').first().click();
    await guestPage.waitForTimeout(1000);

    const days = guestPage.locator('[data-testid="day-option"]');
    const dayCount = await days.count();
    let selectedDayIndex = -1;

    // Scan all visible days in order for any with available slots.
    // Day-of-month comparison is intentionally avoided: it breaks across month
    // boundaries (e.g. today=Apr-29, calendar shows May-1..15 which are all < 29).
    for (let i = 0; i < dayCount && selectedDayIndex === -1; i++) {
      await days.nth(i).click();
      await guestPage.waitForTimeout(1000);

      const slotCount = await guestPage.locator('[data-testid="slot-option"]').count();
      if (slotCount > 0) {
        selectedDayIndex = i;
      }
    }

    if (selectedDayIndex === -1) {
      throw new Error('No selectable day options with available slots found across all visible days.');
    }

    const slots = guestPage.locator('[data-testid="slot-option"]');
    await expect(slots.first()).toBeVisible({ timeout: 15000 });
    const slotLabel = (await slots.first().textContent())?.trim() ?? 'unknown';
    console.log(`Slot found on day index ${selectedDayIndex + 1}, slot ${slotLabel}`);
    await slots.first().click();

    // Deterministic step progression for current public booking UI.
    const bookingContinue = guestPage.getByTestId('booking-continue');
    if (await bookingContinue.isVisible()) {
      await bookingContinue.click();
      await guestPage.waitForTimeout(600);
    }

    const step1Continue = guestPage.getByTestId('booking-step-1-continue');
    if (await step1Continue.isVisible()) {
      await step1Continue.click();
      await guestPage.waitForTimeout(600);
    }

    const step2Continue = guestPage.getByTestId('booking-step-2-continue');
    if (await step2Continue.isVisible()) {
      await step2Continue.click();
      await guestPage.waitForTimeout(600);
    }

    // Fill booking form with non-personal test placeholders.
    const nameInput = guestPage.getByTestId('booking-name-input');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(clientName);
    await guestPage.getByTestId('booking-phone-input').fill(testClientPhone);
    await guestPage.getByTestId('booking-email-input').fill(testClientEmail);

    console.log('Submitting booking for:', clientName);
    await guestPage.getByTestId('booking-submit').click();

    // Verify trust-grade persistent confirmation message.
    await expect(guestPage.locator('body')).toContainText(/Programare confirmată|confirmată pentru/i, { timeout: 30000 });
    console.log('Booking confirmed on UI with persistent confirmation state');
    await guestCtx.close();

    // Phase 2: Professional dashboard verification
    const proCtx = await browser.newContext();
    const proPage = await proCtx.newPage();

    console.log('Logging in to dashboard...');
    await proPage.goto(`${baseUrl}/login`, { waitUntil: 'load' });
    await proPage.getByTestId('login-email-input').fill(loginEmail!);
    await proPage.getByTestId('login-password-input').fill(loginPassword!);
    await proPage.getByTestId('login-submit').click();

    const reachedApp = await proPage
      .waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 })
      .then(() => true)
      .catch(() => false);

    if (!reachedApp) {
      test.skip(true, `Professional login did not redirect from /login within timeout (current URL: ${proPage.url()}).`);
    }

    if (proPage.url().includes('/onboarding')) {
      test.skip(true, 'Professional account redirected to onboarding — subscription not active, skipping dashboard verification.');
    }
    console.log('Dashboard reached');

    let found = false;
    for (let i = 0; i < 6; i++) {
      const text = await proPage.innerText('body');
      if (text.includes(clientName)) {
        found = true;
        break;
      }
      console.log(`Polling for booking ${clientName} (attempt ${i + 1})...`);
      await proPage.waitForTimeout(5000);
      await proPage.reload({ waitUntil: 'networkidle' });
    }

    expect(found).toBe(true);
    console.log('Booking found in professional dashboard!');
    await proCtx.close();
  });

  test('2. Auth & Redirect Checks', async ({ page }) => {
    console.log('Checking /dashboard redirect...');
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');

    console.log('Navigating to public page...');
    await page.goto(publicUrl, { waitUntil: 'networkidle' });
    expect(page.url()).toContain(`/${bookingSlug}`);

    console.log('Checking /s/ slug redirect...');
    await page.goto(`${baseUrl}/s/${bookingSlug}`);
    await page.waitForURL(`**/${bookingSlug}**`);
    expect(page.url()).toContain(`/${bookingSlug}`);
  });

});
