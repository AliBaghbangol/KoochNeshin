"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mountain, AlertTriangle, X, Info, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tour } from "@/types";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Altitude Notification — Live Trip enhancement (spec §3).
 *
 * When the trip's current elevation crosses certain thresholds, shows a
 * dismissible banner with health/safety advice:
 *   - >= 2500m: "altitude zone" — hydrate, watch for symptoms.
 *   - >= 3500m: "high altitude" — slow pace, watch for AMS.
 *   - >= 4500m: "extreme altitude" — acclimatization critical.
 *
 * The notification is keyed by threshold so we only fire it once per
 * threshold per session (avoids re-popping on every render).
 *
 * TODO(backend): backend should track real elevation from GPS and emit
 * a "altitude_threshold_crossed" event; this component would subscribe.
 */

type Threshold = {
  min: number;
  label: string;
  tone: "info" | "warning" | "danger";
  advice: string;
};

const THRESHOLDS: Threshold[] = [
  {
    min: 2500,
    label: "ورود به منطقه‌ی ارتفاعی",
    tone: "info",
    advice: "از الان آب زیاد بنوش. علائم خستگی غیرعادی را جدی بگیر.",
  },
  {
    min: 3500,
    label: "ارتفاع بالا",
    tone: "warning",
    advice: "سرعتت رو کم کن. سردرد و تهوع می‌تونه نشونه‌ی کوچ‌بیماری (AMS) باشه.",
  },
  {
    min: 4500,
    label: "ارتفاع بسیار بالا",
    tone: "danger",
    advice: "سازگاری با ارتفاع حیاتیه. اگر سردرد شدید داری، فوراً به لیدر اطلاع بده.",
  },
];

const TONE_META = {
  info: {
    icon: Info,
    color: "text-emerald",
    bg: "bg-emerald/10",
    border: "border-emerald/30",
    bar: "bg-emerald",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold/30",
    bar: "bg-gold",
  },
  danger: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    bar: "bg-red-500",
  },
} as const;

export function AltitudeNotification({
  tour,
  currentElevation,
}: {
  tour: Tour;
  currentElevation?: number;
}) {
  // Determine mock elevation if not provided
  const elevation =
    currentElevation ??
    (tour.category === "mountain" ? 4200 : tour.category === "desert" ? 200 : 800);

  // Find the highest threshold that elevation has crossed
  const crossedThreshold = React.useMemo(() => {
    let highest: Threshold | null = null;
    for (const t of THRESHOLDS) {
      if (elevation >= t.min) highest = t;
    }
    return highest;
  }, [elevation]);

  // Track which thresholds have been acknowledged by the user.
  const [dismissed, setDismissed] = React.useState<Set<number>>(new Set());

  // When a new (higher) threshold is crossed, clear lower dismissals so the
  // new alert pops. Implementation: only show if `crossedThreshold.min` is
  // not in the dismissed set.
  const show = crossedThreshold !== null && !dismissed.has(crossedThreshold.min);

  function dismiss() {
    if (!crossedThreshold) return;
    setDismissed((prev) => new Set(prev).add(crossedThreshold.min));
  }

  if (!crossedThreshold) return null;

  const tone = TONE_META[crossedThreshold.tone];
  const Icon = tone.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-3xl border shadow-sm"
        >
          {/* left bar accent */}
          <div className={cn("absolute inset-y-0 right-0 w-1", tone.bar)} aria-hidden />

          <div className={cn("flex items-start gap-3 p-4 pr-6", tone.bg, tone.border, "border")}>
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-2xl", tone.bg, tone.color)}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <h3 className={cn("text-sm font-bold", tone.color)}>
                  {crossedThreshold.label}
                </h3>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-card px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                  <Mountain className="h-2.5 w-2.5" />
                  {toFa(elevation)}م
                </span>
              </div>
              <p className="text-[11px] leading-5 text-foreground/85">
                {crossedThreshold.advice}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                  <ArrowUp className="h-2.5 w-2.5" />
                  از ارتفاع {toFa(crossedThreshold.min)}م عبور کردی
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
              aria-label="بستن"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
