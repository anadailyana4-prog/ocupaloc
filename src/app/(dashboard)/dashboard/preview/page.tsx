import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { CopyPublicLinkButton } from "@/app/(dashboard)/dashboard/copy-public-link";
import { selectWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

type Prof = { slug: string | null };

export default async function DashboardPreviewPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { data: prof } = await selectWithTelefonFallback<Prof>(
    async (columns) => await supabase.from("profesionisti").select(columns).eq("user_id", user.id).maybeSingle(),
    "slug",
    "slug"
  );

  const slug = prof?.slug?.trim();
  if (!slug) {
    return (
      <div className="space-y-4">
        <h1 className="dash-page-title">Previzualizare pagină publică</h1>
        <p className="text-sm text-muted-foreground">Completează mai întâi slug-ul în Pagina publică.</p>
        <Link href="/dashboard/pagina" className="text-sm font-medium text-oc-amber underline">
          Deschide Pagina publică →
        </Link>
      </div>
    );
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ocupaloc.ro").replace(/\/$/, "");
  const publicUrl = `${base}/${slug}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 220, color: { dark: "#0f172a", light: "#ffffff" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="dash-page-title">Previzualizare pagină publică</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vezi exact ce vede clientul. Trimite linkul sau codul QR pe WhatsApp. Poți adăuga și scriptul embed:{" "}
          <a href={`${base}/widget.js`} className="text-oc-amber underline" target="_blank" rel="noopener noreferrer">
            widget.js
          </a>
          .
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-h-[520px] flex-1 overflow-hidden rounded-xl border oc-border bg-white shadow-inner">
          <iframe title="Previzualizare publică" src={`/${slug}`} className="h-[720px] w-full border-0 lg:h-[560px]" />
        </div>

        <aside className="w-full shrink-0 space-y-4 rounded-xl border oc-border bg-white p-4 lg:max-w-xs">
          <p className="text-xs font-medium uppercase tracking-wide oc-secondary-text">Link public</p>
          <p className="break-all text-sm text-oc-amber-light">{publicUrl}</p>
          <CopyPublicLinkButton slug={slug} />
          <div className="border-t border-zinc-700/50 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide oc-secondary-text">QR cod</p>
            <p className="mt-1 text-xs oc-secondary-text">Scanare rapidă de pe telefon</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode */}
            <img src={qrDataUrl} alt="QR către pagina de programări" width={220} height={220} className="mt-3 rounded-lg bg-white p-2" />
          </div>
          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium text-oc-amber underline underline-offset-2"
          >
            Deschide în tab nou →
          </Link>
        </aside>
      </div>
    </div>
  );
}
