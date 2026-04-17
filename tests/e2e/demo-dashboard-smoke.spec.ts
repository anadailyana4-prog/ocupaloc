import { expect, test } from "@playwright/test";

const demoSmokeEnabled = process.env.PLAYWRIGHT_ENABLE_DEMO_SMOKE === "true";
const hasBaseUrl = Boolean(process.env.PLAYWRIGHT_BASE_URL);

test.describe("demo dashboard smoke", () => {
  test.skip(!hasBaseUrl, "PLAYWRIGHT_BASE_URL is not configured.");
  test.skip(!demoSmokeEnabled, "PLAYWRIGHT_ENABLE_DEMO_SMOKE is not enabled.");

  test("logs into demo and lands in dashboard", async ({ page }) => {
    await page.goto("/demo");
    await page.getByTestId("demo-login-submit").click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: /Bun venit/i })).toBeVisible();
  });
});