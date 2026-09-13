"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  Wind,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
  Thermometer,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Flame,
  Snowflake,
} from "lucide-react";
import type { Tour } from "@/types";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

type WeatherCondition = "sunny" | "cloudy" | "rainy" | "snowy" | "partly-cloudy";

interface DayWeather {
  day: string;
  condition: WeatherCondition;
  high: number;
  low: number;
}

interface WeatherData {
  current: {
    condition: WeatherCondition;
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    visibility: number;
    sunrise: string;
    sunset: string;
  };
  forecast: DayWeather[];
}

/**
 * Per-condition SINGLE-SPECTRUM theme (user request: «از طیف مناسب همون هوا
 * استفاده کن» — no more rainbow). Every colored element of the widget (hero
 * sky, icon tiles, chips, warmth bars, header accent) comes from ONE hue
 * family chosen by the destination's current weather.
 */
const CONDITION_CONFIG: Record<
  WeatherCondition,
  {
    icon: typeof Sun;
    label: string;
    /** hero sky gradient — dark mode (richer) */
    heroDark: string;
    /** hero sky gradient — light mode */
    hero: string;
    /** icon tiles (header + forecast rows) in the same family */
    tile: string;
    /** label chips in the same family */
    chip: string;
    /** micro accent (header underline) */
    accentBar: string;
    particle: "sun" | "rain" | "snow" | "cloud";
  }
> = {
  sunny: {
    icon: Sun,
    label: "آفتابی",
    heroDark: "from-amber-500/90 via-amber-500/70 to-orange-400/50",
    hero: "from-amber-300 via-amber-200 to-orange-200",
    tile: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
    chip: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    accentBar: "bg-amber-400",
    particle: "sun",
  },
  "partly-cloudy": {
    icon: CloudSun,
    label: "نیمه‌ابری",
    heroDark: "from-sky-600/90 via-sky-500/70 to-cyan-400/50",
    hero: "from-sky-300 via-sky-200 to-cyan-100",
    tile: "bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
    chip: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    accentBar: "bg-sky-400",
    particle: "cloud",
  },
  cloudy: {
    icon: Cloud,
    label: "ابری",
    heroDark: "from-slate-600/90 via-slate-500/70 to-slate-400/50",
    hero: "from-slate-300 via-slate-200 to-zinc-200",
    tile: "bg-slate-500/10 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
    chip: "bg-slate-500/10 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
    accentBar: "bg-slate-400",
    particle: "cloud",
  },
  rainy: {
    icon: CloudRain,
    label: "بارانی",
    heroDark: "from-blue-700/90 via-blue-600/70 to-blue-400/50",
    hero: "from-blue-400 via-blue-300 to-indigo-200",
    tile: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
    chip: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
    accentBar: "bg-blue-500",
    particle: "rain",
  },
  snowy: {
    icon: CloudSnow,
    label: "برفی",
    heroDark: "from-cyan-600/90 via-cyan-500/70 to-sky-400/50",
    hero: "from-cyan-300 via-cyan-100 to-sky-100",
    tile: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-300",
    chip: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
    accentBar: "bg-cyan-400",
    particle: "snow",
  },
};

