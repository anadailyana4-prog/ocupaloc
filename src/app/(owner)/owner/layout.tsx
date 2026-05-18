import { OwnerLayout } from "@/components/owner/layout-wrapper";
import { getOwnerBillingStatus } from "@/lib/billing/owner-status";
import { noIndexRobots } from "@/lib/seo";

export const metadata = {
  title: "OcupaLoc Owner Portal",
  description: "Owner control center for OcupaLoc",
  robots: noIndexRobots
};

export const dynamic = "force-dynamic";

export default function OwnerAppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const billingStatus = getOwnerBillingStatus();
  return <OwnerLayout billingStatus={billingStatus}>{children}</OwnerLayout>;
}
