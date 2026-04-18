import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.sentry.io https://www.google-analytics.com https://region1.google-analytics.com",
  "frame-src 'self' https://checkout.stripe.com",
  "form-action 'self' https://checkout.stripe.com"
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy }
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
      // Canonical host: www → apex
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.ocupaloc.ro" }],
        destination: "https://ocupaloc.ro/:path*",
        permanent: true
      },
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
