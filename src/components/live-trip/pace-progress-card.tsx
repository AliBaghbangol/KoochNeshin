"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Footprints, Clock, Gauge, TrendingUp, Target } from "lucide-react";
import type { Tour } from "@/types";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Pace & Progress mini-chart — Live Trip enhancement (spec §3).
 *
 * Shows a horizontal progress bar across the itinerary days with cumulative
 * distance, average pace, and ETA to the next waypoint. The current day
 * is marked with a pulsing dot.
 *
 * Mock data derived deterministically from `tour.itinerary[].distance` and
 * a per-day pace factor.
 */

interface DayProgress {
  day: number;
  distance: number;
  cumulative: number;
  label: string;
}

export function PaceProgressCard({
  tour,
  currentDay = 1,
  className,
}: {
  tour: Tour;
  currentDay?: number;
  className?: string;
}) {
  const days: DayProgress[] = React.useMemo(() => {
    // Single-pass cumulative sum without reassigning an outer variable
    // (React Compiler-friendly). Uses reduce to thread the cumulative
    // value through each iteration as the accumulator.
    return tour.itinerary
      .filter((d) => typeof d.distance === "number")
      .reduce<{ list: DayProgress[]; cumulative: number }>(
        (acc, d) => {
          const dist = d.distance as number;
          acc.cumulative += dist;
          acc.list.push({
            day: d.day,
            distance: dist,
            cumulative: acc.cumulative,
            label: d.title,
          });
          return acc;
        },
        { list: [], cumulative: 0 },
      ).list;
  }, [tour]);

  if (days.length < 2) {
    return null;
  }

  const totalDistance = days[days.length - 1].cumulative;
  const currentDayObj = days.find((d) => d.day === currentDay) ?? days[0];
  const progressPercent =
    totalDistance > 0
      ? Math.min(100, (currentDayObj.cumulative / totalDistance) * 100)
      : 0;

  // mock pace: 4-5 km/h for mountains, 5-6 for desert, 4-4.5 for forest
  const basePace =
    tour.category === "mountain" ? 4.2 :
    tour.category === "desert" ? 5.5 :
    tour.category === "forest" ? 4.5 :
    5.0;

  // deterministic variation
  const pace = basePace + ((tour.id.length * 7) % 10) / 10;

  // ETA to next waypoint (using currentDayObj.distance / pace)
  const nextDay = days.find((d) => d.day === currentDay + 1);
  const remainingToNext = nextDay
    ? Math.max(0, nextDay.cumulative - currentDayObj.cumulative)
    : 0;
  const etaHours = remainingToNext > 0 ? remainingToNext / pace : 0;
  const etaH = Math.floor(etaHours);
  const etaM = Math.round((etaHours - etaH) * 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/10 text-emerald">
            <Gauge className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold">پیشرفت و سرعت</h3>
            <p className="text-[10px] text-muted-foreground">
              مسافت طی‌شده و ETA تا نقطه‌ی بعدی
            </p>
          </div>
        </div>
        <div className="text-left">
          <div className="text-base font-black text-emerald">
            {toFa(Math.round(progressPercent))}٪
          </div>
          <div className="text-[9px] text-muted-foreground">از کل مسیر</div>
        </div>
      </div>

      {/* progress bar with day markers */}
      <div className="relative mb-3">
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="relative h-full rounded-full bg-gradient-to-l from-emerald to-emerald-light"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>

        {/* day markers */}
        <div className="absolute inset-x-0 -bottom-1 flex items-center justify-between px-0">
          {days.map((d, i) => {
            const pos = totalDistance > 0 ? (d.cumulative / totalDistance) * 100 : 0;
            const isCurrent = d.day === currentDay;
            return (
              <motion.div
                key={d.day}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="absolute -translate-x-1/2"
                style={{ right: `${pos}%` }}
              >
                <span
                  className={cn(
                    "block h-2 w-2 rounded-full border border-white",
                    isCurrent ? "bg-gold" : "bg-emerald/40",
                  )}
                />
                {isCurrent && (
                  <motion.span
                    className="absolute -inset-1 rounded-full bg-gold/30"
                    animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatChip
          icon={Footprints}
          label="مسافت طی‌شده"
          value={`${toFa(currentDayObj.cumulative.toFixed(1))} km`}
          tone="emerald"
        />
        <StatChip
          icon={Target}
          label="مسافت کل"
          value={`${toFa(totalDistance.toFixed(1))} km`}
          tone="gold"
        />
        <StatChip
          icon={Gauge}
          label="سرعت متوسط"
          value={`${toFa(pace.toFixed(1))} km/h`}
          tone="emerald"
        />
        <StatChip
          icon={Clock}
          label="ETA نقطه‌ی بعد"
          value={etaHours > 0 ? `${toFa(etaH)}س ${toFa(etaM)}د` : "—"}
          tone="sunset"
        />
      </div>
    </motion.div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Footprints;
  label: string;
  value: string;
  tone: "emerald" | "gold" | "sunset";
}) {
  const toneCls = {
    emerald: "bg-emerald/10 text-emerald",
    gold: "bg-gold/10 text-gold",
    sunset: "bg-sunset/10 text-sunset",
  } as const;
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-background/40 px-2 py-1.5">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", toneCls[tone].split(" ")[1])} />
      <div className="min-w-0 flex-1">
        <div className="text-[9px] text-muted-foreground">{label}</div>
        <div className="truncate text-[11px] font-bold">{value}</div>
      </div>
    </div>
  );
}
