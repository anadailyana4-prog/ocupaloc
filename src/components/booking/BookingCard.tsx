"use client";

import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { createPublicBooking } from "@/actions/public-booking";
import { trackBookingEvent } from "@/lib/analytics";
import { formatSlotLabel } from "@/lib/slots";
import type { ServiciuRow } from "@/types/db";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type DemoProps = { variant: "demo" };

type LegacyService = Pick<ServiciuRow, "id" | "nume" | "durata_minute" | "pret">;
export type TenantService = { id: string; name: string; duration_min: number; price: number };

type LiveProps = {
  variant: "live";
  slug: string;
  publicBase: string;
  businessName: string;
  /** Pagina publică /[slug]: layout aerisit, zile orizontale, grid 3 col sloturi */
  publicPageLayout?: boolean;
} & (
  | { tenantBooking?: false; services: LegacyService[] }
  | { tenantBooking: true; services: TenantService[] }
);

export type BookingCardProps = DemoProps | LiveProps;

export function BookingCard(props: BookingCardProps) {
  if (props.variant === "demo") {
    return <BookingCardDemo />;
  }
  return <BookingCardLive {...props} />;
}

function BookingCardDemo() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs md:text-sm text-zinc-400">ocupaloc.ro/salon-elegance</div>
        <div className="flex items-center gap-1 text-xs md:text-sm text-emerald-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Online
        </div>
      </div>
      <div className="space-y-5">
        <div>
          <div className="text-xs md:text-sm font-medium text-zinc-500 mb-2">1. Serviciu ales</div>
          <div className="rounded-lg border border-[#1d4ed8]/25 bg-[#1d4ed8]/10 px-3 py-2.5">
            <div className="text-sm md:text-base font-semibold text-white">Tuns + Spălat</div>
            <div className="text-sm md:text-base text-zinc-400 mt-0.5">45 min • 80 lei</div>
          </div>
        </div>
        <div>
          <div className="text-xs md:text-sm font-medium text-zinc-500 mb-2">2. Alege data</div>
          <div className="text-sm md:text-base text-zinc-500 mb-2">Aprilie 2025</div>
          <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-xs md:text-sm">
            <div className="text-zinc-600 py-2">L</div>
            <div className="text-zinc-600 py-2">M</div>
            <div className="text-zinc-600 py-2">M</div>
            <div className="text-zinc-600 py-2">J</div>
            <div className="text-zinc-600 py-2">V</div>
            <div className="text-zinc-600 py-2">S</div>
            <div className="text-zinc-600 py-2">D</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">7</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">8</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">9</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">10</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">11</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">12</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">13</div>
            <div className="aspect-square rounded bg-zinc-800 text-zinc-300 flex items-center justify-center">14</div>
            <div className="aspect-square rounded bg-[#1d4ed8] text-white font-semibold flex items-center justify-center">15</div>
            <div className="aspect-square rounded bg-zinc-800 text-zinc-300 flex items-center justify-center">16</div>
            <div className="aspect-square rounded bg-zinc-800 text-zinc-300 flex items-center justify-center">17</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">18</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">19</div>
            <div className="aspect-square flex items-center justify-center text-zinc-700">20</div>
          </div>
        </div>
        <div>
          <div className="text-xs md:text-sm font-medium text-zinc-500 mb-2">3. Alege ora</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="py-2.5 text-sm md:text-base rounded-lg bg-zinc-950 text-center font-medium text-zinc-500">10:00</div>
            <div className="py-2.5 text-sm md:text-base rounded-lg bg-zinc-950 text-center font-medium text-zinc-500">11:00</div>
            <div className="py-2.5 text-sm md:text-base rounded-lg bg-[#1d4ed8] text-center font-bold text-white">14:00</div>
            <div className="py-2.5 text-sm md:text-base rounded-lg bg-zinc-800 text-center font-medium text-zinc-400">15:00</div>
            <div className="py-2.5 text-sm md:text-base rounded-lg bg-zinc-800 text-center font-medium text-zinc-400">16:00</div>
            <div className="py-2.5 text-sm md:text-base rounded-lg bg-zinc-950 text-center font-medium text-zinc-500">17:00</div>
          </div>
          <p className="mt-2 text-xs md:text-sm text-zinc-500">Gri = ocupat</p>
        </div>
        <div className="pt-4 border-t border-zinc-800">
          <div className="text-xs md:text-sm font-medium text-zinc-500 mb-3">4. Confirmare</div>
          <div className="text-sm md:text-base font-semibold text-white">Tuns + Spălat</div>
          <div className="mt-1 text-sm md:text-base text-zinc-400">Marți, 15 aprilie • 14:00 - 14:45</div>
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4 mt-4">
            <p className="font-bold text-center text-black">⚠️ Acesta este un DEMO</p>
            <p className="text-sm text-center text-black">Rezervarea nu este reală. Creează-ți propriul salon mai jos.</p>
          </div>
          <Button disabled className="w-full opacity-50 cursor-not-allowed">
            Demo - Rezervare indisponibilă
          </Button>
        </div>
      </div>
    </div>
  );
}

