import Image from "next/image";

import { illustrationSrc, placementById } from "@/lib/illustrations/placement";

type Props = {
  priority?: boolean;
};

/**
 * Dashboard PNG e aproape alb/cream — pe homepage cream dispare fără cadru.
 * Bară browser închisă + fundal teal + umbră = contrast clar pe toate ecranele.
 */
export function DashboardHeroShowcase({ priority = false }: Props) {
  const placement = placementById("03-dashboard");
  if (!placement) return null;

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-[#0D9488]/25 bg-gradient-to-br from-[#E6F4F3] via-[#FAF9F7] to-[#FEF7E8] p-2 shadow-[0_28px_56px_-20px_rgba(15,23,42,0.22)] ring-1 ring-[#0F172A]/5 sm:p-3">
        <div
          className="flex items-center gap-2 rounded-t-xl bg-[#1E293B] px-3 py-2.5"
          aria-hidden
        >
          <div className="flex shrink-0 gap-1.5">
            <span className="size-2.5 rounded-full bg-[#F87171]" />
            <span className="size-2.5 rounded-full bg-[#FBBF24]" />
            <span className="size-2.5 rounded-full bg-[#34D399]" />
          </div>
          <div className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#0F172A] px-2 py-1 text-center text-[10px] font-medium tracking-wide text-slate-300 sm:text-xs">
            ocupaloc.ro/dashboard
          </div>
        </div>

        <div className="relative aspect-[3/2] overflow-hidden rounded-b-xl border border-[#CBD5E1] bg-[#E8E4DC]">
          <Image
            src={illustrationSrc(placement.publicPath)}
            alt={placement.alt}
            fill
            priority={priority}
            fetchPriority={priority ? "high" : "auto"}
            loading={priority ? "eager" : "lazy"}
            quality={80}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
            className="object-cover object-top"
          />
          <div
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]"
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-3 rounded-xl border oc-border bg-white px-3 py-2.5 text-center text-sm leading-snug oc-text md:text-left">
        <p className="font-semibold oc-accent">Ecranul tău din cont</p>
        <p className="mt-1 oc-secondary-text">
          Vezi câte programări ai azi, care sunt confirmate și ce zile ai libere — fără să cauți prin mesaje sau caiete.
        </p>
      </div>
    </div>
  );
}
