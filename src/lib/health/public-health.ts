export function buildPublicHealthPayload(ok: boolean) {
  return {
    ok,
    timestamp: new Date().toISOString()
  };
}
