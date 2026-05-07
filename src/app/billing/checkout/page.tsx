import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function BillingCheckoutPage() {
  redirect("/api/billing/create-checkout");
}