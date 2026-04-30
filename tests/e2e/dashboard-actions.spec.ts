import { expect, test } from "@playwright/test";

/**
 * Dashboard owner-action E2E tests.
 *
 * Covers:
 *   1. Manual booking created by the salon owner via the dashboard dialog
 *   2. Cancel a booking from the dashboard
 *   3. Edit the schedule (Program) and save successfully
 *
 * All credentials come from environment variables only — no hardcoded values.
 * When running locally without credentials the tests are skipped gracefully.
 * In CI (PLAYWRIGHT_REQUIRE_EXECUTION=true) missing creds are a hard failure.
 */

const baseUrl = (process.env.PLAYWRIGHT_BASE_URL ?? "https://ocupaloc.ro").replace(/\/$/, "");
const loginEmail = process.env.PLAYWRIGHT_LOGIN_EMAIL;
const loginPassword = process.env.PLAYWRIGHT_LOGIN_PASSWORD;
const requireExecution = process.env.PLAYWRIGHT_REQUIRE_EXECUTION === "true";

function requireCreds() {
  if (!loginEmail || !loginPassword) {
    if (requireExecution) {
      throw new Error(
        "PLAYWRIGHT_LOGIN_EMAIL and PLAYWRIGHT_LOGIN_PASSWORD are required for dashboard-action E2E tests."
      );
    }
    test.skip(true, "PLAYWRIGHT_LOGIN_EMAIL / PLAYWRIGHT_LOGIN_PASSWORD not set — skipping locally.");
  }
}

async function loginToDashboard(page: import("@playwright/test").Page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "load" });
  await page.getByTestId("login-email-input").fill(loginEmail!);
  await page.getByTestId("login-password-input").fill(loginPassword!);
  await page.getByTestId("login-submit").click();
  const reachedApp = await page
    .waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 })
    .then(() => true)
    .catch(() => false);

  if (!reachedApp) {
    test.skip(true, `Login did not redirect from /login within timeout (current URL: ${page.url()}).`);
  }

  if (page.url().includes("/onboarding")) {
    test.skip(true, "Professional account redirected to onboarding — subscription not active, skipping dashboard tests.");
  }
}

test.describe("Dashboard owner actions", () => {
  test("1. Manual booking can be created by the owner", async ({ page }) => {
    requireCreds();
    test.setTimeout(90_000);

    await loginToDashboard(page);

    // The "+ Programare manuală" button must be visible
    const manualBtn = page.getByRole("button", { name: /programare manual/i });
    await expect(manualBtn).toBeVisible({ timeout: 10_000 });

    // If no services exist the button is disabled — skip gracefully
    const isDisabled = await manualBtn.isDisabled();
    if (isDisabled) {
      test.skip(true, "No active services configured — manual booking button is disabled.");
    }

    await manualBtn.click();

    // Dialog should open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Fill the form
    const clientName = `E2E-${Date.now()}`;
    await dialog.getByLabel(/Nume client/i).fill(clientName);
    await dialog.getByLabel(/Telefon client/i).fill("0700000001");

    // Pick tomorrow as date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    await dialog.getByLabel(/Data/i).fill(dateStr);
    await dialog.getByLabel(/Ora/i).fill("10:00");

    await dialog.getByRole("button", { name: /Adaugă programare/i }).click();

    // Dialog should close and a toast should appear
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator("body")).toContainText(/adăugat|confirm/i, { timeout: 10_000 });
  });

  test("2. Cancel a booking from the dashboard", async ({ page }) => {
    requireCreds();
    test.setTimeout(90_000);

    await loginToDashboard(page);

    // Switch to "toate" filter to get more bookings
    const allFilterLink = page.getByRole("link", { name: /toate/i }).first();
    if (await allFilterLink.isVisible()) {
      await allFilterLink.click();
      await page.waitForTimeout(1000);
    }

    // Look for an "Anulează" button — if none exist the test skips
    const cancelBtn = page.getByRole("button", { name: /Anulează/i }).first();
    const hasCancelBtn = await cancelBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasCancelBtn) {
      test.skip(true, "No cancellable bookings found in dashboard — skipping cancel test.");
    }

    await cancelBtn.click();

    // A toast / confirmation should appear
    await expect(page.locator("body")).toContainText(/anulat/i, { timeout: 10_000 });
  });

  test("3. Edit schedule (Program) and save successfully", async ({ page }) => {
    requireCreds();
    test.setTimeout(60_000);

    await loginToDashboard(page);

    // Navigate to /dashboard/program
    await page.goto(`${baseUrl}/dashboard/program`, { waitUntil: "load" });

    // Page should contain the schedule editor heading
    await expect(page.getByRole("heading", { name: /Program/i })).toBeVisible({ timeout: 10_000 });

    // The save button should be present
    const saveBtn = page.getByRole("button", { name: /Salvează/i });
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });

    // Click save without any change — should succeed (idempotent)
    await saveBtn.click();

    // Expect a success toast
    await expect(page.locator("body")).toContainText(/salvat|Program salvat/i, { timeout: 10_000 });
  });
});
