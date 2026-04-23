"use client";

import { useEffect } from "react";

import { trackCTAClick, trackReferralAttributedVisit } from "@/lib/analytics";

export function AnalyticsEvents() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const referralSource = url.searchParams.get("ref") || url.searchParams.get("referral") || url.searchParams.get("utm_source");
    const referralCode = url.searchParams.get("ref_code") || url.searchParams.get("code");
    if (referralSource) {
      trackReferralAttributedVisit({
        referral_source: referralSource,
        referral_code: referralCode,
        page: window.location.pathname
      });
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest?.("[data-cta-location]") as HTMLElement | null;
      if (!element) return;

      const location = element.getAttribute("data-cta-location");
      if (!location) return;
      trackCTAClick(location);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}

