import Image from "next/image";

import { cn } from "@/lib/utils";
import { illustrationSrc, placementById } from "@/lib/illustrations/placement";

type Aspect = "dashboard" | "landscape" | "portrait" | "square";

const aspectClasses: Record<Aspect, string> = {
  dashboard: "aspect-[3/2] max-h-[min(72vh,540px)]",
  landscape: "aspect-[3/2] max-h-[min(50vh,400px)]",
  portrait: "aspect-[4/5] max-h-[min(65vh,480px)] sm:max-h-[420px]",
  square: "aspect-square max-h-[min(50vh,400px)]"
};

type Props = {
  id: string;
  aspect?: Aspect;
  priority?: boolean;
  className?: string;
  /** UI mockup screenshots — show full frame without cropping */
  contain?: boolean;
};

export function MarketingIllustration({
  id,
  aspect = "landscape",
  priority = false,
  className,
  contain = false
}: Props) {
  const placement = placementById(id);
  if (!placement) return null;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border oc-border bg-white shadow-[0_12px_32px_-20px_rgba(15,118,110,0.35)]",
        aspectClasses[aspect],
        className
      )}
    >
      <Image
        src={illustrationSrc(placement.publicPath)}
        alt={placement.alt}
        fill
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        quality={80}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 85vw, 560px"
        className={cn(
          contain ? "object-contain object-center p-1 sm:p-2" : "object-cover object-center"
        )}
      />
    </div>
  );
}
