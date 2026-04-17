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

    await expect(page.getByTestId("service-option").first()).toBeVisible();
    await page.getByTestId("service-option").first().click();
    await page.getByTestId("day-option").first().click();

    const firstSlot = page.getByTestId("slot-option").first();
    await expect(firstSlot).toBeVisible();
    await firstSlot.click();

    await page.getByTestId("booking-continue").click();
    await page.getByTestId("booking-step-1-continue").click();
    await page.getByTestId("booking-step-2-continue").click();

    await expect(page.getByTestId("booking-name-input")).toBeVisible();
    await expect(page.getByTestId("booking-phone-input")).toBeVisible();
    await expect(page.getByTestId("booking-email-input")).toBeVisible();
    await expect(page.getByTestId("booking-submit")).toBeVisible();
  });
});
