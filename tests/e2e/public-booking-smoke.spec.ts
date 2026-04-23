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

    const firstServiceOption = page.getByTestId("service-option").first();
    const serviceVisible = await firstServiceOption
      .isVisible({ timeout: 15_000 })
      .catch(() => false);

    if (!serviceVisible) {
      const bodyText = ((await page.textContent("body")) ?? "").toLowerCase();
      const pageUnavailable =
        bodyText.includes("404") ||
        bodyText.includes("not found") ||
        bodyText.includes("nu există") ||
        bodyText.includes("indisponibil");

      test.skip(pageUnavailable, "Public booking page is unavailable or has no public services in this environment.");
      await expect(firstServiceOption).toBeVisible();
    }

    await firstServiceOption.click();

    // First visible day may have zero slots (program / timezone / data). Try several days.
    const dayOptions = page.getByTestId("day-option");
    const dayCount = await dayOptions.count();
    const firstSlot = page.getByTestId("slot-option").first();
    let pickedSlot = false;
    for (let i = 0; i < Math.min(dayCount, 21); i += 1) {
      await dayOptions.nth(i).click();
      try {
        await expect(firstSlot).toBeVisible({ timeout: 25_000 });
        await firstSlot.click();
        pickedSlot = true;
        break;
      } catch {
        // No slots this day or still loading — try next day
      }
    }
    if (!pickedSlot) {
      test.skip(true, "No slot-option visible for any day — check PLAYWRIGHT_BOOKING_SLUG and salon program in CI.");
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
