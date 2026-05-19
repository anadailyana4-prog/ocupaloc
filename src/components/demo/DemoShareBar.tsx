"use client";

import Link from "next/link";

import { buildBarberWhatsAppOutreachMessage } from "@/lib/demo/barber-outreach";
import { Button } from "@/components/ui/button";

type Props = {
  demoUrl: string;
  signupUrl: string;
  businessName: string;
};

export function DemoShareBar({ demoUrl, signupUrl, businessName }: Props) {
  const whatsappText = encodeURIComponent(
    buildBarberWhatsAppOutreachMessage({ businessName, demoUrl, signupUrl })
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 px-4 pb-10">
      <Button asChild variant="outline" className="border-oc-border bg-white">
        <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer">
          Trimite demo pe WhatsApp
        </a>
      </Button>
      <Button asChild variant="ghost">
        <Link href="/demo-interactiv">Creează alt demo</Link>
      </Button>
    </div>
  );
}
