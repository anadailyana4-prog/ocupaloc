import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { handleSignoutRequest, type SignoutDeps } from "../src/lib/auth/signout-handler";

test("signout route: clears _prof_ok cookie after successful signout", async () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://ocupaloc.ro";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon_test";

  const deps: SignoutDeps = {
    createClient: () =>
      ({
        auth: {
          signOut: async () => ({ error: null })
        }
      }) as ReturnType<SignoutDeps["createClient"]>,
    report: () => undefined
  };

  const req = new NextRequest("https://ocupaloc.ro/api/auth/signout?all=true", {
    method: "POST",
    headers: {
      origin: "https://ocupaloc.ro"
    }
  });

  const res = await handleSignoutRequest(req, deps);
  assert.equal(res.status, 200);

  const setCookieHeader = res.headers.get("set-cookie") ?? "";
  assert.match(setCookieHeader, /_prof_ok=/i);
  assert.match(setCookieHeader, /Max-Age=0/i);
});
