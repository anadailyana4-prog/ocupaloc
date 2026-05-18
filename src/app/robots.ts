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
          "/owner/",
          "/auth/",
          "/billing/",
          "/onboarding/",
          "/programare/",
          "/status/",
          "/s/",
          "/admin/",
          "/login",
          "/reset-password",
          "/signup?*"
        ]
      }
    ],
    sitemap: "https://ocupaloc.ro/sitemap.xml"
  };
}
