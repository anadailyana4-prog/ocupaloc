import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/demo/",
          "/api/",
          "/dashboard/",
          "/auth/",
          "/billing/",
          "/onboarding/",
          "/programare/",
          "/status/",
          "/s/",
          "/admin/"
        ]
      }
    ],
    sitemap: "https://ocupaloc.ro/sitemap.xml"
  };
}
