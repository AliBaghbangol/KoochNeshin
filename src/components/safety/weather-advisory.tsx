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
  AlertTriangle,
  ShieldCheck,
  Umbrella,
} from "lucide-react";
import type { Tour } from "@/types";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Weather Advisory — Safety Center enhancement (spec §4).
 *
 * Surfaces weather-related safety advisories for the trip:
 *   - Rain → bring waterproof gear
 *   - Snow → check road closures, expect cold
 *   - Extreme heat (>30°C) → hydrate, avoid midday sun
 *   - Extreme cold (<5°C) → layer up, watch for frostbite
 *   - High wind (>25 km/h) → secure loose gear
 *
 * For the demo, advisories are derived from a deterministic mock based on
 * tour.id + tour.category. TODO(backend): wire to real weather API.
 */

type Condition = "sunny" | "cloudy" | "rainy" | "snowy" | "partly-cloudy";
type Severity = "info" | "warning" | "danger";

interface Advisory {
  severity: Severity;
  icon: typeof Sun;
  title: string;
  description: string;
  recommendation: string;
}

interface MockWeather {
  condition: Condition;
  high: number;
  low: number;
  wind: number;
  humidity: number;
}

function generateMockWeather(tour: Tour): MockWeather {
  // Deterministic from tour.id hash
  let seed = 0;
  for (let i = 0; i < tour.id.length; i++) {
    seed = (seed * 31 + tour.id.charCodeAt(i)) | 0;
  }
  const rand = (n: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };

  const conditions: Condition[] = ["sunny", "partly-cloudy", "cloudy", "rainy"];
  const baseTemp =
    tour.category === "mountain" ? 8 :
    tour.category === "desert" ? 28 :
    tour.category === "coastal" ? 22 :
    tour.category === "forest" ? 14 :
    18;

  // Snowy possible in mountain category
  let condition = conditions[rand(conditions.length)];
  if (tour.category === "mountain" && rand(10) > 5) condition = "snowy";

  return {
    condition,
    high: baseTemp + rand(8) - 2,
    low: baseTemp + rand(8) - 10,
    wind: 5 + rand(35),
    humidity: 40 + rand(50),
  };
}

function computeAdvisories(weather: MockWeather): Advisory[] {
  const out: Advisory[] = [];

  if (weather.condition === "rainy") {
    out.push({
      severity: "warning",
      icon: Umbrella,
      title: "بارش باران پیش‌بینی شده",
      description: `احتمال بارش در طول سفر با رطوبت ${weather.humidity}٪.`,
      recommendation: "کاپشن ضدآب و چتر همراه داشته باشید. مسیرهای خیس خطر لیزخوردن دارند.",
    });
  }

  if (weather.condition === "snowy") {
    out.push({
      severity: "danger",
      icon: CloudSnow,
      title: "بارش برف پیش‌بینی شده",
      description: `شرایط زمستانی با دمای ${weather.low}° تا ${weather.high}°.`,
      recommendation: "وضعیت جاده‌ها را قبل از حرکت چک کنید. لباس گرم و زنجیه چرخ در دسترس داشته باشید.",
    });
  }

  if (weather.high >= 30) {
    out.push({
      severity: "warning",
      icon: Sun,
      title: "گرمای شدید",
      description: `دمای پیش‌بینی‌شده: ${weather.high}°C.`,
      recommendation: "آب کافی همراه داشته باشید. از ۱۱ صبح تا ۳ بعدازظهر در سایه استراحت کنید.",
    });
  }

  if (weather.low <= 5) {
    out.push({
      severity: "warning",
      icon: Thermometer,
      title: "سرمای شدید",
      description: `حداقل دما: ${weather.low}°C.`,
      recommendation: "لباس لایه‌ای، کفش عایق و دستکش گرم بیاورید. یخ‌زدگی انگشتان را جدی بگیرید.",
    });
  }

  if (weather.wind >= 25) {
    out.push({
      severity: "warning",
      icon: Wind,
      title: "باد شدید",
      description: `سرعت باد تا ${weather.wind} km/h.`,
      recommendation: "تجهیزات سبک را محکم ببندید. چادرها را در جای بادپناه بزنید.",
    });
  }

  // If no advisories — show all-clear
  if (out.length === 0) {
    out.push({
      severity: "info",
      icon: ShieldCheck,
      title: "هوای پایدار",
      description: "بدون هشدار خاصی برای این سفر.",
      recommendation: "با آرامش خاطر سفر کنید — آب‌وهوا در محدوده‌ی ایمن است.",
    });
  }

  return out;
}

const SEVERITY_TONE: Record<
  Severity,
  { color: string; bg: string; border: string; bar: string }
> = {
  info: {
    color: "text-emerald",
    bg: "bg-emerald/5",
    border: "border-emerald/30",
    bar: "bg-emerald",
  },
  warning: {
    color: "text-gold",
    bg: "bg-gold/5",
    border: "border-gold/30",
    bar: "bg-gold",
  },
  danger: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/5",
    border: "border-red-500/30",
    bar: "bg-red-500",
  },
};

export function WeatherAdvisory({
  tour,
  className,
}: {
  tour: Tour;
  className?: string;
}) {
  const weather = React.useMemo(() => generateMockWeather(tour), [tour]);
  const advisories = React.useMemo(
    () => computeAdvisories(weather),
    [weather],
  );

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
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gold/10 text-gold">
            <Cloud className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold">هشدارهای آب‌وهوایی</h3>
            <p className="text-[10px] text-muted-foreground">
              توصیه‌های ایمنی بر اساس پیش‌بینی
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Thermometer className="h-3 w-3" />
          {toFa(weather.high)}°/{toFa(weather.low)}°
          <Droplets className="h-3 w-3" />
          {toFa(weather.humidity)}٪
          <Wind className="h-3 w-3" />
          {toFa(weather.wind)}
        </div>
      </div>

      <ul className="space-y-2">
        {advisories.map((a, i) => {
          const tone = SEVERITY_TONE[a.severity];
          const Icon = a.icon;
          return (
            <motion.li
              key={a.title}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-3 pr-4",
                tone.bg,
                tone.border,
              )}
            >
              <span className={cn("absolute inset-y-0 right-0 w-1", tone.bar)} aria-hidden />
              <div className="flex items-start gap-2.5">
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-card", tone.color)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-[12px] font-bold", tone.color)}>
                      {a.title}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      {a.severity === "danger" ? "بحرانی" : a.severity === "warning" ? "هشدار" : "اطلاع"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-foreground/80">
                    {a.description}
                  </p>
                  <p className="mt-1 rounded-lg bg-card/50 px-2 py-1 text-[10px] text-muted-foreground">
                    💡 {a.recommendation}
                  </p>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
