import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getProfesionistIdBySlug,
  hasOnboardingCompleted,
  isOnboardingProfileComplete,
  markFirstBookingIfNeeded,
  markOnboardingCompletedIfReady,
  onboardingCompletionPatch
} from "../src/lib/professional-milestones";

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

  it("getProfesionistIdBySlug returns id when slug matches", async () => {
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: "prof-abc" }, error: null })
          })
        })
      })
    } as unknown as SupabaseClient;
    assert.equal(await getProfesionistIdBySlug(admin, "  my-salon  "), "prof-abc");
  });

  it("markFirstBookingIfNeeded issues update when first_booking_at is null", async () => {
    let updated = false;
    const admin = {
      from: () => ({
        update: () => ({
          eq: () => ({
            is: async () => {
              updated = true;
              return { error: null };
            }
          })
        })
      })
    } as unknown as SupabaseClient;
    await markFirstBookingIfNeeded(admin, "p-1");
    assert.equal(updated, true);
  });

  it("markOnboardingCompletedIfReady skips when profile already completed", async () => {
    let selectCalls = 0;
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              selectCalls += 1;
              return {
                data: { id: "1", onboarding_completed_at: "2026-01-01", nume_business: "X", telefon: "1", tip_activitate: "t", onboarding_pas: 4 },
                error: null
              };
            }
          })
        })
      })
    } as unknown as SupabaseClient;
    await markOnboardingCompletedIfReady(admin, "p-1");
    assert.equal(selectCalls, 1);
  });
});
