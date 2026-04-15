"use client";

import Link from "next/link";
import { useEffect } from "react";

import { BookingCard } from "@/components/booking/BookingCard";

export function LandingPage() {
  useEffect(() => {
    const simDA = document.getElementById("simDA");
    const simNU = document.getElementById("simNU");
    const smsReply = document.getElementById("smsReply");
    const smsStatus = document.getElementById("smsStatus");
    const onDa = () => {
      if (!smsReply || !smsStatus) return;
      smsReply.textContent = "Confirm programarea. Mulțumesc!";
      smsReply.classList.remove("hidden");
      smsStatus.textContent = "Confirmat";
      smsStatus.className = "text-sm font-medium text-emerald-400";
      smsStatus.classList.remove("hidden");
    };
    const onNu = () => {
      if (!smsReply || !smsStatus) return;
      smsReply.textContent = "Nu pot ajunge, îmi pare rău.";
      smsReply.classList.remove("hidden");
      smsStatus.textContent = "Anulat";
      smsStatus.className = "text-sm font-medium text-red-400";
      smsStatus.classList.remove("hidden");
    };
    simDA?.addEventListener("click", onDa);
    simNU?.addEventListener("click", onNu);
    document.querySelectorAll(".booking-item").forEach((item) => {
      item.addEventListener("click", () => {
        window.alert("În aplicația reală poți edita, confirma sau anula programarea direct de aici.");
      });
    });
    document.querySelectorAll(".faq-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const content = btn.nextElementSibling as HTMLElement | null;
        const icon = btn.querySelector(".faq-icon");
        content?.classList.toggle("hidden");
        icon?.classList.toggle("rotate-180");
      });
    });
    return () => {
      simDA?.removeEventListener("click", onDa);
      simNU?.removeEventListener("click", onNu);
    };
  }, []);

  return (
    <div className="bg-black text-white antialiased">
      <header className="border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-extrabold tracking-tight">ocupaloc.ro</div>
          <Link
            href="/signup"
            data-analytics="homepage_cta_signup"
            data-cta-location="homepage_header"
            className="px-4 py-2 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-base font-semibold"
          >
            Încearcă 14 zile gratis
          </Link>
        </div>
      </header>

      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3 text-sm text-zinc-300 text-center">
          Primești acces instant. După 7 zile gratuite, abonamentul se activează automat la 99,99 lei/lună. Poți anula oricând din cont.
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl leading-[1.05] font-extrabold tracking-tight text-balance">
              Software programări pentru saloane beauty. 99,99 RON/lună. Zero comision.
            </h1>
            <p className="mt-5 text-lg text-zinc-400 max-w-xl">
              Frizerie, manichiură, cosmetică, masaj. Păstrezi 100% din încasări. Alternativă românească la Fresha.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                data-analytics="homepage_cta_signup"
                data-cta-location="homepage_hero"
                className="px-5 py-3 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold text-base"
              >
                Încearcă 14 zile gratis
              </Link>
              <a href="#demo" className="px-5 py-3 rounded-lg border border-zinc-700 text-zinc-200 font-semibold text-base hover:bg-zinc-900">
                Vezi cum funcționează
              </a>
            </div>
          </div>
          <BookingCard variant="demo" />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Peste 40 de profesioniști au renunțat la comisioane</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              &quot;Economisesc 600 RON lunar. Înainte plăteam 2€ per programare la Fresha.&quot;
              <p className="mt-3 text-zinc-500">- Maria, manichiură București</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              &quot;Clienții mei rezervă singuri la 2 dimineața. Eu dorm liniștit.&quot;
              <p className="mt-3 text-zinc-500">- Andrei, frizerie Cluj</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              &quot;Suport în română, răspund în 5 minute pe WhatsApp.&quot;
              <p className="mt-3 text-zinc-500">- Elena, cosmetică Timișoara</p>
            </div>
          </div>
          <p className="mt-5 text-center text-sm font-semibold text-emerald-300">3.247 programări procesate luna trecută</p>
        </div>
      </section>

      <div className="border-y border-gray-800 py-12">
        <p className="mb-6 text-center text-sm text-gray-400">Folosit de frizeri și saloane din România</p>
        <div className="flex items-center justify-center gap-8 opacity-60">
          <span className="text-2xl">💈</span>
          <span className="text-gray-500">Salon Maria, București</span>
          <span className="text-2xl">✂️</span>
          <span className="text-gray-500">Barber Shop Cluj</span>
          <span className="text-2xl">💇</span>
          <span className="text-gray-500">Studio Iași</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-zinc-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
          </svg>
          Google Calendar
          <span className="text-zinc-700">•</span>
          <span>Toate programările apar instant în calendarul tău.</span>
        </div>
      </div>

      <section id="features" className="max-w-6xl mx-auto px-4 py-16 border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Trei pași. Fără aplicații.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="text-2xl font-bold text-[#1d4ed8] mb-3">1</div>
            <h3 className="text-xl font-bold mb-2">Primești link-ul tău</h3>
            <p className="text-base text-zinc-400 leading-relaxed mb-4">
              Îl pui în bio Instagram, pe site, TikTok, Facebook, Google Maps, WhatsApp.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700 text-sm text-zinc-300">ocupaloc.ro/numele-tau</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="text-2xl font-bold text-[#1d4ed8] mb-3">2</div>
            <h3 className="text-xl font-bold mb-2">Clienții rezervă</h3>
            <p className="text-base text-zinc-400 leading-relaxed">
              Tu stabilești serviciile, durata și programul. Clientul alege doar slotul liber.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="text-2xl font-bold text-[#1d4ed8] mb-3">3</div>
            <h3 className="text-xl font-bold mb-2">Confirmă automat</h3>
            <p className="text-base text-zinc-400 leading-relaxed mb-4">
              Primește SMS/Email automat. Confirmă cu DA sau NU. Programarea intră direct în Google Calendar.
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-zinc-800 text-sm">
                Bună! Mâine, 15 aprilie, ora 14:00 la Salon Elegance. Confirmi prezența? Răspunde cu DA sau NU
              </div>
              <div className="flex gap-2">
                <button id="simDA" type="button" className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium">
                  Simulează DA
                </button>
                <button id="simNU" type="button" className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium">
                  Simulează NU
                </button>
              </div>
              <div id="smsReply" className="hidden p-3 rounded-lg bg-zinc-800 text-sm" />
              <div id="smsStatus" className="hidden text-sm font-medium" />
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="max-w-6xl mx-auto px-4 py-16 border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Tot ce ai nevoie, nimic în plus</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <svg className="w-6 h-6 text-[#1d4ed8] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Rezervări 24/7</h3>
            <p className="text-base text-zinc-400">Clienții rezervă oricând, chiar și noaptea sau în weekend.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <svg className="w-6 h-6 text-[#1d4ed8] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Control total</h3>
            <p className="text-base text-zinc-400">Setezi programul, pauzele, durata serviciilor și prețurile.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <svg className="w-6 h-6 text-[#1d4ed8] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-xl font-bold mb-2">Confirmări automate</h3>
            <p className="text-base text-zinc-400">SMS și email trimise automat. Răspunde cu DA sau NU.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <svg className="w-6 h-6 text-[#1d4ed8] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Anulare simplă</h3>
            <p className="text-base text-zinc-400">Clientul poate anula sau reprograma singur din link-ul primit.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <svg className="w-6 h-6 text-[#1d4ed8] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Fără comisioane</h3>
            <p className="text-base text-zinc-400">Plătești doar abonamentul. Zero comision pe rezervări.</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Vezi totul într-un singur loc</h2>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-sm">
            <button type="button" className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-medium">
              Toate
            </button>
            <button type="button" className="px-3 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800">
              Confirmate
            </button>
            <button type="button" className="px-3 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800">
              În așteptare
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-zinc-500 mb-2">Azi, duminică 13 aprilie</div>
            <div className="p-4 rounded-lg bg-zinc-800/60 border border-zinc-700 flex items-center justify-between hover:bg-zinc-800 cursor-pointer booking-item">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-base font-bold">10:00</div>
                  <div className="text-sm text-zinc-500">10:45</div>
                </div>
                <div>
                  <div className="text-base font-semibold">Tuns + Spălat</div>
                  <div className="text-sm text-zinc-400">Andrei</div>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium">Confirmat</div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16 border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Un singur plan. Totul inclus.</h2>
        </div>
        <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-3xl font-extrabold">
              99,99 lei<span className="text-lg text-zinc-500 font-normal">/lună</span>
            </div>
            <div className="text-sm text-zinc-500 mt-1">per locație • TVA inclus</div>
          </div>
          <ul className="space-y-3 mb-8 text-base">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Link personalizat de rezervare</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Programări nelimitate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Confirmări automate SMS/Email</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Integrare Google Calendar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Suport pe email</span>
            </li>
          </ul>
          <Link
            href="/signup"
            data-analytics="homepage_cta_signup"
            data-cta-location="homepage_pricing"
            className="block w-full rounded-lg bg-[#1d4ed8] py-3 text-center text-base font-semibold text-white hover:bg-[#1e40af]"
          >
            Începe gratuit
          </Link>
          <div className="text-sm text-zinc-500 text-center mt-3">7 zile gratuit, fără card.</div>
        </div>
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-4 py-16 border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Întrebări frecvente</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <button type="button" className="w-full px-6 py-4 text-left flex items-center justify-between faq-toggle">
              <span className="text-base font-semibold">Cum îmi conectez Google Calendar?</span>
              <svg className="w-5 h-5 text-zinc-500 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="px-6 pb-4 text-base text-zinc-400 hidden faq-content">
              Te loghezi cu Google o singură dată. Toate programările noi apar instant în calendarul tău.
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <button type="button" className="w-full px-6 py-4 text-left flex items-center justify-between faq-toggle">
              <span className="text-base font-semibold">Pot lua avans sau plata integrală?</span>
              <svg className="w-5 h-5 text-zinc-500 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="px-6 pb-4 text-base text-zinc-400 hidden faq-content">
              Da. Activezi plata online și clientul plătește cu cardul la rezervare.
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <button type="button" className="w-full px-6 py-4 text-left flex items-center justify-between faq-toggle">
              <span className="text-base font-semibold">Se pot anula sau reprograma clienții?</span>
              <svg className="w-5 h-5 text-zinc-500 transition-transform faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="px-6 pb-4 text-base text-zinc-400 hidden faq-content">
              Da. Primesc link securizat în SMS/Email și pot anula sau reprograma singuri.
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10 text-sm">
            <div>
              <div className="font-semibold mb-3 text-white">Produs</div>
              <ul className="space-y-2 text-zinc-500">
                <li>
                  <a href="#features" className="hover:text-zinc-300">
                    Funcționalități
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-zinc-300">
                    Prețuri
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-zinc-300">
                    Întrebări frecvente
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3 text-white">Suport</div>
              <ul className="space-y-2 text-zinc-500">
                <li>
                  <a href="https://wa.me/40700000000" target="_blank" className="hover:text-zinc-300" rel="noreferrer">
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3 text-white">Legal</div>
              <ul className="space-y-2 text-zinc-500">
                <li>
                  <Link href="/termeni" className="hover:text-zinc-300">
                    Termeni și condiții
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialitate" className="hover:text-zinc-300">
                    Politica de confidențialitate
                  </Link>
                </li>
                <li>
                  <Link href="/gdpr" className="hover:text-zinc-300">
                    Informare GDPR
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-zinc-300">
                    Politica de cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
            <div>© 2026 ocupaloc.ro. Toate drepturile rezervate.</div>
            <div>Date găzduite în UE. Conform GDPR.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

type DemoLandingProps = {
  businessName: string;
  city: string;
  businessType: string;
  services: Array<string | { name?: string; price?: number; label?: string }>;
  ctaHref: string;
};

export function DemoLandingPreview({ businessName, city, businessType, services, ctaHref }: DemoLandingProps) {
  const serviceLabels = services.map((service) => {
    if (typeof service === "string") return service;
    if (typeof service === "object" && service && "label" in service && typeof (service as { label?: unknown }).label === "string") {
      return (service as { label: string }).label;
    }
    if (typeof service === "object" && service && "name" in service && "price" in service) {
      const name = String((service as { name?: unknown }).name ?? "Serviciu");
      const price = String((service as { price?: unknown }).price ?? "");
      return `${name}${price ? ` ${price} RON` : ""}`;
    }
    return "Serviciu";
  });

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-white">
      <div className="rounded-2xl border border-yellow-500 bg-yellow-400 p-4 text-center text-sm font-bold text-black">
        DEMO - Acest salon nu există, e doar exemplu
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h1 className="text-4xl font-extrabold tracking-tight">{businessName} - {city}</h1>
        <p className="mt-3 text-zinc-300">
          Exemplu de pagină pentru {businessType.toLowerCase()} cu programări online și preț fix 99,99 RON/lună, fără comision.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {serviceLabels.map((service) => (
            <div key={service} className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm">
              {service}
            </div>
          ))}
        </div>
        <Link
          href={ctaHref}
          className="mt-8 inline-flex rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-500"
        >
          Vreau și eu așa
        </Link>
      </div>
      <BookingCard variant="demo" />
    </section>
  );
}
