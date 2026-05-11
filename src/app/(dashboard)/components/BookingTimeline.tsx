"use client";

import React from "react";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Europe/Bucharest";

export type BookingEvent = {
  id: string;
  status: string;
  source: string;
  created_at: string;
};

type BookingTimelineProps = {
  events: BookingEvent[];
  bookingDate: string;
};

const sourceLabels: Record<string, string> = {
  client_link: "Client via link",
  salon_dashboard: "Salon - Dashboard",
  salon_reschedule: "Salon - Reprogramare",
  salon_manual: "Salon - Manual",
  client_reschedule: "Client - Reprogramare",
  system: "Sistem"
};

const statusLabels: Record<string, string> = {
  in_asteptare: "În așteptare",
  confirmat: "Confirmat",
  finalizat: "Finalizat",
  anulat: "Anulat",
  noaparit: "Nu a apărut",
  reprogramata: "Reprogramat"
};

const statusColors: Record<string, string> = {
  in_asteptare: "bg-amber-50 text-amber-900 border-amber-200",
  confirmat: "bg-emerald-50 text-emerald-900 border-emerald-200",
  finalizat: "bg-slate-100 text-slate-900 border-slate-300",
  anulat: "bg-red-50 text-red-900 border-red-200",
  noaparit: "bg-orange-50 text-orange-900 border-orange-200",
  reprogramata: "bg-blue-50 text-blue-900 border-blue-200"
};

export function BookingTimeline({ events, bookingDate }: BookingTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-sm text-slate-500">
        Niciun eveniment înregistrat.
      </div>
    );
  }

  // Sort by created_at DESC
  const sorted = [...events].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((event, idx) => {
        const timeStr = formatInTimeZone(new Date(event.created_at), TZ, "HH:mm:ss");
        const dateStr = formatInTimeZone(new Date(event.created_at), TZ, "dd.MM.yyyy");
        const isSameDay = dateStr === bookingDate;

        const statusLabel = statusLabels[event.status] ?? event.status;
        const sourceLabel = sourceLabels[event.source] ?? event.source;
        const colorClass = statusColors[event.status] ?? "bg-slate-50 text-slate-900 border-slate-200";

        return (
          <div key={event.id || idx} className="flex items-start gap-3">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-teal-600" />
              {idx < sorted.length - 1 && (
                <div className="w-0.5 h-6 bg-slate-200 mt-1" />
              )}
            </div>

            {/* Event content */}
            <div className="pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
                  {statusLabel}
                </span>
                <span className="text-xs text-slate-500">{sourceLabel}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isSameDay ? timeStr : `${dateStr} ${timeStr}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
