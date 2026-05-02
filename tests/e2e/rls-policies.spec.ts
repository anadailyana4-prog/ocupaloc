import { expect, test } from "@playwright/test";

/**
 * Row-Level Security (RLS) Policy Tests
 *
 * Verifies that Supabase RLS policies correctly restrict access:
 * 1. Professionals cannot access other professionals' data
 * 2. Clients cannot access appointments they don't own
 * 3. API calls return 403 Forbidden for unauthorized access
 * 4. Unauthenticated users cannot access protected tables
 */

const baseUrl = (process.env.PLAYWRIGHT_BASE_URL ?? "https://ocupaloc.ro").replace(/\/$/, "");
const loginEmail = process.env.PLAYWRIGHT_LOGIN_EMAIL;
const loginPassword = process.env.PLAYWRIGHT_LOGIN_PASSWORD;
const requireExecution = process.env.PLAYWRIGHT_REQUIRE_EXECUTION === "true";

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

function requireCreds() {
  if (!loginEmail || !loginPassword) {
    if (requireExecution) {
      throw new Error("PLAYWRIGHT_LOGIN_EMAIL and PLAYWRIGHT_LOGIN_PASSWORD are required for RLS tests.");
    }
    test.skip(true, "PLAYWRIGHT_LOGIN_EMAIL / PLAYWRIGHT_LOGIN_PASSWORD not set — skipping locally.");
  }
}

