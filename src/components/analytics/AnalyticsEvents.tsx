"use client";

import { useEffect } from "react";

import { trackCTAClick } from "@/lib/analytics";

export function AnalyticsEvents() {
  useEffect(() => {
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

