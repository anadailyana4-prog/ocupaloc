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
  return children;
}
