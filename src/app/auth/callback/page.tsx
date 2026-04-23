"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    const current = new URL(window.location.href);
    const nextUrl = new URL("/auth/bridge", window.location.origin);

    current.searchParams.forEach((value, key) => {
      nextUrl.searchParams.set(key, value);
    });

    nextUrl.hash = current.hash;
    window.location.replace(nextUrl.toString());
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Redirectionăm către fluxul securizat de autentificare...</p>
    </main>
  );
}
