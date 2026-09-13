"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, ShieldCheck, LifeBuoy, Phone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findBooking, MOCK_BOOKINGS } from "@/lib/bookings/mock-bookings";
import { useBookings } from "@/store/bookings-store";
import { tours } from "@/mocks/tours";
import { SafetyScoreCard } from "@/components/safety/safety-score-card";
import { IncidentReportForm } from "@/components/safety/incident-report-form";
import { SafetyTimeline } from "@/components/safety/safety-timeline";
import { TripTimeline } from "@/components/safety/trip-timeline";
import { EmergencyContactsManager } from "@/components/safety/emergency-contacts-manager";
import { ChecklistExport } from "@/components/safety/checklist-export";
import { WeatherAdvisory } from "@/components/safety/weather-advisory";
import { WeatherHistory } from "@/components/safety/weather-history";
import { useTripRoomFor } from "@/data/use-trip-room";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { useGo } from "@/lib/use-go";
import { flagOn } from "@/lib/feature-flags";
import type { SafetyIncident } from "@/types/safety";
import { toFa, toPersianDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Safety Center view — spec §4.
 * Standalone route at /safety.
 *
 * Shows:
 *  - quick booking picker (defaults to first confirmed booking)
 *  - Safety Score card for the picked tour
 *  - pre-trip checklist (link to Trip Room)
 *  - Incident report form
 *  - Safety timeline (local state)
 */
export function SafetyCenterView() {
  const userBookings = useBookings((s) => s.bookings);
  const all = [...userBookings, ...MOCK_BOOKINGS];
  const confirmed = all.filter((b) => b.status === "confirmed");
  const [activeId, setActiveId] = React.useState<string>(
    confirmed[0]?.id ?? all[0]?.id ?? "",
  );
  const booking = all.find((b) => b.id === activeId);
  const tour = booking ? (tours.find((t) => t.id === booking.tourId) ?? null) : null;

  if (!flagOn("safetyCenter")) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center p-6 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-muted text-muted-foreground">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold">مرکز ایمنی فعلاً غیرفعال است</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <ScrollReveal>
        <button
          onClick={() => window.history.back()}
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          بازگشت
        </button>

        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald/10 text-emerald">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-black">مرکز ایمنی سفر</h1>
            <p className="text-[12px] text-muted-foreground">
              ارزیابی شفاف ایمنی هر سفر + چک‌لیست + گزارش حادثه
            </p>
          </div>
        </div>

        {/* booking picker */}
        <div className="mb-4 flex flex-wrap gap-2">
          {confirmed.length === 0 && (
            <p className="text-xs text-muted-foreground">
              هیچ رزرو تأییدشده‌ای ندارید.
            </p>
          )}
          {confirmed.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveId(b.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                activeId === b.id
                  ? "bg-emerald text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {b.tourTitle.slice(0, 30)}
            </button>
          ))}
        </div>

        {booking && tour && (
          <SafetyCenterContent booking={booking} tour={tour} />
        )}
      </ScrollReveal>
    </div>
  );
}

function SafetyCenterContent({
  booking,
  tour,
}: {
  booking: ReturnType<typeof findBooking> extends infer T ? NonNullable<T> : never;
  tour: NonNullable<ReturnType<typeof tours.find>>;
}) {
  const go = useGo();
  const [incidents, setIncidents] = React.useState<SafetyIncident[]>([]);
  const room = useTripRoomFor(booking);

  return (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <SafetyScoreCard tour={tour} />
              <div className="rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold">چک‌لیست قبل از سفر</h3>
                  <div className="flex items-center gap-1.5">
                    {room && <ChecklistExport room={room} tripDate={booking.tourDate} />}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => go("trip-room", { bookingId: booking.id })}
                    >
                      <LifeBuoy className="h-3.5 w-3.5" />
                      اتاق سفر
                    </Button>
                  </div>
                </div>
                {room ? (
                  <ul className="space-y-1.5 text-[12px]">
                    {room.checklist.map((c) => (
                      <li
                        key={c.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-1.5 transition",
                          c.done
                            ? "bg-emerald/5 text-muted-foreground"
                            : "bg-background/40",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                            c.done
                              ? "bg-emerald/15 text-emerald"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {c.done ? "✓" : "!"}
                        </span>
                        <span className={cn(c.done && "line-through")}>
                          {c.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-1.5 text-[12px]">
                    <li className="flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald/10 text-[10px] text-emerald">✓</span>
                      لیست اعضا تأیید شد
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald/10 text-[10px] text-emerald">✓</span>
                      اطلاعات تماس اضطراری ثبت شد
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[10px] text-muted-foreground">!</span>
                      بررسی تجهیزات (ناقص)
                    </li>
                  </ul>
                )}
              </div>
              <EmergencyContactsManager />
              <WeatherAdvisory tour={tour} />
              <WeatherHistory tour={tour} />
              <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-bold text-red-600">
                    شماره‌های اضطراری
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                  <a href="tel:115" className="rounded-xl bg-red-500/15 py-2 text-red-600 transition hover:bg-red-500/25">
                    اورژانس<br />۱۱۵
                  </a>
                  <a href="tel:110" className="rounded-xl bg-muted py-2 transition hover:bg-muted/70">
                    پلیس<br />۱۱۰
                  </a>
                  <a href="tel:112" className="rounded-xl bg-muted py-2 transition hover:bg-muted/70">
                    آتش‌نشانی<br />۱۲۵
                  </a>
                </div>
                <p className="mt-2 flex items-start gap-1 text-[10px] text-muted-foreground">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  در شرایط اضطراری واقعی، حتماً با اورژانس (۱۱۵) نیز تماس بگیرید.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <IncidentReportForm
                bookingId={booking.id}
                onSubmitted={(inc) => setIncidents((prev) => [inc, ...prev])}
              />
              <div className="rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]">
                <h3 className="mb-3 text-sm font-bold">تایم‌لاین رویدادها</h3>
                <SafetyTimeline incidents={incidents} />
              </div>
              <TripTimeline
                tour={tour}
                incidents={incidents}
                startDate={booking.tourDate}
              />
            </div>
          </div>
  );
}
