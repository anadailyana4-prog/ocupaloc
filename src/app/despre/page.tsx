import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Despre OcupaLoc",
  description:
    "Află povestea OcupaLoc și de ce construim un produs de programări online simplu pentru frizeri, coafori și saloane din România."
};

export default function DesprePage() {
  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <article className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Despre OcupaLoc</h1>
        <p className="leading-relaxed oc-text">
          OcupaLoc a pornit dintr-o problemă simplă: profesioniștii din beauty pierd ore întregi pe telefon pentru programări care pot fi automate.
          Dacă ești frizer sau coafor, nu ai nevoie de încă o platformă complicată. Ai nevoie de un link pe care îl trimiți clientului și care îți
          umple programul fără stres.
        </p>
        <p className="leading-relaxed oc-text">
          Construim produsul împreună cu oameni care lucrează zilnic în salon. Ne interesează lucrurile care aduc bani și timp înapoi: rezervare
          rapidă, program clar, clienți mai puțini pierduți și comunicare simplă. Nu adăugăm funcții doar ca să arate bine într-o prezentare.
        </p>
        <p className="leading-relaxed oc-text">
          Viziunea noastră este să facem programarea online standardul pentru saloanele locale din România. Începem cu frizerii, coafor și
          manichiură, apoi extindem acolo unde există cerere reală.
        </p>
        <Link href="/signup?start=1" className="inline-flex rounded-lg oc-primary px-6 py-3 font-semibold text-white">
          Începe gratuit
        </Link>
      </article>
    </main>
  );
}
