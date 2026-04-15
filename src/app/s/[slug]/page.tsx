import Image from "next/image";
import { notFound } from "next/navigation";

import { BookingCard } from "@/components/booking/BookingCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicSalonPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: prof, error } = await supabase
    .from("profesionisti")
    .select("id,slug,nume_business,logo_url,lucreaza_acasa,adresa_publica")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !prof) {
    notFound();
  }
  const { data: servicii } = await supabase
    .from("servicii")
    .select("id,nume,durata_minute,pret,culoare,activ,ordine")
    .eq("profesionist_id", prof.id)
    .eq("activ", true)
    .order("ordine", { ascending: true });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center space-y-2">
          {prof.logo_url ? (
            <Image
              src={prof.logo_url}
              alt={`Logo ${prof.nume_business}`}
              width={64}
              height={64}
              unoptimized
              className="mx-auto h-16 w-16 rounded-full border border-zinc-800 object-cover"
            />
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight">{prof.nume_business}</h1>
          <p className="text-sm text-zinc-400">
            {prof.lucreaza_acasa
              ? "Locația exactă o primești pe WhatsApp după confirmare"
              : prof.adresa_publica || "Programări online"}
          </p>
        </div>
        <BookingCard
          variant="live"
          slug={slug}
          publicBase={site || "https://ocupaloc.ro"}
          businessName={prof.nume_business}
          services={servicii ?? []}
        />
      </div>
    </div>
  );
}
