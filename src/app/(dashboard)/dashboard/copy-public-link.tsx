"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  slug: string;
};

export function CopyPublicLinkButton({ slug }: Props) {
  const [busy, setBusy] = useState(false);
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ocupaloc.ro").replace(/\/$/, "");
  const url = `${base}/${slug}`;

  async function copy() {
    setBusy(true);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiat în clipboard.");
    } catch {
      toast.error("Nu am putut copia linkul.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="rounded-full" disabled={busy} onClick={() => void copy()}>
      {busy ? "Se copiază…" : "Copiază link public"}
    </Button>
  );
}