// Generate deterministic mock weather based on destination + season.
// NOTE: `seed` is a float (sum of lat/lng), so all modulo results MUST be
// coerced to a non-negative integer before being used as an array index.
// Without Math.floor/Math.abs, `(seed + i) % len` can produce floats like
// 0.5 which JS silently turns into `arr["0.5"]` → undefined → crash when
// reading `.icon` off the looked-up config.
function generateWeather(tour: Tour): WeatherData {
  const seedRaw = tour.destination.length + tour.coordinates.lat + tour.coordinates.lng;
  const seed = Math.floor(Math.abs(seedRaw));
  const isHighAltitude = (tour.coordinates.lat > 35 || tour.difficulty === "hard");
  const isDesert = tour.category === "desert";
  const isCoastal = tour.category === "coastal";

  let condition: WeatherCondition = "sunny";
  let baseTemp = 25;

  if (isDesert) {
    baseTemp = 35;
    condition = "sunny";
  } else if (isHighAltitude) {
    baseTemp = 5;
    condition = seed % 3 === 0 ? "snowy" : "partly-cloudy";
  } else if (isCoastal) {
    baseTemp = 30;
    condition = "partly-cloudy";
  } else if (tour.category === "forest") {
    baseTemp = 18;
    condition = seed % 2 === 0 ? "rainy" : "cloudy";
  }

  const temp = baseTemp + (seed % 5) - 2;
  const days = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
  const conditions: WeatherCondition[] = [
    "sunny",
    "partly-cloudy",
    "cloudy",
    "rainy",
    "partly-cloudy",
  ];

  return {
    current: {
      condition,
      temp,
      feelsLike: temp - 2,
      humidity: isDesert ? 20 : isCoastal ? 75 : 55,
      windSpeed: 5 + (seed % 15),
      visibility: 10 + (seed % 5),
      sunrise: "۰۵:۴۲",
      sunset: "۱۹:۱۸",
    },
    forecast: days.map((day, i) => ({
      day,
      condition: conditions[(seed + i) % conditions.length],
      high: temp + 3 - i,
      low: temp - 5 - i,
    })),
  };
}

/* ---------------------------------------------------------------- */
/* Condition-scene: the animated hero sky behind the big icon       */
/* ---------------------------------------------------------------- */

