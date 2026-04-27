import { NextResponse } from "next/server";

import { getSiteUrl, isBillingEnabled } from "@/lib/billing/config";
import { getOrCreateStripeCustomer } from "@/lib/billing/customer";
import { getStripeClient } from "@/lib/billing/stripe";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  let siteUrl: string;
  try {
    siteUrl = getSiteUrl();
  } catch {
    return NextResponse.redirect("https://ocupaloc.ro/preturi", 303);
  }

  if (!isBillingEnabled()) {
    return NextResponse.redirect(new URL("/preturi", siteUrl), 303);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", siteUrl), 303);
    }

    const admin = createSupabaseServiceClient();
    let { data: prof, error: profError } = await admin
      .from("profesionisti")
      .select("id,user_id,slug,nume_business")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fallback for legacy/migrated accounts where profesionisti.user_id is not aligned,
    // but membership ownership exists through tenant_id.
    if ((!prof || profError) && user.id) {
      const { data: membership } = await admin
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membership?.tenant_id) {
        const fallback = await admin
          .from("profesionisti")
          .select("id,user_id,slug,nume_business")
          .eq("id", membership.tenant_id)
          .maybeSingle();
        if (!fallback.error && fallback.data) {
          prof = fallback.data;
          profError = null;
        }
      }
    }

    if (profError || !prof) {
      return NextResponse.redirect(new URL("/onboarding", siteUrl), 303);
    }

    const stripe = getStripeClient();
    const customer = await getOrCreateStripeCustomer(stripe, {
      profesionistId: String(prof.id),
      userId: String(user.id),
      slug: String(prof.slug ?? ""),
      businessName: String(prof.nume_business ?? "OcupaLoc"),
      email: user.email ?? null
    });

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${siteUrl}/dashboard`
    });

    return NextResponse.redirect(portal.url, 303);
  } catch (error) {
    reportError("billing", "create_portal_failed", error);
    return NextResponse.redirect(new URL("/dashboard?error=" + encodeURIComponent("Portalul de facturare nu este disponibil momentan. Contactează-ne la contact@ocupaloc.ro"), siteUrl), 303);
  }
}
