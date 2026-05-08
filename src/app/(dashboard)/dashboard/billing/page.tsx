import { redirect } from "next/navigation";

import { ProfessionalBillingView } from "./professional-billing-view";
import { loadProfessionalBillingModel } from "@/lib/billing/professional-dashboard";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardBillingPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const model = await loadProfessionalBillingModel(user.id);
  if (!model) {
    redirect("/onboarding");
  }

  return <ProfessionalBillingView model={model} />;
}