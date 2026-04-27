import Link from "next/link";
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
        expand: ["customer"]
      });

      const profesionistId = session.metadata?.profesionist_id;
      const email =
        session.customer_details?.email ??
        (typeof session.customer === "object" && session.customer !== null
          ? (session.customer as { email?: string | null }).email ?? null
          : null);

      if (profesionistId && email) {
        const admin = createSupabaseServiceClient();
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

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Trial activat!</h1>
      <p className="mt-4 text-zinc-700">
        Contul tău este activ cu 14 zile gratuite. Ți-am trimis un email de confirmare. Abonamentul (59,99 RON/lună) pornește automat la final.
      </p>
      <div className="mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Mergi în dashboard
        </Link>
      </div>
    </main>
  );
}
