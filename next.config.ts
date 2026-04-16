import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep default asset URLs on the same origin for Pages custom domains.
  basePath: "",
  trailingSlash: false,
  images: {
    formats: ["image/avif", "image/webp"]
  },
  async redirects() {
    return [
      // Canonical: tot traficul www merge pe apex (HTTPS). Ajută cât timp apex e domeniul principal pe Pages.
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
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
