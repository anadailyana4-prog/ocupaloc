import type { NextConfig } from "next";

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

export default nextConfig;
