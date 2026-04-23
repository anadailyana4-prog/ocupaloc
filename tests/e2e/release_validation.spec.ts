import { test, expect } from '@playwright/test';

const profesionalesEmail = 'balascanuanamaria1@gmail.com';
const profesionalesPassword = 'Davidtimotei1@';
const publicUrl = 'https://ocupaloc.ro/ana-nails';
const clientName = 'RG-' + Date.now();

test.describe('Release Validation', () => {

  test('1. Guest booking flow and dashboard verification', async ({ browser }) => {
    test.setTimeout(120000);
    const guestCtx = await browser.newContext();
    const guestPage = await guestCtx.newPage();
    
    console.log('Navigating to public page...');
    await guestPage.goto(publicUrl, { waitUntil: 'networkidle' });
    
    // Select service
    await guestPage.locator('[data-testid="service-option"]').first().click();
    await guestPage.waitForTimeout(1000);
    
    // Prefer a future day to keep dashboard visibility checks deterministic.
    const days = guestPage.locator('[data-testid="day-option"]');
    const dayCount = await days.count();
    const today = new Date().getDate();
    let selectedDayIndex = -1;

    for (let i = 0; i < dayCount; i++) {
      const txt = (await days.nth(i).textContent())?.trim() ?? '';
      const dayNo = Number.parseInt(txt, 10);
      if (!Number.isNaN(dayNo) && dayNo >= today) {
        selectedDayIndex = i;
        break;
      }
    }

    if (selectedDayIndex === -1 && dayCount > 0) {
      selectedDayIndex = 0;
    }

    if (selectedDayIndex === -1) {
      throw new Error('No selectable day options found.');
    }

    await days.nth(selectedDayIndex).click();
    await guestPage.waitForTimeout(900);

    const slots = guestPage.locator('[data-testid="slot-option"]');
    await expect(slots.first()).toBeVisible({ timeout: 10000 });
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

    // Fill booking form
    const nameInput = guestPage.getByTestId('booking-name-input');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(clientName);
    await guestPage.getByTestId('booking-phone-input').fill('0774561297');
    await guestPage.getByTestId('booking-email-input').fill('balascanuanamaria90@gmail.com');
    
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
    await proPage.goto('https://ocupaloc.ro/login', { waitUntil: 'networkidle' });
    await proPage.getByTestId('login-email-input').fill(profesionalesEmail);
    await proPage.getByTestId('login-password-input').fill(profesionalesPassword);
    await proPage.getByTestId('login-submit').click();
    
    await proPage.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('Dashboard reached');

    let found = false;
    for (let i = 0; i < 6; i++) {
       const text = await proPage.innerText('body');
       if (text.includes(clientName)) {
           found = true;
           break;
       }
       console.log(`Polling for booking ${clientName} (attempt ${i+1})...`);
       await proPage.waitForTimeout(5000);
       await proPage.reload({ waitUntil: 'networkidle' });
    }
    
    expect(found).toBe(true);
    console.log('Booking found in professional dashboard!');
    await proCtx.close();
  });

  test('2. Auth & Redirect Checks', async ({ page }) => {
    console.log('Checking /dashboard redirect...');
    await page.goto('https://ocupaloc.ro/dashboard');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
    
    console.log('Checking /s/ slug redirect...');
    await page.goto('https://ocupaloc.ro/s/ana-nails');
    await page.waitForURL('**/ana-nails**');
    expect(page.url()).toContain('/ana-nails');
  });

});
