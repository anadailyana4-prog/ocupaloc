import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