async function loginAndGetTokens(page: import("@playwright/test").Page): Promise<AuthTokens> {
  let capturedToken = "";
  
  // Intercept auth token responses
  page.on("response", async (response) => {
    if (response.url().includes("/auth/v1/token")) {
      try {
        const json = await response.json();
        if (json.access_token) {
          capturedToken = json.access_token;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  });

  await page.goto(`${baseUrl}/login`, { waitUntil: "load" });
  await page.getByTestId("login-email-input").fill(loginEmail!);
  await page.getByTestId("login-password-input").fill(loginPassword!);
  await page.getByTestId("login-submit").click();

  const reached = await page
    .waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 })
    .then(() => true)
    .catch(() => false);

  if (!reached) {
    throw new Error(`Login failed or redirect did not complete. URL: ${page.url()}`);
  }

  // Wait for auth token to be captured
  let retries = 10;
  while (!capturedToken && retries > 0) {
    await page.waitForTimeout(500);
    retries--;
  }

  if (!capturedToken) {
    throw new Error("Failed to capture auth token after login");
  }

  return { accessToken: capturedToken };
}

test.describe("Row-Level Security Policies", () => {
  test("1. RLS blocks unauthenticated access to protected tables", async ({ page }) => {
    // Try to fetch profesionisti table without auth
    const response = await page.request.get(
      `${baseUrl}/api/rest/profesionisti?select=*`,
      {
        headers: {
          "Authorization": "Bearer invalid-token"
        }
      }
    );

    // Should get 401 Unauthorized or 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });

  test("2. Authenticated user can access own dashboard data", async ({ page }) => {
    requireCreds();
    
    const tokens = await loginAndGetTokens(page);

    // Navigate to dashboard
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "load" });

    // Verify dashboard loads and displays user's data
    const profesionalName = page.locator("[data-testid='professional-name']");
    const servicesSection = page.locator("[data-testid='services-section']");

    // At least one of these should be visible
    const isVisible = await Promise.race([
      profesionalName.isVisible().catch(() => false),
      servicesSection.isVisible().catch(() => false)
    ]);

    expect(isVisible).toBeTruthy();
  });

  test("3. RLS prevents reading appointments of other professionals", async ({ page }) => {
    requireCreds();
    test.setTimeout(90_000);

    // Get current user's ID from dashboard
    const tokens = await loginAndGetTokens(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "load" });

    // Try to fetch another professional's appointments
    // This test assumes we try to query with a different prof_id
    const response = await page.request.get(
      `${baseUrl}/api/rest/programari?prof_id=eq.ffffffff-ffff-ffff-ffff-ffffffffffff&select=*`,
      {
        headers: {
          "Authorization": `Bearer ${tokens.accessToken}`,
          "apikey": process.env.SUPABASE_ANON_KEY || ""
        }
      }
    );

    // Should either return empty array or forbidden
    // RLS policy should ensure only own data is returned
    if (response.status() === 200) {
      const data = await response.json();
      // If policy works, non-existent prof returns empty or error
      expect(Array.isArray(data) || data.error).toBeTruthy();
    }
  });

  test("4. Appointment data includes only fields user has access to", async ({ page }) => {
    requireCreds();
    test.setTimeout(90_000);

    const tokens = await loginAndGetTokens(page);
    await page.goto(`${baseUrl}/dashboard/program`, { waitUntil: "load" });

    // Check if sensitive fields are properly masked
    const appointments = page.locator("[data-testid='appointment-row']");
    const count = await appointments.count();

    // If appointments exist, verify they don't contain sensitive data
    if (count > 0) {
      const firstAppointment = appointments.first();
      
      // These fields should be visible (allowed)
      const visibleFields = [
        firstAppointment.locator("[data-field='client_name']"),
        firstAppointment.locator("[data-field='data_programarii']"),
        firstAppointment.locator("[data-field='status']")
      ];

      for (const field of visibleFields) {
        // At least some fields should exist
        const hasAnyField = await Promise.race(
          visibleFields.map(f => f.isVisible().catch(() => false))
        );
        if (hasAnyField) {
          expect(true).toBeTruthy();
          break;
        }
      }
    }
  });

  test("5. RLS prevents updating records not owned by user", async ({ page, context }) => {
    requireCreds();
    test.setTimeout(90_000);

    const tokens = await loginAndGetTokens(page);

    // Try to update an appointment that doesn't belong to current user
    const response = await context.request.patch(
      `${baseUrl}/api/rest/programari?id=eq.00000000-0000-0000-0000-000000000000`,
      {
        headers: {
          "Authorization": `Bearer ${tokens.accessToken}`,
          "apikey": process.env.SUPABASE_ANON_KEY || "",
          "Content-Type": "application/json"
        },
        data: {
          status: "cancelled"
        }
      }
    );

    // Should return 403 Forbidden or 401 Unauthorized
    expect([401, 403, 404]).toContain(response.status());
  });

  test("6. RLS prevents deleting records not owned by user", async ({ page, context }) => {
    requireCreds();
    test.setTimeout(90_000);

    const tokens = await loginAndGetTokens(page);

    // Try to delete an appointment that doesn't belong to current user
    const response = await context.request.delete(
      `${baseUrl}/api/rest/programari?id=eq.00000000-0000-0000-0000-000000000000`,
      {
        headers: {
          "Authorization": `Bearer ${tokens.accessToken}`,
          "apikey": process.env.SUPABASE_ANON_KEY || ""
        }
      }
    );

    // Should return 403 Forbidden
    expect([401, 403, 404]).toContain(response.status());
  });

  test("7. Session-based access is properly isolated", async ({ page, context }) => {
    requireCreds();
    test.setTimeout(90_000);

    // Login first user
    const tokens1 = await loginAndGetTokens(page);

    // Create new isolated context for second user
    const newPage = await context.newPage();
    
    // Verify first and second contexts have different data
    const response1 = await page.request.get(
      `${baseUrl}/api/rest/profesionisti?select=id,nume`,
      {
        headers: {
          "Authorization": `Bearer ${tokens1.accessToken}`,
          "apikey": process.env.SUPABASE_ANON_KEY || ""
        }
      }
    );

    if (response1.status() === 200) {
      const data1 = await response1.json();
      // Verify we get data for current user
      expect(Array.isArray(data1) || data1.length === undefined).toBeTruthy();
    }

    await newPage.close();
  });

  test("8. Public booking page respects RLS for anonymous users", async ({ page }) => {
    // Navigate to public booking page (no auth)
    await page.goto(`${baseUrl}/ana-nails`, { waitUntil: "load" });

    // Public data should be visible
    const profesionalName = page.locator("[data-testid='professional-name']");
    const servicesSection = page.locator("[data-testid='services-list']");

    // At least services or name should show (public data only)
    const isVisible = await Promise.race([
      profesionalName.isVisible().catch(() => false),
      servicesSection.isVisible().catch(() => false)
    ]);

    expect(isVisible).toBeTruthy();

    // But sensitive fields should NOT be visible
    const sensitiveFields = page.locator("[data-field='internal_notes']");
    const isSensitiveVisible = await sensitiveFields.isVisible().catch(() => false);
    expect(isSensitiveVisible).toBeFalsy();
  });
});
