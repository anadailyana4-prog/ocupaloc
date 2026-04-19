import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";

import { verifyBookingManagementLink } from "@/lib/booking/confirmation-link";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams?: Promise<{ booking?: string; exp?: string; sig?: string; state?: string }>;
};

function stateMessage(state?: string): string | null {
  switch (state) {
    case "confirmed":
      return "Programarea a fost confirmată.";
    case "cancelled":
      return "Programarea a fost anulată.";
    case "rescheduled":
      return "Programarea a fost reprogramată.";
    case "invalid_slot":
      return "Slot indisponibil. Alege altă oră.";
    default:
      return null;
  }
}

export default async function BookingManagePage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const booking = sp.booking ?? "";
  const exp = sp.exp ?? "";
  const sig = sp.sig ?? "";

  if (!booking || !exp || !sig) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
        <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Link invalid</h1>
          <p className="mt-3 text-zinc-300">Lipsesc datele de securitate ale linkului.</p>
        </div>
      </main>
    );
  }

  const verify = verifyBookingManagementLink({ bookingId: booking, exp, sig });
  if (!verify.ok) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
        <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Link invalid sau expirat</h1>
          <p className="mt-3 text-zinc-300">Cere salonului un link nou de gestionare a programării.</p>
        </div>
      </main>
    );
  }

  const admin = createSupabaseServiceClient();
  const { data: row } = await admin
    .from("programari")
    .select("id, nume_client, data_start, profesionisti(slug,nume_business), servicii(nume)")
    .eq("id", booking)
    .maybeSingle();

  if (!row) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
        <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Programarea nu a fost găsită</h1>
        </div>
      </main>
    );
  }

  const relProf = row.profesionisti as { slug?: string; nume_business?: string | null } | { slug?: string; nume_business?: string | null }[] | null;
  const relServ = row.servicii as { nume?: string } | { nume?: string }[] | null;
  const prof = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const srv = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  const infoMessage = stateMessage(sp.state);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Gestionează programarea</h1>
          <p className="text-zinc-300">
            {row.nume_client}, ai programare la {prof?.nume_business ?? "salon"} pentru {srv?.nume ?? "serviciu"} pe{" "}
            {formatInTimeZone(new Date(String(row.data_start)), "Europe/Bucharest", "dd.MM.yyyy HH:mm")}.
          </p>
          {infoMessage ? <p className="text-sm text-emerald-300">{infoMessage}</p> : null}
        </div>

        <form action="/api/programare/manage" method="post" className="space-y-3">
          <input type="hidden" name="booking" value={booking} />
          <input type="hidden" name="exp" value={exp} />
          <input type="hidden" name="sig" value={sig} />
          <input type="hidden" name="op" value="confirm" />
          <button className="w-full rounded-full bg-emerald-600 px-4 py-2.5 font-semibold hover:bg-emerald-500" type="submit">
            Confirmă programarea
          </button>
        </form>

        <form action="/api/programare/manage" method="post" className="space-y-3">
          <input type="hidden" name="booking" value={booking} />
          <input type="hidden" name="exp" value={exp} />
          <input type="hidden" name="sig" value={sig} />
          <input type="hidden" name="op" value="cancel" />
          <button className="w-full rounded-full border border-red-500/40 bg-red-950/40 px-4 py-2.5 font-semibold text-red-200 hover:bg-red-900/50" type="submit">
            Anulează programarea
          </button>
        </form>

        <form action="/api/programare/manage" method="post" className="space-y-3 rounded-xl border border-zinc-700 p-4">
          <input type="hidden" name="booking" value={booking} />
          <input type="hidden" name="exp" value={exp} />
          <input type="hidden" name="sig" value={sig} />
          <input type="hidden" name="op" value="reschedule" />
          <label className="block text-sm text-zinc-300">Data și ora nouă</label>
          <input
            required
            name="newStartLocal"
            type="datetime-local"
            className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-white"
          />
          <button className="w-full rounded-full bg-indigo-600 px-4 py-2.5 font-semibold hover:bg-indigo-500" type="submit">
            Reprogramează
          </button>
          <p className="text-xs text-zinc-400">Ora este interpretată în fusul Europe/Bucharest.</p>
        </form>

        {prof?.slug ? (
          <Link href={`/${prof.slug}`} className="inline-flex rounded-full border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
            Înapoi la pagina salonului
          </Link>
        ) : null}
      </div>
    </main>
  );
}
