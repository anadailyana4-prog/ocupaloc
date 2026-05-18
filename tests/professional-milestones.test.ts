import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasOnboardingCompleted, isOnboardingProfileComplete, onboardingCompletionPatch } from "../src/lib/professional-milestones";

describe("professional-milestones", () => {
  it("onboardingCompletionPatch sets pas 4 and timestamp", () => {
    const patch = onboardingCompletionPatch("2026-01-01T00:00:00.000Z");
    assert.equal(patch.onboarding_pas, 4);
    assert.equal(patch.onboarding_completed_at, "2026-01-01T00:00:00.000Z");
  });

  it("hasOnboardingCompleted accepts timestamp or pas", () => {
    assert.equal(hasOnboardingCompleted({ onboarding_completed_at: "2026-01-01", onboarding_pas: 0 }), true);
    assert.equal(hasOnboardingCompleted({ onboarding_completed_at: null, onboarding_pas: 4 }), true);
    assert.equal(hasOnboardingCompleted({ onboarding_completed_at: null, onboarding_pas: 2 }), false);
  });

  it("isOnboardingProfileComplete requires core fields", () => {
    assert.equal(
      isOnboardingProfileComplete({
        nume_business: "Salon",
        telefon: "0712345678",
        tip_activitate: "frizerie",
        onboarding_pas: 4
      }),
      true
    );
    assert.equal(
      isOnboardingProfileComplete({
        nume_business: "Salon",
        telefon: "",
        tip_activitate: "frizerie",
        onboarding_pas: 4
      }),
      false
    );
  });
});
