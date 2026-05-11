import { OwnerLayout } from "@/components/owner/layout-wrapper";

export const metadata = {
  title: "OcupaLoc Owner Portal",
  description: "Owner control center for OcupaLoc"
};

export const dynamic = "force-dynamic";

export default function OwnerAppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <OwnerLayout>{children}</OwnerLayout>;
}
