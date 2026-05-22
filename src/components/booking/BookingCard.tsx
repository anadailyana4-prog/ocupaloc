"use client";

import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, isBefore, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { ro } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { createPublicBooking } from "@/actions/public-booking";
import { assignExperimentVariant, trackBookingEvent } from "@/lib/analytics";
import { formatSlotLabel } from "@/lib/slots";
import type { ServiciuRow } from "@/types/db";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type DemoProps = { variant: "demo" };

type LegacyService = Pick<ServiciuRow, "id" | "nume" | "durata_minute" | "pret"> & { is_featured?: boolean };
export type TenantService = { id: string; name: string; duration_min: number; price: number; is_featured?: boolean };

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
 <div className="oc-bg border oc-border rounded-2xl p-4 md:p-5">
 <div className="flex items-center justify-between mb-4">
 <div className="text-xs md:text-sm oc-secondary-text">ocupaloc.ro/demo-interactiv</div>
 <div className="flex items-center gap-1 text-xs md:text-sm oc-accent">
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
 <div className="text-xs md:text-sm font-medium oc-secondary-text mb-2">1. Serviciu</div>
 <div className="rounded-lg border oc-border oc-badge-bg px-3 py-2.5">
 <div className="text-sm md:text-base font-semibold oc-text">Serviciu principal</div>
 <div className="text-sm md:text-base oc-secondary-text mt-0.5">45 min • 80 lei</div>
 </div>
 </div>
 <div>
 <div className="text-xs md:text-sm font-medium oc-secondary-text mb-2">2. Data</div>
 <div className="text-sm md:text-base oc-secondary-text mb-2">Aprilie 2025</div>
 <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-xs md:text-sm">
 <div className="oc-secondary-text py-2">L</div>
 <div className="oc-secondary-text py-2">M</div>
 <div className="oc-secondary-text py-2">M</div>
 <div className="oc-secondary-text py-2">J</div>
 <div className="oc-secondary-text py-2">V</div>
 <div className="oc-secondary-text py-2">S</div>
 <div className="oc-secondary-text py-2">D</div>
 <div className="aspect-square flex items-center justify-center oc-text">7</div>
 <div className="aspect-square flex items-center justify-center oc-text">8</div>
 <div className="aspect-square flex items-center justify-center oc-text">9</div>
 <div className="aspect-square flex items-center justify-center oc-text">10</div>
 <div className="aspect-square flex items-center justify-center oc-text">11</div>
 <div className="aspect-square flex items-center justify-center oc-text">12</div>
 <div className="aspect-square flex items-center justify-center oc-text">13</div>
 <div className="aspect-square rounded oc-border bg-white oc-text flex items-center justify-center">14</div>
 <div className="aspect-square rounded oc-primary oc-text font-semibold flex items-center justify-center">15</div>
 <div className="aspect-square rounded oc-border bg-white oc-text flex items-center justify-center">16</div>
 <div className="aspect-square rounded oc-border bg-white oc-text flex items-center justify-center">17</div>
 <div className="aspect-square flex items-center justify-center oc-text">18</div>
 <div className="aspect-square flex items-center justify-center oc-text">19</div>
 <div className="aspect-square flex items-center justify-center oc-text">20</div>
 </div>
 </div>
 <div>
 <div className="text-xs md:text-sm font-medium oc-secondary-text mb-2">3. Ora</div>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
 <div className="py-2.5 text-sm md:text-base rounded-lg border oc-border bg-white text-center font-medium oc-text">10:00</div>
 <div className="py-2.5 text-sm md:text-base rounded-lg border oc-border bg-white text-center font-medium oc-text">11:00</div>
 <div className="py-2.5 text-sm md:text-base rounded-lg oc-primary text-center font-bold oc-text">14:00</div>
 <div className="py-2.5 text-sm md:text-base rounded-lg border oc-border bg-white text-center font-medium oc-secondary-text">15:00</div>
 <div className="py-2.5 text-sm md:text-base rounded-lg border oc-border bg-white text-center font-medium oc-secondary-text">16:00</div>
 <div className="py-2.5 text-sm md:text-base rounded-lg border oc-border bg-white text-center font-medium oc-text">17:00</div>
 </div>
 <p className="mt-2 text-xs md:text-sm oc-secondary-text">Alb = ocupat</p>
 </div>
 <div className="pt-4 border-t oc-border">
 <div className="text-xs md:text-sm font-medium oc-secondary-text mb-3">4. Confirmare</div>
 <div className="text-sm md:text-base font-semibold oc-text">Serviciu principal</div>
 <div className="mt-1 text-sm md:text-base oc-secondary-text">Marți, 15 aprilie • 14:00 - 14:45</div>
 <div className="bg-oc-amber-soft border-2 border-oc-amber/40 rounded-lg p-4 mb-4 mt-4">
 <p className="font-bold text-center text-oc-warning">⚠️ Acesta este un DEMO</p>
 <p className="text-sm text-center text-oc-amber">Rezervarea nu este reală. Creează-ți propriul business mai jos.</p>
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

