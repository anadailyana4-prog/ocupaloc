declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function canTrack(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

function canUseBrowserApis(): boolean {
  return typeof window !== "undefined";
}

function getAnonId(): string {
  if (!canUseBrowserApis()) return "server";
  const key = "ocupaloc:anon-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `anon-${Date.now()}`;
  window.localStorage.setItem(key, created);
  return created;
}

export function getOrCreateAnonId(): string {
  return getAnonId();
}

function postOperationalEvent(eventName: string, payload: Record<string, string | number | boolean | null>) {
  if (!canUseBrowserApis()) return;

  const body = JSON.stringify({
    eventName,
    payload: {
      ...payload,
      anon_id: getAnonId()
    }
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/ops/track-event", blob);
    return;
  }

  void fetch("/api/ops/track-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  });
}

export const trackSignup = (step: number) => {
  if (!canTrack()) return;
  window.gtag?.("event", "signup_step", {
    event_category: "signup",
    event_label: `step_${step}`,
    step
  });
};

export const trackCalculator = (appointments: number) => {
  if (!canTrack()) return;
  window.gtag?.("event", "calculator_interaction", {
    event_category: "pricing",
    event_label: "appointments_slider",
    appointments
  });
};

export const trackCTAClick = (location: string) => {
  if (!canTrack()) return;
  window.gtag?.("event", "cta_click", {
    event_category: "engagement",
    event_label: location,
    location
  });
};

export const trackDemoCreated = (businessType: string) => {
  if (!canTrack()) return;
  window.gtag?.("event", "demo_created", {
    event_category: "demo",
    event_label: businessType,
    business_type: businessType
  });
};

export const trackAuthEvent = (eventName: "login_success" | "signup_success" | "magic_link_sent" | "password_reset_sent", method: string) => {
  if (!canTrack()) return;
  window.gtag?.("event", eventName, {
    event_category: "auth",
    event_label: method,
    method
  });
};

export const trackBookingEvent = (
  eventName:
    | "booking_public_page_view"
    | "booking_service_selected"
    | "booking_day_selected"
    | "booking_slot_selected"
    | "booking_form_started"
    | "booking_submit_started"
    | "booking_submit_failed"
    | "booking_submit_success",
  payload: Record<string, string | number | boolean | null>
) => {
  postOperationalEvent(eventName, payload);
  if (!canTrack()) return;
  window.gtag?.("event", eventName, {
    event_category: "booking",
    ...payload
  });
};

export const trackOnboardingEvent = (
  eventName:
    | "onboarding_signup_view"
    | "onboarding_step_completed"
    | "onboarding_profile_completed"
    | "onboarding_activation",
  payload: Record<string, string | number | boolean | null>
) => {
  postOperationalEvent(eventName, payload);
  if (!canTrack()) return;
  window.gtag?.("event", eventName, {
    event_category: "onboarding",
    ...payload
  });
};

export const trackReferralAttributedVisit = (payload: { referral_source: string; referral_code?: string | null; page: string }) => {
  postOperationalEvent("referral_attributed_visit", payload);
  if (!canTrack()) return;
  window.gtag?.("event", "referral_attributed_visit", {
    event_category: "growth",
    ...payload
  });
};

export async function assignExperimentVariant(
  experimentId: string,
  options?: { splitPercentA?: number }
): Promise<"A" | "B" | null> {
  if (!canUseBrowserApis()) return null;

  try {
    const anonId = getAnonId();
    const splitPercentA = options?.splitPercentA ?? 50;
    const response = await fetch(
      `/api/experiments/assign?experiment=${encodeURIComponent(experimentId)}&id=${encodeURIComponent(anonId)}&split_a=${encodeURIComponent(String(splitPercentA))}`,
      { method: "GET", cache: "no-store" }
    );

    if (!response.ok) return null;
    const body = (await response.json()) as { variant?: "A" | "B" };
    if (!body.variant) return null;
    return body.variant;
  } catch {
    return null;
  }
}

