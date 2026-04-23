import { expect, test } from "@playwright/test";

test("login smoke test", async ({ page, context }) => {
  const loginEmail = process.env.PLAYWRIGHT_LOGIN_EMAIL;
  const loginPassword = process.env.PLAYWRIGHT_LOGIN_PASSWORD;

  if (!loginEmail || !loginPassword) {
    test.skip(true, "PLAYWRIGHT_LOGIN_EMAIL and PLAYWRIGHT_LOGIN_PASSWORD are required for this smoke test.");
  }

  const authResponses: Array<{ url: string; status: number }> = [];

  page.on("response", async (response) => {
    if (!response.url().includes("/auth/v1/token")) {
      return;
    }

    authResponses.push({
      url: response.url(),
      status: response.status()
    });
  });

  await page.goto("/login", { waitUntil: "networkidle" });

  const emailInput = page.getByTestId("login-email-input");
  const passwordInput = page.getByTestId("login-password-input");
  const submitButton = page.getByTestId("login-submit");

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(submitButton).toBeEnabled();

  await emailInput.fill(loginEmail!);
  await passwordInput.fill(loginPassword!);

  await submitButton.click();

  await expect
    .poll(() => page.url(), { timeout: 20_000, intervals: [250, 500, 1_000] })
    .toMatch(/\/(dashboard|onboarding)(\?|$)/);

  const finalUrl = page.url();
  const cookies = await context.cookies();

  expect(authResponses.some(({ status }) => status === 200)).toBeTruthy();
  expect(cookies.some(({ name }) => name.startsWith("sb-"))).toBeTruthy();
  expect(finalUrl).toMatch(/\/(dashboard|onboarding)(\?|$)/);
});
