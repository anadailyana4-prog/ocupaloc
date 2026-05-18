"use client";

import { useEffect, useRef } from "react";

import { applySignupDraft, type SignupDraftPayload } from "@/app/(auth)/signup/apply-draft-action";

const DRAFT_KEY = "ocupaloc:signupDraft";
const APPLIED_KEY = "ocupaloc:signupDraftApplied";

const LEGACY_KEYS = [
  "ocupaloc:onboardingServices",
  "ocupaloc:onboardingSchedule",
  "ocupaloc:lastSlug",
  "ocupaloc:signupName"
] as const;

function readLegacyDraft(): SignupDraftPayload | null {
  if (typeof window === "undefined") return null;

  const rawDraft = localStorage.getItem(DRAFT_KEY);
  if (rawDraft) {
    try {
      return JSON.parse(rawDraft) as SignupDraftPayload;
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  const orgName = localStorage.getItem("ocupaloc:signupName")?.trim();
  const slug = localStorage.getItem("ocupaloc:lastSlug")?.trim();
  let services: SignupDraftPayload["services"];
  let workDays: SignupDraftPayload["workDays"];

  try {
    const servicesRaw = localStorage.getItem("ocupaloc:onboardingServices");
    if (servicesRaw) services = JSON.parse(servicesRaw) as SignupDraftPayload["services"];
  } catch {
    /* ignore */
  }

  try {
    const scheduleRaw = localStorage.getItem("ocupaloc:onboardingSchedule");
    if (scheduleRaw) workDays = JSON.parse(scheduleRaw) as SignupDraftPayload["workDays"];
  } catch {
    /* ignore */
  }

  if (!orgName && !slug && !services?.length && !workDays?.length) {
    return null;
  }

  return { orgName: orgName || undefined, slug, services, workDays };
}

function clearDraftStorage() {
  localStorage.removeItem(DRAFT_KEY);
  localStorage.setItem(APPLIED_KEY, "1");
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
}

type Props = {
  /** When true, shows a non-blocking toast on success (dashboard only). */
  showToastOnApply?: boolean;
};

/**
 * Runs once per session to persist signup wizard data after email confirmation.
 */
export function SignupDraftBootstrap({ showToastOnApply = false }: Props) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(APPLIED_KEY) === "1") return;

    const draft = readLegacyDraft();
    if (!draft?.orgName?.trim()) return;

    started.current = true;

    void (async () => {
      const result = await applySignupDraft(draft);
      if (!result.ok) {
        started.current = false;
        return;
      }

      if (result.applied) {
        clearDraftStorage();
        if (showToastOnApply) {
          const { toast } = await import("sonner");
          toast.success("Am salvat serviciile și programul din înscriere.");
        }
      } else if (result.reason === "profile_already_has_services") {
        clearDraftStorage();
      }
    })();
  }, [showToastOnApply]);

  return null;
}
