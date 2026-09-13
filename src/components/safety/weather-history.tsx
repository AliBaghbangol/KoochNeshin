"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Thermometer,
  Calendar,
} from "lucide-react";
import type { Tour } from "@/types";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * 7-Day Weather History — Safety Center enhancement (spec §4).
 *
 * Shows the past 7 days' weather conditions as a horizontal scroll row of
 * mini cards. Each card shows the day's condition icon, high/low temp, and
 * a small bar showing the temp range relative to the week's min/max.
 *
 * This helps the user see weather trends leading up to the trip — e.g., if
 * it's been raining all week, the trail might be muddy.
 *
 * Mock data: deterministic from tour.id + day offset. TODO(backend): real
 * historical weather API (Open-Meteo Archive).
 */

type Condition = "sunny" | "cloudy" | "rainy" | "snowy" | "partly-cloudy";

interface DayHistory {
  dayOffset: number; // 0 = yesterday, 6 = 7 days ago
  date: string;
  condition: Condition;
  high: number;
  low: number;
  humidity: number;
}

const CONDITION_ICON: Record<Condition, { icon: typeof Sun; color: string }> = {
  sunny: { icon: Sun, color: "text-gold" },
  "partly-cloudy": { icon: Cloud, color: "text-gold" },
  cloudy: { icon: Cloud, color: "text-muted-foreground" },
  rainy: { icon: CloudRain, color: "text-blue-500" },
  snowy: { icon: CloudSnow, color: "text-blue-400" },
};

const CONDITION_LABEL: Record<Condition, string> = {
  sunny: "آفتابی",
  "partly-cloudy": "نیمه‌ابری",
  cloudy: "ابری",
  rainy: "بارانی",
  snowy: "برفی",
};

function generateHistory(tour: Tour): DayHistory[] {
  let seed = 0;
  for (let i = 0; i < tour.id.length; i++) {
    seed = (seed * 31 + tour.id.charCodeAt(i)) | 0;
  }
  const rand = (n: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };

  const baseTemp =
    tour.category === "mountain" ? 8 :
    tour.category === "desert" ? 28 :
    tour.category === "coastal" ? 22 :
    tour.category === "forest" ? 14 :
    18;

  const conditions: Condition[] = ["sunny", "partly-cloudy", "cloudy", "rainy"];
  const days: DayHistory[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i - 1); // yesterday back 7 days
    let condition = conditions[rand(conditions.length)];
    if (tour.category === "mountain" && rand(10) > 6) condition = "snowy";
    days.push({
      dayOffset: i,
      date: d.toISOString(),
      condition,
      high: baseTemp + rand(8) - 2,
      low: baseTemp + rand(8) - 10,
      humidity: 40 + rand(50),
    });
  }
  return days;
}

export function WeatherHistory({
  tour,
  className,
}: {
  tour: Tour;
  className?: string;
}) {
  const history = React.useMemo(() => generateHistory(tour), [tour]);

  // Compute week min/max for the temp range bar
  const allTemps = history.flatMap((d) => [d.high, d.low]);
  const weekMin = Math.min(...allTemps);
  const weekMax = Math.max(...allTemps);
  const weekRange = weekMax - weekMin || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
            <Calendar className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold">آب‌وهوای ۷ روز گذشته</h3>
            <p className="text-[10px] text-muted-foreground">
              روند هوا قبل از سفر
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Thermometer className="h-3 w-3" />
          {toFa(weekMin)}° تا {toFa(weekMax)}°
        </div>
      </div>

      {/* 7-day row */}
      <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {history.map((d, i) => {
          const cfg = CONDITION_ICON[d.condition];
          const Icon = cfg.icon;
          // temp range bar position
          const lowPct = ((d.low - weekMin) / weekRange) * 100;
          const highPct = ((d.high - weekMin) / weekRange) * 100;
          const barWidth = highPct - lowPct;
          return (
            <motion.div
              key={d.dayOffset}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="flex min-w-[68px] shrink-0 flex-col items-center gap-1 rounded-2xl border bg-background/40 p-2 text-center"
            >
              <span className="text-[9px] font-bold text-muted-foreground">
                {toFa(d.dayOffset + 1)} روز پیش
              </span>
              <span className={cn("grid h-7 w-7 place-items-center rounded-lg bg-card", cfg.color)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="text-[10px] font-bold">
                {toFa(d.high)}°
                <span className="text-[8px] font-normal text-muted-foreground">
                  /{toFa(d.low)}°
                </span>
              </div>
              {/* temp range bar */}
              <div className="relative h-1 w-full rounded-full bg-muted">
                <motion.div
                  className="absolute h-full rounded-full bg-gradient-to-l from-gold to-emerald"
                  initial={{ width: 0, left: 0 }}
                  animate={{ width: `${barWidth}%`, left: `${lowPct}%` }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
                />
              </div>
              <span className="text-[8px] text-muted-foreground">
                {CONDITION_LABEL[d.condition]}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* trend summary */}
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-background/40 p-2 text-[10px] text-muted-foreground">
        <Droplets className="h-3 w-3 shrink-0 text-blue-500" />
        <span>
          میانگین رطوبت هفته:{" "}
          {toFa(Math.round(history.reduce((s, d) => s + d.humidity, 0) / history.length))}٪
        </span>
        <Wind className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span>
          {history.filter((d) => d.condition === "rainy" || d.condition === "snowy").length > 2
            ? "هفته‌ی بارانی — احتمال گل‌آلود بودن مسیر"
            : "هوای پایدار در طول هفته"}
        </span>
      </div>
    </motion.div>
  );
}
