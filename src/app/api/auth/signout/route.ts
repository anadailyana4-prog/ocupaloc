import type { NextRequest } from "next/server";

import { handleSignoutRequest } from "@/lib/auth/signout-handler";

export async function POST(request: NextRequest) {
  return handleSignoutRequest(request);
}
