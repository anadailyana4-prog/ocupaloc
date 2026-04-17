declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function canTrack(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
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
    | "booking_service_selected"
    | "booking_day_selected"
    | "booking_slot_selected"
    | "booking_submit_started"
    | "booking_submit_failed"
    | "booking_submit_success",
  payload: Record<string, string | number | boolean | null>
) => {
  if (!canTrack()) return;
  window.gtag?.("event", eventName, {
    event_category: "booking",
    ...payload
  });
};

