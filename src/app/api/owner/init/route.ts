import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type InitBody = {
  email?: unknown;
};

/**
 * POST /api/owner/init
 * Creates the first owner admin user securely.
 * 
 * Security:
 * - Requires OWNER_INIT_SECRET token in Authorization header
 * - Only works if no owner admin exists yet
 * - Email must be provided
 * - Token is single-use conceptually (checked via env)
 * 
 * USAGE:
 * curl -X POST https://ocupaloc.ro/api/owner/init \
 *   -H "Authorization: Bearer YOUR_INIT_TOKEN_FROM_ENV" \
 *   -H "Content-Type: application/json" \
 *   -d '{"email": "your@email.com"}'
 */
export async function POST(request: NextRequest) {
  const initSecret = process.env.OWNER_INIT_SECRET;
  
  if (!initSecret) {
    return NextResponse.json(
      { ok: false, error: "Owner init not configured" },
      { status: 500 }
    );
  }

  // Verify token
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  
  if (token !== initSecret) {
    return NextResponse.json(
      { ok: false, error: "Invalid or missing init token" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as InitBody;
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email required" },
        { status: 400 }
      );
    }

    const admin = createSupabaseServiceClient();

    // Check if owner already exists
    const { data: existing, error: checkError } = await admin
      .from("owner_admin_users")
      .select("id")
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing owner:", checkError);
      return NextResponse.json(
        { ok: false, error: "Database error" },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Owner already exists" },
        { status: 409 }
      );
    }

    // Look up Supabase user by email
    const { data: users, error: userError } = await admin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      return NextResponse.json(
        { ok: false, error: "Auth service error" },
        { status: 500 }
      );
    }

    const user = users?.users?.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: `User with email ${email} not found in auth. Create account first.` },
        { status: 404 }
      );
    }

    // Create owner admin record
    const { data: adminRecord, error: insertError } = await admin
      .from("owner_admin_users")
      .insert({
        user_id: user.id,
        role: "owner",
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating owner admin:", insertError);
      return NextResponse.json(
        { ok: false, error: "Failed to create owner record" },
        { status: 500 }
      );
    }

    // Set custom claim (if Supabase supports it via admin API)
    // Note: Supabase doesn't have a direct custom claims API like Firebase.
    // Instead, we verify role in the owner_admin_users table server-side.

    return NextResponse.json(
      {
        ok: true,
        message: `Owner admin created for ${email}`,
        owner_id: adminRecord.id,
        user_id: adminRecord.user_id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in /api/owner/init:", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "POST only" },
    { status: 405 }
  );
}
