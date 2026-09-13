"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Flag,
  Footprints,
  Utensils,
} from "lucide-react";
import type { Tour, ItineraryDay } from "@/types";
import type { SafetyIncident } from "@/types/safety";
import { toFa, toPersianShortDate, toPersianDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Combined Trip Timeline — Safety Center enhancement (spec §4).
 *
 * Merges the tour's itinerary days with the safety incidents into a single
 * vertical timeline so the user can see "what's planned" vs "what happened"
 * in one view. Each itinerary day is a row; incidents attach to the day
 * they occurred on (matching by date proximity).
 *
 * Visual: vertical timeline with day badges, weather/meal icons, elevation,
 * and any incidents that fall on that day rendered as warning chips.
 */

interface TimelineRow {
  type: "itinerary";
  day: ItineraryDay;
  date: string;
  incidents: SafetyIncident[];
}

export function TripTimeline({
  tour,
  incidents = [],
  startDate,
}: {
  tour: Tour;
  incidents?: SafetyIncident[];
  startDate?: string;
}) {
  const rows: TimelineRow[] = React.useMemo(() => {
    const start = new Date(startDate || tour.startDate || Date.now());
    return tour.itinerary.map((day) => {
      const date = new Date(start);
      date.setDate(date.getDate() + (day.day - 1));
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      // incidents on this day
      const dayIncidents = incidents.filter((inc) => {
        const t = new Date(inc.createdAt).getTime();
        return t >= dayStart.getTime() && t <= dayEnd.getTime();
      });
      return { type: "itinerary", day, date: date.toISOString(), incidents: dayIncidents };
    });
  }, [tour, incidents, startDate]);

  if (rows.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 p-6 text-center text-[12px] text-muted-foreground">
        برنامه‌ی سفر موجود نیست.
      </div>
    );
  }

  const totalIncidents = incidents.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]"
    >
      <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/10 text-emerald">
            <Calendar className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold">تایم‌لاین کامل سفر</h3>
            <p className="text-[10px] text-muted-foreground">
              برنامه‌ی روزانه + رویدادهای ایمنی در یک نگاه
            </p>
          </div>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
          {toFa(rows.length)} روز · {toFa(totalIncidents)} رویداد
        </span>
      </div>

      <ol className="relative space-y-3 pr-5">
        <span
          className="absolute right-[7px] top-2 h-[calc(100%-1rem)] w-px bg-border"
          aria-hidden
        />
        {rows.map((row, i) => {
          const isToday = false; // could be derived if we know today
          return (
            <motion.li
              key={row.day.day}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="relative"
            >
              <span
                className={cn(
                  "absolute -right-[14px] top-3 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-card",
                  row.incidents.length > 0 ? "bg-sunset" : "bg-emerald",
                )}
                aria-hidden
              />

              <div
                className={cn(
                  "rounded-2xl border p-3 shadow-sm",
                  row.incidents.length > 0
                    ? "border-sunset/30 bg-sunset/5"
                    : "border-border/40 bg-background/40",
                )}
              >
                {/* header row */}
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald/10 text-[10px] font-black text-emerald">
                      {toFa(row.day.day)}
                    </span>
                    <h4 className="text-[12px] font-bold">{row.day.title}</h4>
                  </div>
                  <span className="text-[9px] text-muted-foreground">
                    {toPersianShortDate(row.date)}
                  </span>
                </div>

                <p className="mb-2 text-[11px] leading-5 text-muted-foreground">
                  {row.day.description}
                </p>

                {/* meta chips */}
                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                  {typeof row.day.elevation === "number" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-1.5 py-0.5 font-bold text-emerald">
                      <MapPin className="h-2.5 w-2.5" />
                      {toFa(row.day.elevation)}م
                    </span>
                  )}
                  {typeof row.day.distance === "number" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-1.5 py-0.5 font-bold text-gold">
                      <Footprints className="h-2.5 w-2.5" />
                      {toFa(row.day.distance)}km
                    </span>
                  )}
                  {row.day.meals.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-1.5 py-0.5 font-bold text-accent">
                      <Utensils className="h-2.5 w-2.5" />
                      {toFa(row.day.meals.length)} وعده
                    </span>
                  )}
                  {row.day.highlight && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-1.5 py-0.5 font-bold text-gold">
                      <Flag className="h-2.5 w-2.5" />
                      نقطه‌ی اوج
                    </span>
                  )}
                </div>

                {/* incidents on this day */}
                {row.incidents.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-sunset/20 pt-2">
                    {row.incidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="flex items-start gap-1.5 rounded-lg bg-sunset/10 px-2 py-1 text-[10px]"
                      >
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-sunset" />
                        <div className="flex-1">
                          <span className="font-bold text-sunset">
                            {SEVERITY_LABEL[inc.severity]} · {TYPE_LABEL[inc.type]}
                          </span>
                          <p className="text-foreground/80">{inc.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </motion.div>
  );
}

const SEVERITY_LABEL: Record<SafetyIncident["severity"], string> = {
  low: "خفیف",
  medium: "متوسط",
  high: "جدی",
};

const TYPE_LABEL: Record<SafetyIncident["type"], string> = {
  medical: "پزشکی",
  weather: "جو",
  equipment: "تجهیزات",
  route: "مسیر",
  other: "سایر",
};
