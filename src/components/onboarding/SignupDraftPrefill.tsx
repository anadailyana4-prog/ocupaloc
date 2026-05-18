"use client";

import { useEffect } from "react";

const DRAFT_KEY = "ocupaloc:signupDraft";

type Draft = {
  orgName?: string;
  phone?: string;
  activity?: string;
  tip_activitate?: string;
};

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DRAFT_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Draft;
    } catch {
      return null;
    }
  }
  const orgName = localStorage.getItem("ocupaloc:signupName")?.trim();
  if (!orgName) return null;
  return { orgName };
}

/**
 * Prefills empty onboarding form fields from signup localStorage (non-destructive).
 */
export function SignupDraftPrefill() {
  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;

    const setIfEmpty = (id: string, value?: string) => {
      if (!value?.trim()) return;
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (!el || el.value.trim()) return;
      el.value = value.trim();
    };

    setIfEmpty("nume_business", draft.orgName);
    setIfEmpty("telefon", draft.phone);
    setIfEmpty("tip_activitate", draft.activity ?? draft.tip_activitate);
  }, []);

  return null;
}
