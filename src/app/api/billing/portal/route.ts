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
    const { data: prof, error: profError } = await admin
      .from("profesionisti")
      .select("id,user_id,slug,nume_business,email_contact")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profError || !prof) {
      return NextResponse.redirect(new URL("/onboarding", siteUrl), 303);
    }

    const stripe = getStripeClient();
    const customer = await getOrCreateStripeCustomer(stripe, {
      profesionistId: String(prof.id),
      userId: String(user.id),
      slug: String(prof.slug ?? ""),
      businessName: String(prof.nume_business ?? "OcupaLoc"),
      email: prof.email_contact ? String(prof.email_contact) : user.email ?? null
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
