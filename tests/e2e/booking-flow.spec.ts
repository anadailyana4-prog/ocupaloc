import { test, expect } from "@playwright/test";

/**
 * E2E: Booking flow tests
 *
 * These tests run against the local dev server (pnpm dev on port 8788).
 *
 * The booking-flow test mocks client-side API calls (slots + submit) so it
 * does NOT create real appointments and does NOT depend on a specific DB state.
 * The SSR part of the page (profesionist data) does require the slug to exist
 * in the database. Set E2E_TEST_SLUG to a slug that exists in your dev DB.
 * If the slug is not found the test is skipped automatically.
 */

const TEST_SLUG = process.env.E2E_TEST_SLUG ?? "ana-nails";

// ─── Smoke: homepage ────────────────────────────────────────────────────────

test("homepage loads and shows CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ocupaloc|programare online/i);
  // Main CTA button — text varies; assert at least one link to /signup or /login exists
  const ctaLink = page.getByRole("link", { name: /încearcă|înregistrează|creează|începe/i }).first();
  await expect(ctaLink).toBeVisible({ timeout: 10_000 });
});

// ─── Smoke: signup page renders ─────────────────────────────────────────────

test("signup page renders form", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.locator("input[type=email], input[name=email]").first()).toBeVisible({ timeout: 10_000 });
});

// ─── Booking widget flow ─────────────────────────────────────────────────────

test("booking flow: select service → date → slot → fill form → submit", async ({ page }) => {
  // ── 1. Mock the slots API (client-side fetch) ──────────────────────────
  await page.route("**/api/public/slots**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        slots: [
          { start: new Date(Date.now() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(), staffId: "staff-test-id" },
          { start: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), staffId: "staff-test-id" }
        ]
      })
    });
  });

  // ── 2. Mock the booking submit API ────────────────────────────────────
  await page.route("**/api/book", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, clientNotification: "queued" })
    });
  });

  // ── 3. Navigate to the public booking page ────────────────────────────
  const response = await page.goto(`/${TEST_SLUG}`, { waitUntil: "domcontentloaded" });

  // Skip test if the slug doesn't exist in the DB
  if (!response || response.status() === 404) {
    test.skip(true, `Slug "${TEST_SLUG}" not found — set E2E_TEST_SLUG to a valid slug`);
    return;
  }

  await expect(page.locator("[data-testid='service-option']").first()).toBeVisible({ timeout: 15_000 });

  // ── 4. Select the first available service ────────────────────────────
  await page.locator("[data-testid='service-option']").first().click();

  // ── 5. Select a date (today or tomorrow button in the calendar) ───────
  // The public page layout shows a horizontal day strip; click the first non-past day
  const dayButton = page.locator("button").filter({ hasText: /^\d{1,2}$/ }).first();
  await dayButton.waitFor({ state: "visible", timeout: 5_000 }).catch(() => null);
  await dayButton.click().catch(() => null);

  // ── 6. Wait for slots to load and click the first one ─────────────────
  await expect(page.locator("[data-testid='slot-option']").first()).toBeVisible({ timeout: 15_000 });
  await page.locator("[data-testid='slot-option']").first().click();

  // ── 7. Click "Continuă la rezervare" / "Confirmă programarea" ─────────
  const continueBtn = page.locator("[data-testid='booking-continue']");
  await continueBtn.waitFor({ state: "visible", timeout: 5_000 }).catch(() => null);
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
  }

  // ── 8. Modal should open — fill in the form ───────────────────────────
  await expect(page.locator("[data-testid='booking-name-input']")).toBeVisible({ timeout: 10_000 });
  await page.locator("[data-testid='booking-name-input']").fill("Test Playwright");
  await page.locator("[data-testid='booking-phone-input']").fill("0712345678");
  await page.locator("[data-testid='booking-email-input']").fill("test@playwright.dev");

  // ── 9. Submit ─────────────────────────────────────────────────────────
  await page.locator("[data-testid='booking-submit']").click();

  // ── 10. Expect success state ──────────────────────────────────────────
  await expect(page.getByText(/programare confirmată/i)).toBeVisible({ timeout: 15_000 });
});
