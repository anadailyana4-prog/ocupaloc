import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function AuthUtilityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
