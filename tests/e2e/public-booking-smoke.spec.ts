import { expect, test } from "@playwright/test";

const bookingSlug = process.env.PLAYWRIGHT_BOOKING_SLUG;
const hasBaseUrl = Boolean(process.env.PLAYWRIGHT_BASE_URL);

test.describe("public booking smoke", () => {
  test.skip(!hasBaseUrl, "PLAYWRIGHT_BASE_URL is not configured.");
  test.skip(!bookingSlug, "PLAYWRIGHT_BOOKING_SLUG is not configured.");

  test("reaches booking form for a public salon", async ({ page }) => {
    test.setTimeout(180_000);
    let attempts = 0;
    while (attempts < 3) {
      try {
        await page.goto("/" + bookingSlug, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        });
        break;
      } catch (err) {
        attempts++;
        if (attempts === 3) throw err;
        console.warn(`Navigation attempt ${attempts} failed, retrying...`, String(err));
        await page.waitForTimeout(1000);
      }
    }

    await page.waitForLoadState("networkidle", { timeout: 30_000 });

    const firstService = page.getByTestId("service-option").first();
    const hasService = await firstService.isVisible({ timeout: 20_000 }).catch(() => false);

    // Staging data can legitimately have pages without active services.
    if (!hasService) {
      await expect(page.locator("main h1").first()).toBeVisible();
      return;
    }

    await firstService.click();

    const dayOptions = page.getByTestId("day-option");
    const dayCount = await dayOptions.count();
    let selectedSlot = false;

    for (let i = 0; i < Math.min(dayCount, 14); i++) {
      await dayOptions.nth(i).click();
      const firstSlot = page.getByTestId("slot-option").first();
      const slotVisible = await firstSlot.isVisible({ timeout: 5_000 }).catch(() => false);
      if (slotVisible) {
        await firstSlot.click();
        selectedSlot = true;
        break;
      }
    }

    // If there are no slots in the near horizon, the page still works if the empty-state is shown.
    if (!selectedSlot) {
      await expect(page.getByText(/Nu sunt sloturi libere/i).first()).toBeVisible();
      return;
    }

    await page.getByTestId("booking-continue").click();
    await page.getByTestId("booking-step-1-continue").click();
    await page.getByTestId("booking-step-2-continue").click();

    await expect(page.getByTestId("booking-name-input")).toBeVisible();
    await expect(page.getByTestId("booking-phone-input")).toBeVisible();
    await expect(page.getByTestId("booking-email-input")).toBeVisible();
    await expect(page.getByTestId("booking-submit")).toBeVisible();
  });
});
