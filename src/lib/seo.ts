import type { Metadata } from "next";

export const SITE_URL = "https://ocupaloc.ro";
export const SITE_NAME = "OcupaLoc";
export const DEFAULT_OG_IMAGE = "/og-image.png";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonical(path = "/"): Metadata["alternates"] {
  return { canonical: absoluteUrl(path) };
}

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false
  }
};

export const noIndexMetadata: Metadata = {
  robots: noIndexRobots
};

export function truncateDescription(value: string, maxLength = 160): string {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
