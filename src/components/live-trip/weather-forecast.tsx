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
  Sunrise,
  Sunset,
  Thermometer,
  CloudSun,
} from "lucide-react";
import type { Tour } from "@/types";
import { toFa, toPersianShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Live Trip Weather Forecast — spec §3 enhancement.
 *
 * Shows a day-by-day weather forecast for the duration of the trip. Each
 * itinerary day gets a card with: high/low temp, condition icon, humidity,
 * wind. The current day is highlighted.
 *
 * For the demo, weather is derived deterministically from the tour's
 * `coordinates` + day index (mock data). TODO(backend): integrate with a
 * real weather API and cache results in the offline cache.
 */

type Condition = "sunny" | "cloudy" | "rainy" | "snowy" | "partly-cloudy";

interface DayWeather {
  day: number;
  date: string;
  condition: Condition;
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  sunrise: string;
  sunset: string;
}

const CONDITION_CONFIG: Record<
  Condition,
  { icon: typeof Sun; label: string; color: string; bg: string }
> = {
  sunny: {
    icon: Sun,
    label: "آفتابی",
    color: "text-gold",
    bg: "bg-gold/10",
  },
  "partly-cloudy": {
    icon: CloudSun,
    label: "نیمه‌ابری",
    color: "text-gold",
    bg: "bg-gold/5",
  },
  cloudy: {
    icon: Cloud,
    label: "ابری",
    color: "text-muted-foreground",
    bg: "bg-muted/40",
  },
  rainy: {
    icon: CloudRain,
    label: "بارانی",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  snowy: {
    icon: CloudSnow,
    label: "برفی",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
};

/** تولید داده‌ی mock پایدار بر اساس tour.id */
function generateMockForecast(tour: Tour): DayWeather[] {
  // seed from tour.id hash for stable but varied results
  let seed = 0;
  for (let i = 0; i < tour.id.length; i++) seed = (seed * 31 + tour.id.charCodeAt(i)) | 0;
  const rand = (n: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % n);
  };

  const startDate = new Date(tour.startDate || Date.now());
  const baseTemp =
    tour.category === "mountain" ? 8 :
    tour.category === "desert" ? 28 :
    tour.category === "coastal" ? 22 :
    tour.category === "forest" ? 14 :
    18;

  const conditions: Condition[] = ["sunny", "partly-cloudy", "cloudy", "rainy"];

  return tour.itinerary.map((d, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const c = conditions[rand(conditions.length)];
    return {
      day: d.day,
      date: date.toISOString(),
      condition: c,
      high: baseTemp + rand(8) - 2,
      low: baseTemp + rand(8) - 8,
      humidity: 40 + rand(40),
      windSpeed: 5 + rand(20),
      sunrise: `0${5 + rand(2)}:${rand(60).toString().padStart(2, "0")}`,
      sunset: `1${7 + rand(2)}:${rand(60).toString().padStart(2, "0")}`,
    };
  });
}

export function WeatherForecast({
  tour,
  currentDay = 1,
}: {
  tour: Tour;
  currentDay?: number;
}) {
  const forecast = React.useMemo(() => generateMockForecast(tour), [tour]);

  if (forecast.length === 0) return null;

  const today = forecast.find((f) => f.day === currentDay) ?? forecast[0];
  const todayConfig = CONDITION_CONFIG[today.condition];
  const TodayIcon = todayConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]"
    >
      {/* header — today's weather */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gold/10 text-gold">
            <CloudSun className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold">پیش‌بینی آب‌وهوا</h3>
            <p className="text-[10px] text-muted-foreground">
              {toFa(forecast.length)} روز از سفر
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("grid h-10 w-10 place-items-center rounded-xl", todayConfig.bg)}>
            <TodayIcon className={cn("h-5 w-5", todayConfig.color)} />
          </span>
          <div className="text-left">
            <div className="text-base font-black leading-none">
              {toFa(today.high)}°
              <span className="text-[10px] font-normal text-muted-foreground">
                /{toFa(today.low)}°
              </span>
            </div>
            <div className={cn("text-[10px] font-bold", todayConfig.color)}>
              {todayConfig.label}
            </div>
          </div>
        </div>
      </div>

      {/* day-by-day row */}
      <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {forecast.map((d, i) => {
          const cfg = CONDITION_CONFIG[d.condition];
          const Icon = cfg.icon;
          const isToday = d.day === currentDay;
          return (
            <motion.div
              key={d.day}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className={cn(
                "relative flex min-w-[78px] flex-col items-center gap-1 rounded-2xl border p-2 text-center transition",
                isToday
                  ? "border-emerald/40 bg-emerald/5 shadow-sm"
                  : "border-border/40 bg-background/40",
              )}
            >
              {isToday && (
                <span className="absolute -top-1.5 rounded-full bg-emerald px-1.5 py-0.5 text-[8px] font-bold text-white">
                  امروز
                </span>
              )}
              <span className="text-[10px] font-bold text-muted-foreground">
                روز {toFa(d.day)}
              </span>
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg", cfg.bg)}>
                <Icon className={cn("h-4 w-4", cfg.color)} />
              </span>
              <div className="text-[12px] font-black leading-none">
                {toFa(d.high)}°
                <span className="text-[9px] font-normal text-muted-foreground">
                  /{toFa(d.low)}°
                </span>
              </div>
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                <Droplets className="h-2.5 w-2.5" />
                {toFa(d.humidity)}٪
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* today details */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <DetailChip
          icon={Thermometer}
          label="دمای فعلی"
          value={`${toFa(today.high)}°C`}
        />
        <DetailChip
          icon={Wind}
          label="باد"
          value={`${toFa(today.windSpeed)} km/h`}
        />
        <DetailChip
          icon={Sunrise}
          label="طلوع"
          value={toFa(today.sunrise)}
        />
        <DetailChip
          icon={Sunset}
          label="غروب"
          value={toFa(today.sunset)}
        />
      </div>
    </motion.div>
  );
}

function DetailChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-background/40 px-2 py-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-emerald" />
      <div className="min-w-0 flex-1">
        <div className="text-[9px] text-muted-foreground">{label}</div>
        <div className="truncate text-[11px] font-bold">{value}</div>
      </div>
    </div>
  );
}
