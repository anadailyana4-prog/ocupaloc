"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { getOrCreateAnonId, trackCTAClick, trackReferralAttributedVisit, trackSitePageView, trackSiteVisitEnded, trackSiteVisitStarted } from "@/lib/analytics";

function buildPageKey(pathname: string, searchParams: { toString(): string } | null): string {
  const query = searchParams?.toString() ?? "";
  return query ? `${pathname}?${query}` : pathname;
}

export function AnalyticsEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionIdRef = useRef<string>("");
  const visitIdRef = useRef<string>("");
  const startedAtRef = useRef<number>(0);
  const pagesViewedRef = useRef<number>(0);
  const trackedPagesRef = useRef<Set<string>>(new Set());
  const currentPageRef = useRef<string>("");
  const endedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = getOrCreateAnonId();
    }
    if (!visitIdRef.current) {
      visitIdRef.current = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `visit-${Date.now()}`;
    }
    if (!startedAtRef.current) {
      startedAtRef.current = performance.now();
    }

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

    const endVisit = () => {
      if (endedRef.current) return;
      endedRef.current = true;

      const durationMs = Math.max(0, Math.round(performance.now() - startedAtRef.current));
      trackSiteVisitEnded({
        page: currentPageRef.current || `${window.location.pathname}${window.location.search}`,
        title: document.title,
        session_id: sessionIdRef.current,
        visit_id: visitIdRef.current,
        duration_ms: durationMs,
        pages_viewed: pagesViewedRef.current
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        endVisit();
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest?.("[data-cta-location]") as HTMLElement | null;
      if (!element) return;

      const location = element.getAttribute("data-cta-location");
      if (!location) return;
      const href = element.getAttribute("href") ?? "";
      trackCTAClick(location, href);
    };

    const pageKey = buildPageKey(pathname, searchParams);
    currentPageRef.current = pageKey;
    if (!trackedPagesRef.current.has(pageKey)) {
      trackedPagesRef.current.add(pageKey);
      pagesViewedRef.current += 1;

      const pagePayload = {
        page: pageKey,
        title: document.title,
        referrer: document.referrer || null,
        session_id: sessionIdRef.current,
        visit_id: visitIdRef.current,
        is_entry: pagesViewedRef.current === 1,
        page_index: pagesViewedRef.current
      };

      if (pagesViewedRef.current === 1) {
        trackSiteVisitStarted(pagePayload);
      }

      trackSitePageView(pagePayload);
    }

    document.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", endVisit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", endVisit);
      endVisit();
    };
  }, []);

  useEffect(() => {
    const pageKey = buildPageKey(pathname, searchParams);
    currentPageRef.current = pageKey;
    if (trackedPagesRef.current.has(pageKey)) return;

    trackedPagesRef.current.add(pageKey);
    pagesViewedRef.current += 1;

    const pagePayload = {
      page: pageKey,
      title: document.title,
      referrer: document.referrer || null,
      session_id: sessionIdRef.current,
      visit_id: visitIdRef.current,
      is_entry: pagesViewedRef.current === 1,
      page_index: pagesViewedRef.current
    };

    if (pagesViewedRef.current === 1) {
      trackSiteVisitStarted(pagePayload);
    }

    trackSitePageView(pagePayload);
  }, [pathname, searchParams]);

  return null;
}

