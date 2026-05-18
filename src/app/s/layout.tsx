import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function ShortLinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
