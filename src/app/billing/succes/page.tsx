import { redirect } from "next/navigation";
import { getStripeClient } from "@/lib/billing/stripe";
import { isBillingEnabled } from "@/lib/billing/config";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { sendTrialWelcomeEmail } from "@/lib/email/trial-welcome";
import { reportError } from "@/lib/observability";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function BillingSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  if (isBillingEnabled() && session_id) {
    try {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["subscription"]
      });

      const profesionistId = session.metadata?.profesionist_id;
      const email = session.customer_details?.email ?? null;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer as { id?: string } | null)?.id ?? null;

      const admin = createSupabaseServiceClient();

      // Sync subscription immediately — don't wait for the webhook
      if (profesionistId && session.subscription && typeof session.subscription !== "string") {
        const sub = session.subscription as {
          id: string;
          status: string;
          current_period_end?: number | null;
        };
        console.log("[billing/succes] syncing subscription", {
          profesionistId,
          subId: sub.id,
          status: sub.status,
          customerId
        });
        const { error: upsertError } = await admin.from("subscriptions").upsert(
          {
            profesionist_id: profesionistId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId,
            status: sub.status,
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString()
          },
          { onConflict: "stripe_subscription_id" }
        );
        if (upsertError) {
          console.error("[billing/succes] upsert failed:", JSON.stringify(upsertError));
          // Retry with insert ignore conflict on profesionist_id in case subscription ID mismatch
          const { error: retryError } = await admin.from("subscriptions").upsert(
            {
              profesionist_id: profesionistId,
              stripe_subscription_id: sub.id,
              stripe_customer_id: customerId,
              status: sub.status,
              current_period_end: sub.current_period_end
                ? new Date(sub.current_period_end * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString()
            },
            { onConflict: "profesionist_id" }
          );
          if (retryError) {
            console.error("[billing/succes] retry upsert also failed:", JSON.stringify(retryError));
            throw new Error(`Subscription upsert failed: ${upsertError.message}`);
          }
        }
        console.log("[billing/succes] subscription synced OK, status:", sub.status);
      } else {
        console.warn("[billing/succes] skipped upsert — missing profesionistId or subscription object", {
          profesionistId,
          hasSubscription: !!session.subscription,
          subscriptionType: typeof session.subscription
        });
      }

      // Send welcome email
      if (profesionistId && email) {
        const { data: prof } = await admin
          .from("profesionisti")
          .select("slug,nume_business")
          .eq("id", profesionistId)
          .maybeSingle();

        await sendTrialWelcomeEmail({
          email,
          numeBusiness: prof?.nume_business ?? "",
          slug: prof?.slug ?? ""
        });
      }
    } catch (e) {
      reportError("billing", "trial_welcome_on_success_page", e instanceof Error ? e : new Error(String(e)));
    }
  }

  redirect("/dashboard?activated=1");
}