function normalizeSearch(value: string): string {
 return value
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "")
 .toLowerCase()
 .trim();
}

function isFeaturedService(service: LegacyService | TenantService): boolean {
 return service.is_featured === true;
}

function normalizePhone(value: string): string {
 return value.replace(/\s+/g, " ").trim();
}

function isValidRoPhone(value: string): boolean {
 const digits = value.replace(/\D/g, "");
 return digits.length >= 10;
}

type SlotPick = { start: Date; staffId?: string };

function toCalendarUtc(date: Date): string {
 return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escIcs(value: string): string {
 return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function buildGoogleCalendarUrl({ title, details, start, end }: { title: string; details: string; start: Date; end: Date }): string {
 const params = new URLSearchParams({
 action: "TEMPLATE",
 text: title,
 details,
 dates: `${toCalendarUtc(start)}/${toCalendarUtc(end)}`
 });
 return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsHref({ title, description, start, end }: { title: string; description: string; start: Date; end: Date }): string {
 const uid = `${start.getTime()}@ocupaloc.ro`;
 const lines = [
 "BEGIN:VCALENDAR",
 "VERSION:2.0",
 "PRODID:-//OcupaLoc//Booking//RO",
 "CALSCALE:GREGORIAN",
 "BEGIN:VEVENT",
 `UID:${uid}`,
 `DTSTAMP:${toCalendarUtc(new Date())}`,
 `DTSTART:${toCalendarUtc(start)}`,
 `DTEND:${toCalendarUtc(end)}`,
 `SUMMARY:${escIcs(title)}`,
 `DESCRIPTION:${escIcs(description)}`,
 "END:VEVENT",
 "END:VCALENDAR"
 ].join("\r\n");
 return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines)}`;
}

function BookingCardLive(props: LiveProps) {
 const { slug, publicBase, businessName, services, publicPageLayout = false } = props;
 const tenant = isTenantLive(props);
 const featuredServices = useMemo(() => services.filter((service) => isFeaturedService(service)).slice(0, 6), [services]);
 const defaultServices = useMemo(() => services.slice(0, 6), [services]);
 const hasFeaturedServices = featuredServices.length > 0;
 const highlightedServices = hasFeaturedServices ? featuredServices : defaultServices;
 const [showAllServices, setShowAllServices] = useState(false);
 const [serviceSearch, setServiceSearch] = useState("");
 const normalizedServiceSearch = useMemo(() => normalizeSearch(serviceSearch), [serviceSearch]);
 const hasServiceSearch = normalizedServiceSearch.length > 0;

 const initialServiceId = useMemo(() => {
 if (featuredServices[0]?.id) return featuredServices[0].id;
 return services[0]?.id ?? null;
 }, [featuredServices, services]);

 const [experimentVariant, setExperimentVariant] = useState<"A" | "B" | null>(null);
 const experimentId = "pricing_packaging_v1";
 const [month, setMonth] = useState(() => startOfMonth(new Date()));
 const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialServiceId);
 const [selectedDay, setSelectedDay] = useState<Date | null>(() => (publicPageLayout ? startOfDay(new Date()) : null));
 const [slotPicks, setSlotPicks] = useState<SlotPick[]>([]);
 const [loadingSlots, setLoadingSlots] = useState(false);
 const [selectedPick, setSelectedPick] = useState<SlotPick | null>(null);
 const [modalOpen, setModalOpen] = useState(false);
 const [step, setStep] = useState(1);
 const [nume, setNume] = useState("");
 const [telefon, setTelefon] = useState("");
 const [email, setEmail] = useState("");
 const [clientNotes, setClientNotes] = useState("");
 const [submitting, setSubmitting] = useState(false);
 const [successSummary, setSuccessSummary] = useState<{
 clientName: string;
 timeLabel: string;
 serviceName: string;
 startIso: string;
 endIso: string;
 emailNotification: "queued" | "failed";
 } | null>(null);

 const horizonDays = useMemo(() => {
 const start = startOfDay(new Date());
 return eachDayOfInterval({ start, end: addDays(start, 13) });
 }, []);

 const selectedService = useMemo(() => services.find((s) => s.id === selectedServiceId) ?? null, [services, selectedServiceId]);

 useEffect(() => {
 if (!selectedServiceId && initialServiceId) {
 setSelectedServiceId(initialServiceId);
 return;
 }
 if (selectedServiceId && !services.some((service) => service.id === selectedServiceId)) {
 setSelectedServiceId(initialServiceId);
 }
 }, [initialServiceId, selectedServiceId, services]);

 useEffect(() => {
 void assignExperimentVariant(experimentId).then((variant) => {
 if (variant) setExperimentVariant(variant);
 });
 }, []);

 useEffect(() => {
 trackBookingEvent("booking_public_page_view", {
 mode: tenant ? "tenant" : "public",
 slug,
 page: `/${slug}`,
 experiment_id: experimentId,
 variant: experimentVariant
 });
 }, [slug, tenant, experimentVariant]);

 useEffect(() => {
 setSuccessSummary(null);
 }, [selectedServiceId]);

 const serviceTitle = useCallback((s: LegacyService | TenantService) => (tenant ? (s as TenantService).name : (s as LegacyService).nume), [tenant]);
 const serviceDurationMin = (s: LegacyService | TenantService | null) => {
 if (!s) return 0;
 return tenant ? (s as TenantService).duration_min : (s as LegacyService).durata_minute;
 };
 const servicePrice = (s: LegacyService | TenantService) => (tenant ? (s as TenantService).price : (s as LegacyService).pret);

 const flowStep = useMemo(() => {
 if (successSummary) return 4;
 if (selectedPick) return 3;
 if (selectedDay) return 2;
 if (selectedServiceId) return 1;
 return 1;
 }, [selectedDay, selectedPick, selectedServiceId, successSummary]);

 const bookingSummary = successSummary
 ? `Rezervare confirmată pentru ${successSummary.serviceName} la ${successSummary.timeLabel}.`
 : selectedService && selectedDay && selectedPick
 ? `${serviceTitle(selectedService)} · ${format(selectedDay, "EEEE, d MMMM", { locale: ro })} · ${formatSlotLabel(selectedPick.start)}`
 : selectedService
 ? `${serviceTitle(selectedService)} ales. Urmează data și ora.`
 : "Alege serviciul, apoi data și ora ca să vezi rezumatul complet.";

 const bookingNotice = "";

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

 const displayUrl = `${publicBase.replace(/\/$/, "")}/${slug}`;

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
 const cleanNotes = clientNotes.trim();
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
 service_id: selectedService.id,
 experiment_id: experimentId,
 variant: experimentVariant
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
 clientEmail: cleanEmail,
 clientNotes: cleanNotes || null
 })
 });
 const j = (await res.json()) as { success?: boolean; error?: string | Record<string, unknown> };
 if (!res.ok || !j.success) {
 const errMsg = typeof j.error === "string" ? j.error : "Nu s-a putut rezerva.";
 trackBookingEvent("booking_submit_failed", {
 mode: "tenant",
 slug,
 service_id: selectedService.id,
 reason: errMsg,
 experiment_id: experimentId,
 variant: experimentVariant
 });
 toast.error(errMsg);
 return;
 }
 trackBookingEvent("booking_submit_success", {
 mode: "tenant",
 slug,
 service_id: selectedService.id,
 experiment_id: experimentId,
 variant: experimentVariant
 });
 setSuccessSummary({
 clientName: cleanName,
 timeLabel: formatSlotLabel(selectedPick.start),
 serviceName: serviceTitle(selectedService),
 startIso: selectedPick.start.toISOString(),
 endIso: new Date(selectedPick.start.getTime() + serviceDurationMin(selectedService) * 60_000).toISOString(),
 emailNotification: "queued"
 });
 setModalOpen(false);
 setNume("");
 setTelefon("");
 setEmail("");
 setClientNotes("");
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
 const cleanNotes = clientNotes.trim();
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
 service_id: selectedService.id,
 experiment_id: experimentId,
 variant: experimentVariant
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
 emailClient: cleanEmail,
 observatiiClient: cleanNotes || null
 });
 if (!res.ok) {
 const reason = "message" in res && typeof res.message === "string" ? res.message : "validation_failed";
 trackBookingEvent("booking_submit_failed", {
 mode: "public",
 slug,
 service_id: selectedService.id,
 reason,
 experiment_id: experimentId,
 variant: experimentVariant
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
 service_id: selectedService.id,
 experiment_id: experimentId,
 variant: experimentVariant
 });
 const emailNotification: "queued" | "failed" = res.clientNotification === "queued" ? "queued" : "failed";
 setSuccessSummary({
 clientName: cleanName,
 timeLabel: formatSlotLabel(selectedPick.start),
 serviceName: serviceTitle(selectedService),
 startIso: selectedPick.start.toISOString(),
 endIso: new Date(selectedPick.start.getTime() + serviceDurationMin(selectedService) * 60_000).toISOString(),
 emailNotification
 });
 setModalOpen(false);
 setStep(3);
 setNume("");
 setTelefon("");
 setEmail("");
 setClientNotes("");
 setSelectedPick(null);
 void loadSlots();
 } finally {
 setSubmitting(false);
 }
 }

 const cardShell = publicPageLayout
 ? "rounded-3xl border oc-border bg-white p-8 md:p-10 shadow-xl shadow-[0_12px_30px_-24px_rgba(15,118,110,0.35)] "
 : "rounded-2xl border oc-border bg-white p-4 md:p-5";

 const sectionGap = publicPageLayout ? "space-y-10" : "space-y-5";

 const slotGridClass = publicPageLayout ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 md:grid-cols-3 gap-2";

 const slotBtnClass = (isSel: boolean) =>
 publicPageLayout
 ? `rounded-full py-3.5 text-sm font-semibold transition ${
 isSel ? "oc-primary shadow-lg shadow-[0_12px_28px_-18px_rgba(245,158,11,0.45)]" : "oc-badge-bg oc-text hover:oc-badge-bg"
 }`
 : `py-2.5 text-sm md:text-base rounded-lg text-center font-medium ${
 isSel ? "oc-primary text-white font-bold" : "oc-badge-bg oc-secondary-text hover:oc-badge-bg"
 }`;

 const servicesToRender = useMemo(() => {
 const baseServices = showAllServices || hasServiceSearch ? services : highlightedServices;
 if (!hasServiceSearch) return baseServices;

 return baseServices.filter((service) => normalizeSearch(serviceTitle(service)).includes(normalizedServiceSearch));
 }, [showAllServices, hasServiceSearch, services, highlightedServices, normalizedServiceSearch, serviceTitle]);

 return (
 <div className={cardShell}>
 {successSummary ? (
 <div className={`space-y-6 rounded-2xl border border-emerald-500/35 bg-emerald-950/40 text-center shadow-lg shadow-emerald-950/30 ${publicPageLayout ? "px-6 py-12 md:px-10 md:py-14" : "px-5 py-8"}`}>
 <p className="text-4xl leading-none text-emerald-400" aria-hidden>
 ✓
 </p>
 <p className={`font-semibold leading-relaxed text-white ${publicPageLayout ? "text-xl md:text-2xl" : "text-lg"}`}>
 Programare confirmată pentru {successSummary.clientName} la {successSummary.timeLabel}
 </p>
 <p className="text-sm oc-secondary-text">
 {successSummary.emailNotification === "queued"
 ? "Emailul de confirmare a fost trimis. Din linkul primit poți confirma, anula sau reprograma programarea."
 : "Programarea a fost făcută, dar emailul nu a putut fi trimis acum. În mod normal, confirmarea include linkuri pentru anulare și reprogramare."}
 </p>
 <div className="flex flex-wrap justify-center gap-2">
 <a
 href={buildGoogleCalendarUrl({
 title: `${successSummary.serviceName} - ${businessName}`,
 details: `Programare confirmata la ${businessName}.`,
 start: new Date(successSummary.startIso),
 end: new Date(successSummary.endIso)
 })}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center rounded-full border oc-border bg-white px-4 py-2 text-xs font-medium oc-text hover:oc-badge-bg"
 >
 Adaugă în Google Calendar
 </a>
 <a
 href={buildIcsHref({
 title: `${successSummary.serviceName} - ${businessName}`,
 description: `Programare confirmata la ${businessName}.`,
 start: new Date(successSummary.startIso),
 end: new Date(successSummary.endIso)
 })}
 download="programare-ocupaloc.ics"
 className="inline-flex items-center rounded-full border oc-border bg-white px-4 py-2 text-xs font-medium oc-text hover:oc-badge-bg"
 >
 Descarcă .ics
 </a>
 </div>
 <Button
 type="button"
 variant="secondary"
 className="rounded-full px-6 py-4 text-base"
 onClick={() => {
 setSuccessSummary(null);
 setSelectedPick(null);
 setStep(1);
 setNume("");
 setTelefon("");
 setEmail("");
 setClientNotes("");
 }}
 >
 Altă programare
 </Button>
 </div>
 ) : (
 <div className={sectionGap}>
 <div className="rounded-xl border oc-border bg-white p-3">
 <div className="mb-2 text-xs font-medium uppercase tracking-wider oc-secondary-text">Pași rezervare</div>
 <div className="grid grid-cols-4 gap-2">
 {[
 { label: "Serviciu", index: 1 },
 { label: "Data", index: 2 },
 { label: "Ora", index: 3 },
 { label: "Confirmat", index: 4 }
 ].map((item) => (
 <div
 key={item.label}
 className={`rounded-md px-2 py-1.5 text-center text-[11px] font-semibold ${
 flowStep >= item.index ? "bg-emerald-700/40 text-emerald-200" : "oc-badge-bg oc-secondary-text"
 }`}
 >
 {item.label}
 </div>
 ))}
 </div>
 </div>

 <div className="rounded-xl border oc-border bg-white p-4">
 <div className="text-xs font-medium uppercase tracking-wider oc-secondary-text">Rezumat</div>
 <p className="mt-2 text-sm oc-text">{bookingSummary}</p>
 <p className="mt-2 text-xs oc-secondary-text">Sloturile active sunt libere; cele inactive nu pot fi rezervate.</p>
 </div>

 <div>
 <div className={`mb-3 font-medium oc-secondary-text ${publicPageLayout ? "text-xs uppercase tracking-wider" : "text-xs md:text-sm"}`}>
 {publicPageLayout ? "Servicii" : "1. Serviciu ales"}
 </div>
 {hasFeaturedServices && !showAllServices ? (
 <div className="mb-3 space-y-1">
 <p className="text-xs oc-text">Servicii populare</p>
 <p className="text-xs oc-secondary-text">Setate de profesionist la crearea contului ca să evidențieze serviciile cele mai cerute.</p>
 </div>
 ) : null}
 {services.length > 1 ? (
 <div className="mb-3">
 <Input
 type="search"
 value={serviceSearch}
 onChange={(event) => setServiceSearch(event.target.value)}
 placeholder="Caută serviciu…"
 className="oc-border bg-white"
 />
 </div>
 ) : null}
 <div className={publicPageLayout ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "space-y-2"}>
 {servicesToRender.map((s) => (
 <button
 key={s.id}
 type="button"
 data-testid="service-option"
 onClick={() => {
 setSelectedServiceId(s.id);
 setServiceSearch("");
 trackBookingEvent("booking_service_selected", {
 mode: tenant ? "tenant" : "public",
 slug,
 service_id: s.id,
 experiment_id: experimentId,
 variant: experimentVariant
 });
 }}
 className={`w-full border text-left transition-colors ${
 publicPageLayout
 ? `rounded-2xl px-5 py-5 ${
 selectedServiceId === s.id
 ? "oc-border oc-primary ring-2 ring-oc-teal/25"
 : "oc-border oc-badge-bg hover:oc-border hover:oc-badge-bg"
 }`
 : `rounded-lg px-3 py-2.5 ${selectedServiceId === s.id ? "oc-border oc-badge-bg ring-1 ring-oc-teal/25" : "oc-border oc-badge-bg hover:oc-badge-bg"}`
 }`}
 >
 <div className={`font-semibold oc-text ${publicPageLayout ? "text-base md:text-lg" : "text-sm md:text-base"}`}>
 {serviceTitle(s)}
 </div>
 <div className={`mt-1 oc-secondary-text ${publicPageLayout ? "text-sm" : "text-sm md:text-base"}`}>
 {serviceDurationMin(s)} min · {servicePrice(s)} RON
 </div>
 </button>
 ))}
 </div>
 {!showAllServices && services.length > highlightedServices.length ? (
 <button
 type="button"
 className="mt-3 text-sm font-medium oc-accent hover:oc-accent"
 onClick={() => {
 setShowAllServices(true);
 setServiceSearch("");
 }}
 >
 Vezi toate serviciile ({services.length})
 </button>
 ) : null}
 </div>

 <div>
 {publicPageLayout ? (
 <>
 <div className="mb-4 text-xs font-medium uppercase tracking-wider oc-secondary-text">Alege ziua</div>
 <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
 {horizonDays.map((day) => {
 const isSel = selectedDay && isSameDay(day, selectedDay);
 return (
 <button
 key={day.toISOString()}
 type="button"
 data-testid="day-option"
 onClick={() => {
 setSelectedDay(day);
 setSuccessSummary(null);
 trackBookingEvent("booking_day_selected", {
 mode: tenant ? "tenant" : "public",
 slug,
 date: format(day, "yyyy-MM-dd"),
 experiment_id: experimentId,
 variant: experimentVariant
 });
 }}
 className={`flex min-w-[4.75rem] shrink-0 flex-col items-center rounded-full border-2 px-4 py-3 transition ${
 isSel
 ? "oc-border oc-primary shadow-md shadow-[0_12px_28px_-18px_rgba(245,158,11,0.45)]"
 : "oc-border oc-badge-bg oc-text hover:oc-border"
 }`}
 >
 <span className={`text-[11px] font-medium capitalize ${isSel ? "oc-accent" : "oc-secondary-text"}`}>
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
 <div className="text-xs font-medium oc-secondary-text md:text-sm">2. Alege data</div>
 <div className="flex gap-2">
 <button
 type="button"
 className="text-xs oc-secondary-text hover:oc-text disabled:cursor-not-allowed disabled:opacity-30"
 disabled={month <= startOfMonth(new Date())}
 onClick={() => setMonth((m) => addMonths(m, -1))}
 >
 ←
 </button>
 <button type="button" className="text-xs oc-secondary-text hover:oc-text" onClick={() => setMonth((m) => addMonths(m, 1))}>
 →
 </button>
 </div>
 </div>
 <div className="mb-2 text-sm capitalize oc-secondary-text md:text-base">
 {format(month, "LLLL yyyy", { locale: ro })}
 </div>
 <div className="grid grid-cols-7 gap-1 text-center text-xs md:gap-2 md:text-sm">
 {["L", "Ma", "Mi", "J", "V", "S", "D"].map((d) => (
 <div key={d} className="py-2 oc-secondary-text">
 {d}
 </div>
 ))}
 {padBefore.map((_, i) => (
 <div key={`pad-${i}`} className="aspect-square" />
 ))}
 {monthDays.map((day) => {
 const isSel = selectedDay && isSameDay(day, selectedDay);
 const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
 return (
 <button
 key={day.toISOString()}
 type="button"
 data-testid="day-option"
 disabled={isPast}
 onClick={() => {
 if (isPast) return;
 setSelectedDay(day);
 trackBookingEvent("booking_day_selected", {
 mode: tenant ? "tenant" : "public",
 slug,
 date: format(day, "yyyy-MM-dd"),
 experiment_id: experimentId,
 variant: experimentVariant
 });
 }}
 className={`flex aspect-square items-center justify-center rounded ${
 isPast
 ? "cursor-not-allowed oc-secondary-text"
 : isSel
 ? "oc-primary font-semibold text-white"
 : "oc-badge-bg oc-text hover:oc-badge-bg"
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
 <div className={`mb-3 font-medium oc-secondary-text ${publicPageLayout ? "text-xs uppercase tracking-wider" : "text-xs md:text-sm"}`}>
 {publicPageLayout ? "Ore disponibile" : "3. Alege ora"}
 </div>
 <p className="mb-2 text-xs oc-secondary-text">Sloturile ocupate sunt ascunse sau dezactivate, ca să poți alege rapid doar orele libere.</p>
 {loadingSlots ? (
 <div className={slotGridClass}>
 {Array.from({ length: 6 }).map((_, i) => (
 <Skeleton key={i} className={`h-11 w-full oc-badge-bg ${publicPageLayout ? "rounded-full" : "rounded-lg"}`} />
 ))}
 </div>
 ) : (
 <div className={slotGridClass}>
 {slotPicks.length === 0 ? (
 <div className="col-span-full text-sm oc-secondary-text">Nu sunt sloturi libere în această zi.</div>
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
 data-testid="slot-option"
 onClick={() => {
 setSelectedPick(pick);
 trackBookingEvent("booking_slot_selected", {
 mode: tenant ? "tenant" : "public",
 slug,
 slot: pick.start.toISOString(),
 experiment_id: experimentId,
 variant: experimentVariant
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

 </div>

 <div className={publicPageLayout ? "border-t oc-border pt-8" : "border-t oc-border pt-4"}>
 <div className={`mb-3 font-medium oc-secondary-text ${publicPageLayout ? "text-xs uppercase tracking-wider" : "text-xs md:text-sm"}`}>
 {publicPageLayout ? "Rezumat" : "4. Confirmare"}
 </div>
 <div className={`font-semibold oc-text ${publicPageLayout ? "text-lg" : "text-sm md:text-base"}`}>
 {selectedService ? serviceTitle(selectedService) : "—"}
 </div>
 <div className={`mt-2 oc-secondary-text ${publicPageLayout ? "text-base" : "text-sm md:text-base"}`}>
 {selectedDay && selectedPick && selectedService
 ? `${format(selectedDay, "EEEE, d MMMM", { locale: ro })} · ${formatSlotLabel(selectedPick.start)} – ${formatSlotLabel(
 new Date(selectedPick.start.getTime() + serviceDurationMin(selectedService) * 60_000)
 )}`
 : "Alege ziua și ora."}
 </div>
 <button
 type="button"
 data-testid="booking-continue"
 disabled={!selectedService || !selectedDay || !selectedPick}
 onClick={() => {
 if (tenant) {
 if (!selectedPick) return;
 setSuccessSummary(null);
 setStep(3);
 setModalOpen(true);
 } else {
 setStep(3);
 setModalOpen(true);
 }
 }}
 className={`mt-6 w-full font-bold text-white transition hover:opacity-95 disabled:opacity-40 ${
 publicPageLayout
 ? "rounded-full oc-primary py-4 text-base shadow-lg shadow-[0_12px_28px_-18px_rgba(245,158,11,0.45)] hover:oc-primary"
 : "rounded-lg oc-primary py-3 text-sm hover:bg-[#D97706] md:text-base"
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
 if (open) {
 trackBookingEvent("booking_form_started", {
 mode: tenant ? "tenant" : "public",
 slug,
 service_id: selectedServiceId ?? null,
 experiment_id: experimentId,
 variant: experimentVariant
 });
 }
 if (!open) {
 setStep(3);
 }
 }}
 >
 <DialogContent className="oc-border bg-white oc-text sm:max-w-md">
 <DialogHeader>
 <DialogTitle>Programează-te</DialogTitle>
 <DialogDescription className="oc-secondary-text">
 {businessName}
 </DialogDescription>
 </DialogHeader>
 {tenant ? (
 <div className="space-y-4">
 {selectedService && selectedPick && selectedDay ? (
 <p className="text-sm oc-text">
 {serviceTitle(selectedService)} — {format(selectedDay, "EEEE, d MMMM yyyy", { locale: ro })} —{" "}
 {formatSlotLabel(selectedPick.start)}
 </p>
 ) : null}
 <div>
 <Label htmlFor="nume">Nume</Label>
 <Input
 id="nume"
 data-testid="booking-name-input"
 value={nume}
 onChange={(e) => setNume(e.target.value)}
 className="mt-1 oc-border bg-white oc-text"
 />
 </div>
 <div>
 <Label htmlFor="tel">Telefon</Label>
 <Input
 id="tel"
 data-testid="booking-phone-input"
 type="tel"
 inputMode="tel"
 autoComplete="tel"
 placeholder="07xx xxx xxx"
 value={telefon}
 onChange={(e) => setTelefon(e.target.value)}
 className="mt-1 oc-border bg-white oc-text"
 />
 </div>
 <div>
 <Label htmlFor="email">Email</Label>
 <Input
 id="email"
 data-testid="booking-email-input"
 type="email"
 inputMode="email"
 autoComplete="email"
 placeholder="nume@exemplu.ro"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="mt-1 oc-border bg-white oc-text"
 />
 <p className="mt-1 text-xs oc-secondary-text">Fără cont. Doar pentru confirmare.</p>
 </div>
 <div>
 <Label htmlFor="notes">Observații (opțional)</Label>
 <textarea
 id="notes"
 value={clientNotes}
 onChange={(e) => setClientNotes(e.target.value)}
 maxLength={200}
 placeholder="Ex: vin cu 5 minute întârziere"
 className="mt-1 min-h-16 w-full rounded-md border oc-border bg-white px-3 py-2 text-sm oc-text outline-none focus-visible:ring-2 focus-visible:ring-oc-teal/20"
 />
 </div>
 <DialogFooter className="gap-2 pt-2">
 <Button variant="outline" type="button" onClick={() => setModalOpen(false)} className="rounded-full">
 Închide
 </Button>
 <Button data-testid="booking-submit" className="rounded-full oc-primary hover:bg-[#D97706] px-6" disabled={submitting} type="button" onClick={() => void submitBooking()}>
 {submitting ? "Se trimite…" : "Trimite programarea"}
 </Button>
 </DialogFooter>
 </div>
 ) : (
 <>
 {(step === 1 || step === 2 || step === 3) && (
 <div className="space-y-4">
 {selectedService && selectedPick && selectedDay ? (
 <p className="rounded-lg border oc-border bg-white px-3 py-2 text-sm oc-text">
 {serviceTitle(selectedService)} · {format(selectedDay, "EEE, d MMM", { locale: ro })} · {formatSlotLabel(selectedPick.start)}
 </p>
 ) : null}
 <div>
 <Label htmlFor="nume">Nume</Label>
 <Input
 id="nume"
 data-testid="booking-name-input"
 placeholder="ex: Maria Ionescu"
 value={nume}
 onChange={(e) => setNume(e.target.value)}
 className="mt-1 oc-border bg-white oc-text"
 />
 </div>
 <div>
 <Label htmlFor="tel">Telefon</Label>
 <Input
 id="tel"
 data-testid="booking-phone-input"
 type="tel"
 inputMode="tel"
 autoComplete="tel"
 placeholder="07xx xxx xxx"
 value={telefon}
 onChange={(e) => setTelefon(e.target.value)}
 className="mt-1 oc-border bg-white oc-text"
 />
 </div>
 <div>
 <Label htmlFor="email">Email</Label>
 <Input
 id="email"
 data-testid="booking-email-input"
 type="email"
 inputMode="email"
 autoComplete="email"
 placeholder="nume@exemplu.ro"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="mt-1 oc-border bg-white oc-text"
 />
 <p className="mt-1 text-xs oc-secondary-text">Fără cont. Doar pentru confirmare.</p>
 </div>
 <div>
 <Label htmlFor="notes-public">Observații (opțional)</Label>
 <textarea
 id="notes-public"
 value={clientNotes}
 onChange={(e) => setClientNotes(e.target.value)}
 maxLength={200}
 placeholder="Ex: prefer să fiu sunat(ă) la sosire"
 className="mt-1 min-h-16 w-full rounded-md border oc-border bg-white px-3 py-2 text-sm oc-text outline-none focus-visible:ring-2 focus-visible:ring-oc-teal/20"
 />
 </div>
 <DialogFooter className="gap-2 pt-2">
 <Button variant="outline" type="button" onClick={() => setModalOpen(false)} className="rounded-full">
 Înapoi
 </Button>
 <Button data-testid="booking-submit" className="rounded-full oc-primary hover:bg-[#D97706] px-6" disabled={submitting} type="button" onClick={() => void submitBooking()}>
 {submitting ? "Se trimite…" : "Confirmă programarea"}
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
