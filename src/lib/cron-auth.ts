export function validateCronSecret(headers: Headers, configuredSecret?: string): boolean {
  const expected = configuredSecret?.trim();
  if (!expected) {
    return false;
  }

  const authHeader = headers.get("authorization")?.trim();
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    return token === expected;
  }

  const xCronSecret = headers.get("x-cron-secret")?.trim();
  return xCronSecret === expected;
}
