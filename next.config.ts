import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  },
  async redirects() {
    return [
      {
        source: "/inscriere",
        destination: "/signup",
        permanent: true
      },
      {
        source: "/inscriere/:path*",
        destination: "/signup",
        permanent: true
      },
      {
        source: "/intrare",
        destination: "/login",
        permanent: true
      },
      {
        source: "/intrare/:path*",
        destination: "/login",
        permanent: true
      },
      {
        source: "/admin",
        destination: "/dashboard",
        permanent: true
      },
      {
        source: "/admin/:path*",
        destination: "/dashboard/:path*",
        permanent: true
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  // Source map upload — only when SENTRY_ORG and SENTRY_PROJECT are set
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Don't print Sentry logs during build unless CI
  silent: !process.env.CI,
  // Wider client file upload for better stack traces
  widenClientFileUpload: true,
  // Tunnel Sentry requests through own domain to avoid ad-blockers
  tunnelRoute: "/monitoring",
  webpack: {
    // Keep our cron alerting manual.
    automaticVercelMonitors: false,
    treeshake: {
      removeDebugLogging: true
    }
  }
});