function WeatherScene({ kind }: { kind: "sun" | "rain" | "snow" | "cloud" }) {
  if (kind === "sun") {
    return (
      <>
        {/* rotating rays */}
        <motion.div
          aria-hidden
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <span
              key={deg}
              className="absolute left-1/2 top-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-white/50"
              style={{ transform: `rotate(${deg}deg) translateX(34px)`, transformOrigin: "0 50%" }}
            />
          ))}
        </motion.div>
        {/* breathing core */}
        <motion.div
          aria-hidden
          className="absolute h-16 w-16 rounded-full bg-white/60 blur-md"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </>
    );
  }

  if (kind === "rain") {
    return (
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute top-0 h-3.5 w-0.5 rounded-full bg-white/70"
            style={{ left: `${8 + i * 10}%` }}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 84, opacity: [0, 1, 0] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: (i * 0.23) % 1.1,
              ease: "easeIn",
            }}
          />
        ))}
      </div>
    );
  }

  if (kind === "snow") {
    return (
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute top-0 block h-1.5 w-1.5 rounded-full bg-white/90"
            style={{ left: `${5 + i * 9.5}%` }}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 90, x: [0, 6, -4, 0], opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: (i * 0.4) % 3.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  // drifting clouds
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white/50 blur-[2px]"
          style={{
            width: 46 + i * 14,
            height: 12 + i * 3,
            top: 8 + i * 20,
          }}
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 190, opacity: [0, 0.9, 0] }}
          transition={{
            duration: 9 + i * 3,
            repeat: Infinity,
            delay: i * 2.4,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Degrees with an EXPLICIT minus sign for below-zero days — the user could
 * not tell whether a temperature was negative or positive («معلوم نیست
 * منفیه یا مثبت»). U+2212 (−) is a real minus, not a hyphen.
 */
function fmtTemp(t: number): string {
  return t < 0 ? `−${toFa(Math.abs(t))}°` : `${toFa(t)}°`;
}

export function WeatherWidget({ tour }: { tour: Tour }) {
  const weather = React.useMemo(() => generateWeather(tour), [tour]);
  const cfg = CONDITION_CONFIG[weather.current.condition];
  const Icon = cfg.icon;

  // Drive the «گرم‌ترین» / «سردترین» day badges. The visual warmth bar was
  // removed earlier per user request — only these badges remain.
  const warmestHigh = Math.max(...weather.forecast.map((d) => d.high));
  const coldestLow = Math.min(...weather.forecast.map((d) => d.low));

  return (
    <ScrollReveal>
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <span className={cn("relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl", cfg.tile)}>
            <Icon className="h-5 w-5" />
            <motion.span
              aria-hidden
              className={cn("absolute inset-x-0 bottom-0 h-0.5", cfg.accentBar)}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
          </span>
          <div>
            <h3 className="text-lg font-extrabold md:text-xl">آب‌وهوای مقصد</h3>
            <p className="text-xs text-muted-foreground">{tour.destination}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
          {/* Current weather — single-spectrum sky hero */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-border/60 p-0.5">
            {/* sky — one hue family for the whole card */}
            <div className={cn("absolute inset-0 bg-gradient-to-bl dark:opacity-95", cfg.heroDark)} />
            <div className={cn("absolute inset-0 bg-gradient-to-bl opacity-30 dark:opacity-0", cfg.hero)} />
            {/* scene */}
            <div className="absolute inset-0">
              <WeatherScene kind={cfg.particle} />
            </div>

            <div className="relative p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-black/25 px-2.5 py-1 backdrop-blur-sm dark:bg-black/40">
                  <p className="text-[10px] font-medium text-white/80">همین الان</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-white/25">
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
                <div className="relative grid h-20 w-20 place-items-center">
                  <div className={cn("absolute inset-0 rounded-3xl bg-white/25 backdrop-blur-sm", "ring-1 ring-white/40")} />
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="relative text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                  >
                    <Icon className="h-12 w-12" strokeWidth={1.6} />
                  </motion.div>
                </div>
              </div>

              <div className="mt-2 flex items-baseline gap-2 text-white">
                <span className="text-5xl font-extrabold drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
                  {toFa(weather.current.temp)}°
                </span>
                <span className="text-sm font-bold text-white/80">سانتی‌گراد</span>
              </div>
              <p className="text-[11px] font-medium text-white/85">
                حس واقعی: {toFa(weather.current.feelsLike)}°
              </p>

              {/* Details grid — uniform glass chips (same family, no rainbow) */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {(() => {
                  const stats = [
                    { icon: Droplets, label: "رطوبت", value: `${toFa(weather.current.humidity)}٪` },
                    { icon: Wind, label: "باد", value: `${toFa(weather.current.windSpeed)} کیلومتر/ساعت` },
                    { icon: Eye, label: "دید افقی", value: `${toFa(weather.current.visibility)} کیلومتر` },
                    { icon: Thermometer, label: "شاخص UV", value: toFa(weather.current.humidity > 60 ? 3 : 7) },
                  ];
                  return stats.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-2 rounded-xl bg-white/15 p-2 text-white ring-1 ring-white/25 backdrop-blur-sm"
                    >
                      <s.icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/75">{s.label}</p>
                        <p className="truncate font-bold">{s.value}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Sunrise/Sunset — day timeline (sun stays sun: warm but subtle) */}
              <div className="mt-3 rounded-xl bg-black/25 p-2.5 ring-1 ring-white/20 backdrop-blur-sm">
                <div className="relative mb-1.5 h-1 overflow-hidden rounded-full bg-white/20">
                  <div className="absolute inset-y-0 left-[22%] right-[28%] rounded-full bg-gradient-to-r from-white/50 via-yellow-200/90 to-white/50" />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Sunrise className="h-4 w-4 text-white/90" />
                    {weather.current.sunrise}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-white/70">
                    <Sparkles className="h-3 w-3" />
                    از طلوع تا غروب
                  </span>
                  <span className="flex items-center gap-1.5">
                    {weather.current.sunset}
                    <Sunset className="h-4 w-4 text-white/90" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5-day forecast — each day wears its OWN condition theme */}
          <div className="rounded-2xl border bg-card p-4 md:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                پیش‌بینی ۵ روز آینده
              </p>
            </div>
            {/* column header — mirrors the EXACT column template of the rows
                below (same fixed widths and gaps), so every label sits
                precisely over its column and the degrees stack under each
                other across all 5 days (user: «دماها مرتب زیر هم و تراز
                نیستند») */}
            <div className="mb-1.5 flex items-center gap-2 px-2.5 text-[10px] font-medium text-muted-foreground md:gap-3">
              <span className="w-14 shrink-0 md:w-20">روز</span>
              <span className="h-8 w-8 shrink-0 md:h-9 md:w-9" aria-hidden />
              <span className="hidden w-14 shrink-0 text-center sm:block md:w-16">
                وضعیت
              </span>
              <span className="w-16 shrink-0 md:w-24" aria-hidden />
              <span className="flex w-12 shrink-0 items-center justify-center gap-0.5 whitespace-nowrap text-rose-600 tabular-nums dark:text-rose-300 md:w-14">
                <ArrowUp className="h-3 w-3" />
                بیشترین
              </span>
              <span className="flex w-12 shrink-0 items-center justify-center gap-0.5 whitespace-nowrap text-sky-600 tabular-nums dark:text-sky-300 md:w-14">
                <ArrowDown className="h-3 w-3" />
                کمترین
              </span>
            </div>
            <div className="space-y-2">
              {weather.forecast.map((day, i) => {
                // each day uses ITS OWN condition theme — a sunny day is
                // always amber, a rainy day always blue, regardless of what
                // the current weather is (user report: «آفتابی آبی میشه»).
                const dCfg = CONDITION_CONFIG[day.condition];
                const DIcon = dCfg.icon;
                const isWarmest = day.high === warmestHigh;
                const isColdest = day.low === coldestLow;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    className="flex items-center gap-2 rounded-xl bg-secondary/40 p-2.5 text-sm md:gap-3"
                  >
                    {/* fixed-width columns — the SAME template as the header
                        above and identical in every row, so the ↑/↓ degrees
                        stack perfectly under each other on all 5 days */}
                    <span className="w-14 shrink-0 font-semibold md:w-20">{day.day}</span>
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg md:h-9 md:w-9", dCfg.tile)}>
                      <DIcon className="h-[18px] w-[18px]" />
                    </span>
                    <span className={cn("hidden w-14 shrink-0 rounded-full px-1 py-0.5 text-center text-[10px] font-bold sm:block md:w-16", dCfg.chip)}>
                      {dCfg.label}
                    </span>
                    {/* گرم‌ترین/سردترین live in a RESERVED fixed slot, so their
                        presence never shifts the degree columns; the badge sits
                        at the inline-end of the slot = immediately to the RIGHT
                        of the degrees (user request) */}
                    <span className="flex w-16 shrink-0 items-center justify-end md:w-24">
                      {isWarmest && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold">
                          <Flame className="h-2.5 w-2.5" />
                          گرم‌ترین
                        </span>
                      )}
                      {isColdest && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-600 dark:text-sky-300">
                          <Snowflake className="h-2.5 w-2.5" />
                          سردترین
                        </span>
                      )}
                    </span>
                    <span
                      className="flex w-12 shrink-0 items-center justify-center gap-0.5 tabular-nums md:w-14"
                      title="بالاترین دمای این روز"
                    >
                      <ArrowUp className="h-3 w-3 shrink-0 text-rose-500" />
                      <span className={cn(
                        "font-extrabold",
                        day.high < 0
                          ? "text-sky-600 dark:text-sky-300"
                          : "text-rose-600 dark:text-rose-300",
                      )}>
                        {fmtTemp(day.high)}
                      </span>
                    </span>
                    <span
                      className="flex w-12 shrink-0 items-center justify-center gap-0.5 tabular-nums md:w-14"
                      title="پایین‌ترین دمای این روز"
                    >
                      <ArrowDown className="h-3 w-3 shrink-0 text-sky-500" />
                      <span className="font-bold text-sky-600 dark:text-sky-300">
                        {fmtTemp(day.low)}
                      </span>
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* legend — day colors + the minus convention */}
            <div className="mt-4 space-y-1.5 border-t pt-3 text-[10px] text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Thermometer className="h-3 w-3" />
                رنگ هر روز، وضعیت همان روز را نشان می‌دهد.
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-rose-500" />
                  بیشترین دمای روز
                </span>
                <span className="flex items-center gap-1">
                  <ArrowDown className="h-3 w-3 text-sky-500" />
                  کمترین دمای روز
                </span>
                <span className="font-bold">علامت − یعنی زیر صفر</span>
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-3 text-[10px] text-muted-foreground">
          * داده‌های آب‌وهوا تقریبی و نمایشی هستند. قبل از سفر، پیش‌بینی رسمی را بررسی کنید.
        </p>
      </section>
    </ScrollReveal>
  );
}