function isTenantLive(props: LiveProps): props is LiveProps & { tenantBooking: true; services: TenantService[] } {
  return props.tenantBooking === true;
}

function normalizePhone(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isValidRoPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

type SlotPick = { start: Date; staffId?: string };

function BookingCardLive(props: LiveProps) {
  const { slug, publicBase, businessName, services, publicPageLayout = false } = props;
  const tenant = isTenantLive(props);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(services[0]?.id ?? null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => (publicPageLayout ? startOfDay(new Date()) : null));
  const [slotPicks, setSlotPicks] = useState<SlotPick[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedPick, setSelectedPick] = useState<SlotPick | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [nume, setNume] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successSummary, setSuccessSummary] = useState<{ clientName: string; timeLabel: string } | null>(null);

  const horizonDays = useMemo(() => {
    const start = startOfDay(new Date());
    return eachDayOfInterval({ start, end: addDays(start, 13) });
  }, []);

  const selectedService = useMemo(() => services.find((s) => s.id === selectedServiceId) ?? null, [services, selectedServiceId]);

  useEffect(() => {
    setSuccessSummary(null);
  }, [selectedServiceId]);

  const serviceTitle = (s: LegacyService | TenantService) => (tenant ? (s as TenantService).name : (s as LegacyService).nume);
  const serviceDurationMin = (s: LegacyService | TenantService | null) => {
    if (!s) return 0;
    return tenant ? (s as TenantService).duration_min : (s as LegacyService).durata_minute;
  };
  const servicePrice = (s: LegacyService | TenantService) => (tenant ? (s as TenantService).price : (s as LegacyService).pret);

  const monthDays = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const padBefore = useMemo(() => {
    const start = startOfMonth(month);
    const dow = start.getDay();
    const mondayBased = dow === 0 ? 6 : dow - 1;
    return Array.from({ length: mondayBased }, (_, i) => i);
  }, [month]);

  const dateStr = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;

  const loadSlots = useCallback(async () => {
    if (!selectedServiceId || !dateStr) return;
    setLoadingSlots(true);
    try {
      if (tenant) {
        const r = await fetch(
          `/api/availability?org=${encodeURIComponent(slug)}&service=${encodeURIComponent(selectedServiceId)}&date=${encodeURIComponent(dateStr)}`
        );
        const j = (await r.json()) as {
          slots?: { start_time: string; end_time: string; staff_id: string }[];
          error?: string | null;
        };
        if (!r.ok) throw new Error(j.error || "Nu am putut încărca sloturile.");
        setSlotPicks(
          (j.slots ?? []).map((row) => ({
            start: new Date(row.start_time),
            staffId: row.staff_id
          }))
        );
        setSelectedPick(null);
      } else {
        const r = await fetch(
          `/api/public/slots?slug=${encodeURIComponent(slug)}&serviciuId=${encodeURIComponent(selectedServiceId)}&date=${encodeURIComponent(dateStr)}`
        );
        const j = (await r.json()) as { slots?: string[]; error?: string };
        if (!r.ok) throw new Error(j.error || "Nu am putut încărca orele.");
        setSlotPicks((j.slots ?? []).map((s) => ({ start: new Date(s) })));
        setSelectedPick(null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare.");
      setSlotPicks([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [dateStr, selectedServiceId, slug, tenant]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const displayUrl = tenant
    ? `${publicBase.replace(/\/$/, "")}/${slug}`
    : `${publicBase.replace(/\/$/, "")}/s/${slug}`;

  async function submitBooking() {
    if (!selectedService || !selectedPick || !dateStr) return;
    if (tenant) {
      if (!selectedPick.staffId) {
        toast.error("Slot invalid (lipsește specialistul).");
        return;
      }
      const cleanName = nume.trim();
      const cleanPhone = normalizePhone(telefon);
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanName || !cleanPhone || !cleanEmail) {
        toast.error("Completează numele, telefonul și emailul.");
        return;
      }
      if (!isValidRoPhone(cleanPhone)) {
        toast.error("Introdu un număr de telefon valid.");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        toast.error("Introdu un email valid.");
        return;
      }
      trackBookingEvent("booking_submit_started", {
        mode: "tenant",
        slug,
        service_id: selectedService.id
      });
      setSubmitting(true);
      try {
        const res = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgSlug: slug,
            serviceId: selectedService.id,
            staffId: selectedPick.staffId,
            startTime: selectedPick.start.toISOString(),
            clientName: cleanName,
            clientPhone: cleanPhone,
            clientEmail: cleanEmail
          })
        });
        const j = (await res.json()) as { success?: boolean; error?: string | Record<string, unknown> };
        if (!res.ok || !j.success) {
          const errMsg = typeof j.error === "string" ? j.error : "Nu s-a putut rezerva.";
          trackBookingEvent("booking_submit_failed", {
            mode: "tenant",
            slug,
            service_id: selectedService.id,
            reason: errMsg
          });
          toast.error(errMsg);
          return;
        }
        trackBookingEvent("booking_submit_success", {
          mode: "tenant",
          slug,
          service_id: selectedService.id
        });
        setSuccessSummary({
          clientName: cleanName,
          timeLabel: formatSlotLabel(selectedPick.start)
        });
        setModalOpen(false);
        setNume("");
        setTelefon("");
        setEmail("");
        void loadSlots();
        setSelectedPick(null);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const cleanName = nume.trim();
    const cleanPhone = normalizePhone(telefon);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanPhone || !cleanEmail) {
      toast.error("Completează numele, telefonul și emailul.");
      return;
    }
    if (!isValidRoPhone(cleanPhone)) {
      toast.error("Introdu un număr de telefon valid.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error("Introdu un email valid.");
      return;
    }
    trackBookingEvent("booking_submit_started", {
      mode: "public",
      slug,
      service_id: selectedService.id
    });
    setSubmitting(true);
    try {
      const res = await createPublicBooking({
        slug,
        serviciuId: selectedService.id,
        dateStr,
        slotIso: selectedPick.start.toISOString(),
        numeClient: cleanName,
        telefonClient: cleanPhone,
        emailClient: cleanEmail
      });
      if (!res.ok) {
        const reason = "message" in res && typeof res.message === "string" ? res.message : "validation_failed";
        trackBookingEvent("booking_submit_failed", {
          mode: "public",
          slug,
          service_id: selectedService.id,
          reason
        });
        if ("message" in res && typeof res.message === "string") {
          toast.error(res.message);
        } else {
          toast.error("Nu s-a putut salva. Verifică câmpurile.");
        }
        return;
      }
      trackBookingEvent("booking_submit_success", {
        mode: "public",
        slug,
        service_id: selectedService.id
      });
      toast.success("Programare trimisă! Vei fi contactat pentru confirmare.");
      setModalOpen(false);
      setStep(1);
      setNume("");
      setTelefon("");
      setEmail("");
      void loadSlots();
    } finally {
      setSubmitting(false);
    }
  }

  const cardShell = publicPageLayout
    ? "rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-8 md:p-10 shadow-xl shadow-black/40 backdrop-blur-sm"
    : "rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-5";

  const sectionGap = publicPageLayout ? "space-y-10" : "space-y-5";

  const slotGridClass = publicPageLayout ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 md:grid-cols-3 gap-2";

  const slotBtnClass = (isSel: boolean) =>
    publicPageLayout
      ? `rounded-full py-3.5 text-sm font-semibold transition ${
          isSel ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700"
        }`
      : `py-2.5 text-sm md:text-base rounded-lg text-center font-medium ${
          isSel ? "bg-[#1d4ed8] text-white font-bold" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
        }`;

  return (
    <div className={cardShell}>
      {!publicPageLayout ? (
        <div className="mb-4 flex items-center justify-between">
          <div className="truncate pr-2 text-xs text-zinc-400 md:text-sm">{displayUrl}</div>
          <div className="flex shrink-0 items-center gap-1 text-xs text-emerald-400 md:text-sm">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Online
          </div>
        </div>
      ) : null}

      {tenant && publicPageLayout && successSummary ? (
        <div className="space-y-8 rounded-3xl border border-emerald-500/35 bg-emerald-950/40 px-6 py-12 text-center shadow-lg shadow-emerald-950/30 md:px-10 md:py-14">
          <p className="text-5xl leading-none text-emerald-400" aria-hidden>
            ✓
          </p>
          <p className="text-xl font-semibold leading-relaxed text-white md:text-2xl">
            Rezervat pentru {successSummary.clientName} la {successSummary.timeLabel}
          </p>
          <p className="text-sm text-zinc-400">Îți trimitem confirmarea pe telefon.</p>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full px-8 py-6 text-base"
            onClick={() => {
              setSuccessSummary(null);
              setSelectedPick(null);
            }}
          >
            Altă programare
          </Button>
        </div>
      ) : (
        <div className={sectionGap}>
          <div>
            <div className={`mb-3 font-medium text-zinc-500 ${publicPageLayout ? "text-xs uppercase tracking-wider" : "text-xs md:text-sm"}`}>
              {publicPageLayout ? "Servicii" : "1. Serviciu ales"}
            </div>
            <div className={publicPageLayout ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "space-y-2"}>
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(s.id);
                    trackBookingEvent("booking_service_selected", {
                      mode: tenant ? "tenant" : "public",
                      slug,
                      service_id: s.id
                    });
                  }}
                  className={`w-full border text-left transition-colors ${
                    publicPageLayout
                      ? `rounded-2xl px-5 py-5 ${
                          selectedServiceId === s.id
                            ? "border-indigo-500/50 bg-indigo-600/15 ring-2 ring-indigo-500/40"
                            : "border-zinc-700/80 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800/80"
                        }`
                      : `rounded-lg px-3 py-2.5 ${
                          selectedServiceId === s.id
                            ? "border-[#1d4ed8]/25 bg-[#1d4ed8]/10"
                            : "border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800/70"
                        }`
                  }`}
                >
                  <div className={`font-semibold text-white ${publicPageLayout ? "text-base md:text-lg" : "text-sm md:text-base"}`}>
                    {serviceTitle(s)}
                  </div>
                  <div className={`mt-1 text-zinc-400 ${publicPageLayout ? "text-sm" : "text-sm md:text-base"}`}>
                    {serviceDurationMin(s)} min · {servicePrice(s)} RON
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            {publicPageLayout ? (
              <>
                <div className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Alege ziua</div>
                <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                  {horizonDays.map((day) => {
                    const isSel = selectedDay && isSameDay(day, selectedDay);
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => {
                          setSelectedDay(day);
                          setSuccessSummary(null);
                          trackBookingEvent("booking_day_selected", {
                            mode: tenant ? "tenant" : "public",
                            slug,
                            date: format(day, "yyyy-MM-dd")
                          });
                        }}
                        className={`flex min-w-[4.75rem] shrink-0 flex-col items-center rounded-full border-2 px-4 py-3 transition ${
                          isSel
                            ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                            : "border-zinc-700 bg-zinc-800/60 text-zinc-200 hover:border-zinc-500"
                        }`}
                      >
                        <span className={`text-[11px] font-medium capitalize ${isSel ? "text-indigo-100/90" : "text-zinc-400"}`}>
                          {format(day, "EEE", { locale: ro })}
                        </span>
                        <span className="text-lg font-bold">{format(day, "d")}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-zinc-500 md:text-sm">2. Alege data</div>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs text-zinc-400 hover:text-white" onClick={() => setMonth((m) => addMonths(m, -1))}>
                      ←
                    </button>
                    <button type="button" className="text-xs text-zinc-400 hover:text-white" onClick={() => setMonth((m) => addMonths(m, 1))}>
                      →
                    </button>
                  </div>
                </div>
                <div className="mb-2 text-sm capitalize text-zinc-500 md:text-base">
                  {format(month, "LLLL yyyy", { locale: ro })}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs md:gap-2 md:text-sm">
                  {["L", "M", "M", "J", "V", "S", "D"].map((d) => (
                    <div key={d} className="py-2 text-zinc-600">
                      {d}
                    </div>
                  ))}
                  {padBefore.map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-square" />
                  ))}
                  {monthDays.map((day) => {
                    const isSel = selectedDay && isSameDay(day, selectedDay);
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`flex aspect-square items-center justify-center rounded ${
                          isSel ? "bg-[#1d4ed8] font-semibold text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div>
            <div className={`mb-3 font-medium text-zinc-500 ${publicPageLayout ? "text-xs uppercase tracking-wider" : "text-xs md:text-sm"}`}>
              {publicPageLayout ? "Ore disponibile" : "3. Alege ora"}
            </div>
            {loadingSlots ? (
              <div className={slotGridClass}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className={`h-11 w-full bg-zinc-800 ${publicPageLayout ? "rounded-full" : "rounded-lg"}`} />
                ))}
              </div>
            ) : (
              <div className={slotGridClass}>
                {slotPicks.length === 0 ? (
                  <div className="col-span-full text-sm text-zinc-500">Nu sunt sloturi libere în această zi.</div>
                ) : (
                  slotPicks.map((pick) => {
                    const label = formatSlotLabel(pick.start);
                    const isSel = Boolean(
                      selectedPick &&
                        pick.start.getTime() === selectedPick.start.getTime() &&
                        (pick.staffId ?? "") === (selectedPick.staffId ?? "")
                    );
                    return (
                      <button
                        key={`${pick.start.toISOString()}_${pick.staffId ?? "x"}`}
                        type="button"
                        onClick={() => {
                          setSelectedPick(pick);
                          trackBookingEvent("booking_slot_selected", {
                            mode: tenant ? "tenant" : "public",
                            slug,
                            slot: pick.start.toISOString()
                          });
                          if (tenant) {
                            setSuccessSummary(null);
                            setNume("");
                            setTelefon("");
                            setEmail("");
                            setStep(3);
                            setModalOpen(true);
                          }
                        }}
                        className={slotBtnClass(isSel)}
                      >
                        {label}
                      </button>
                    );
                  })
                )}
              </div>
            )}
            {!publicPageLayout ? <p className="mt-2 text-xs text-zinc-500 md:text-sm">Gri = ocupat</p> : null}
          </div>

          <div className={publicPageLayout ? "border-t border-zinc-800/80 pt-8" : "border-t border-zinc-800 pt-4"}>
            <div className={`mb-3 font-medium text-zinc-500 ${publicPageLayout ? "text-xs uppercase tracking-wider" : "text-xs md:text-sm"}`}>
              {publicPageLayout ? "Rezumat" : "4. Confirmare"}
            </div>
            <div className={`font-semibold text-white ${publicPageLayout ? "text-lg" : "text-sm md:text-base"}`}>
              {selectedService ? serviceTitle(selectedService) : "—"}
            </div>
            <div className={`mt-2 text-zinc-400 ${publicPageLayout ? "text-base" : "text-sm md:text-base"}`}>
              {selectedDay && selectedPick && selectedService
                ? `${format(selectedDay, "EEEE, d MMMM", { locale: ro })} · ${formatSlotLabel(selectedPick.start)} – ${formatSlotLabel(
                    new Date(selectedPick.start.getTime() + serviceDurationMin(selectedService) * 60_000)
                  )}`
                : "Alege ziua și ora."}
            </div>
            <button
              type="button"
              disabled={!selectedService || !selectedDay || !selectedPick}
              onClick={() => {
                if (tenant) {
                  if (!selectedPick) return;
                  setSuccessSummary(null);
                  setStep(3);
                  setModalOpen(true);
                } else {
                  setStep(1);
                  setModalOpen(true);
                }
              }}
              className={`mt-6 w-full font-bold text-white transition hover:opacity-95 disabled:opacity-40 ${
                publicPageLayout
                  ? "rounded-full bg-indigo-600 py-4 text-base shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
                  : "rounded-lg bg-[#1d4ed8] py-3 text-sm hover:bg-[#1e40af] md:text-base"
              }`}
            >
              {tenant ? "Continuă la rezervare" : "Confirmă programarea"}
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setStep(1);
          }
        }}
      >
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Programează-te</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {tenant ? businessName : `${businessName} — pas ${step} din 3`}
            </DialogDescription>
          </DialogHeader>
          {tenant ? (
            <div className="space-y-4">
              {selectedService && selectedPick && selectedDay ? (
                <p className="text-sm text-zinc-300">
                  {serviceTitle(selectedService)} — {format(selectedDay, "EEEE, d MMMM yyyy", { locale: ro })} —{" "}
                  {formatSlotLabel(selectedPick.start)}
                </p>
              ) : null}
              <div>
                <Label htmlFor="nume">Nume</Label>
                <Input id="nume" value={nume} onChange={(e) => setNume(e.target.value)} className="mt-1 border-zinc-700 bg-zinc-900 text-white" />
              </div>
              <div>
                <Label htmlFor="tel">Telefon</Label>
                <Input
                  id="tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="07xx xxx xxx"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nume@exemplu.ro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                />
                <p className="mt-1 text-xs text-zinc-500">Fără cont. Emailul e folosit doar pentru confirmare sau anulare.</p>
              </div>
              <DialogFooter>
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                  Anulează
                </Button>
                <Button className="bg-[#1d4ed8] hover:bg-[#1e40af]" disabled={submitting} type="button" onClick={() => void submitBooking()}>
                  {submitting ? "Se trimite…" : "Trimite"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300">Serviciu: {selectedService ? serviceTitle(selectedService) : "—"}</p>
                  <Button className="w-full bg-[#1d4ed8] hover:bg-[#1e40af]" onClick={() => setStep(2)}>
                    Continuă
                  </Button>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300">
                    {selectedDay ? format(selectedDay, "EEEE, d MMMM yyyy", { locale: ro }) : ""} —{" "}
                    {selectedPick ? formatSlotLabel(selectedPick.start) : ""}
                  </p>
                  <Button className="w-full bg-[#1d4ed8] hover:bg-[#1e40af]" onClick={() => setStep(3)}>
                    Continuă
                  </Button>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nume">Nume</Label>
                    <Input id="nume" value={nume} onChange={(e) => setNume(e.target.value)} className="mt-1 border-zinc-700 bg-zinc-900 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="tel">Telefon</Label>
                    <Input
                      id="tel"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="07xx xxx xxx"
                      value={telefon}
                      onChange={(e) => setTelefon(e.target.value)}
                      className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="nume@exemplu.ro"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                    />
                    <p className="mt-1 text-xs text-zinc-500">Fără cont. Emailul e folosit doar pentru confirmare sau anulare.</p>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" type="button" onClick={() => setStep(2)}>
                      Înapoi
                    </Button>
                    <Button className="bg-[#1d4ed8] hover:bg-[#1e40af]" disabled={submitting} type="button" onClick={() => void submitBooking()}>
                      Trimite
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
