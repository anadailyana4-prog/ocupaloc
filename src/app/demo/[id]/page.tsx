import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoLandingPreview } from "@/components/landing/LandingPage";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type PageProps = { params: Promise<{ id: string }> };

type DemoRow = {
  id: string;
  business_name: string;
  business_type: string;
  city: string;
  services: string[];
  expires_at: string;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Demo Salon",
    robots: {
      index: false,
      follow: false,
      noarchive: true
    }
  };
}

export default async function DemoByIdPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("demos")
    .select("id,business_name,business_type,city,services,expires_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    notFound();
  }

  const demo = data as DemoRow | null;
  if (!demo) {
    notFound();
  }

  const isExpired = new Date(demo.expires_at).getTime() <= Date.now();
  if (isExpired) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-20 text-zinc-100">
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <h1 className="text-3xl font-bold">Demo expirat, creează altul</h1>
          <p className="mt-3 text-zinc-400">Link-urile demo sunt valide 24 de ore.</p>
          <Link href="/demo-interactiv" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
            Creează demo nou
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <DemoLandingPreview
        businessName={demo.business_name}
        city={demo.city}
        businessType={demo.business_type}
        services={Array.isArray(demo.services) ? demo.services : []}
        ctaHref={`/signup?demo=${demo.id}&name=${encodeURIComponent(demo.business_name)}`}
      />
    </main>
  );
}

