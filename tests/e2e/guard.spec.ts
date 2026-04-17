import { test } from "@playwright/test";

const requireExecution = process.env.PLAYWRIGHT_REQUIRE_EXECUTION === "true";

test("e2e execution guard", async () => {
  if (!requireExecution) {
    return;
  }

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
  const bookingSlug = process.env.PLAYWRIGHT_BOOKING_SLUG?.trim();
  const demoEnabled = process.env.PLAYWRIGHT_ENABLE_DEMO_SMOKE === "true";

  if (!baseUrl) {
    throw new Error("PLAYWRIGHT_BASE_URL is required when PLAYWRIGHT_REQUIRE_EXECUTION=true");
  }

  if (!bookingSlug && !demoEnabled) {
    throw new Error("At least one smoke flow must be enabled (booking slug or demo smoke)");
  }
});
