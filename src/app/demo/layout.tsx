import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
