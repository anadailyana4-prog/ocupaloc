import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/billing/stripe";
import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type CancelBody = {
  profesionistId?: unknown;
  reason?: unknown;
  confirmationText?: unknown;
};

const REQUIRED_CONFIRMATION = "CONFIRM_CANCEL";

export async function POST(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const contentType = request.headers.get("content-type") || "";
    let body: CancelBody = {};
    if (contentType.includes("application/json")) {
      body = (await request.json().catch(() => ({}))) as CancelBody;
    } else {
      const form = await request.formData();
      body = {
        profesionistId: form.get("profesionistId"),
        reason: form.get("reason"),
        confirmationText: form.get("confirmationText")
      };
    }

    const profesionistId = String(body.profesionistId ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    const confirmationText = String(body.confirmationText ?? "").trim();

    if (!profesionistId) {
      return NextResponse.json({ ok: false, error: "Missing profesionistId" }, { status: 400 });
    }

    if (confirmationText !== REQUIRED_CONFIRMATION) {
      return NextResponse.json(
        {
          ok: false,
          error: `Explicit confirmation required: send confirmationText='${REQUIRED_CONFIRMATION}'`
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseServiceClient();
    const { data: subscription, error: subError } = await admin
      .from("subscriptions")
      .select("id, stripe_subscription_id, status")
      .eq("profesionist_id", profesionistId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      return NextResponse.json({ ok: false, error: "Failed to load subscription" }, { status: 500 });
    }

    if (!subscription) {
      return NextResponse.json({ ok: false, error: "No subscription found" }, { status: 404 });
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json({ ok: false, error: "Stripe subscription id missing" }, { status: 409 });
    }

    const stripe = getStripeClient();
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id, { prorate: false });

    await admin
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscription.id);

    await logOwnerAction(
      "owner_subscription_cancel",
      "subscription",
      String(subscription.id),
      {
        profesionistId,
        previousStatus: subscription.status,
        reason: reason || null
      },
      {
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent
      }
    );

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      return NextResponse.redirect(new URL("/owner/subscriptions?canceled=1", request.url), 303);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
