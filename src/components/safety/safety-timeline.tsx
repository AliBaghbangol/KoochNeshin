"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ShieldCheck } from "lucide-react";
import type { SafetyIncident, SafetyIncidentType, SafetyIncidentSeverity } from "@/types/safety";
import { toPersianShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<SafetyIncidentType, string> = {
  medical: "پزشکی",
  weather: "جو",
  equipment: "تجهیزات",
  route: "مسیر",
  other: "سایر",
};

const SEVERITY_LABEL: Record<SafetyIncidentSeverity, string> = {
  low: "خفیف",
  medium: "متوسط",
  high: "جدی",
};

const SEVERITY_DOT: Record<SafetyIncidentSeverity, string> = {
  low: "bg-emerald",
  medium: "bg-gold",
  high: "bg-red-500",
};

const SEVERITY_TONE: Record<SafetyIncidentSeverity, string> = {
  low: "border-emerald/30 bg-emerald/5",
  medium: "border-gold/30 bg-gold/5",
  high: "border-red-500/30 bg-red-500/5",
};

/**
 * Safety timeline — spec §4 (تکه B).
 *
 * Empty state is the happy path: a checkmark shield reassures the user
 * instead of a warning triangle (which felt like an error).
 */
export function SafetyTimeline({ incidents }: { incidents: SafetyIncident[] }) {
  if (incidents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid place-items-center rounded-2xl border border-emerald/30 bg-gradient-to-b from-emerald/5 to-transparent p-8 text-center"
      >
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-emerald/10 text-emerald shadow-sm">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <p className="text-sm font-bold text-emerald">همه‌چیز رو به راه است</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          هیچ رویداد ایمنی ثبت نشده — سفر بدون حادثه پیش می‌رود.
        </p>
      </motion.div>
    );
  }

  const sorted = [...incidents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ol className="relative space-y-3 pr-4">
      <span
        className="absolute right-[5px] top-2 h-[calc(100%-1rem)] w-px bg-border"
        aria-hidden
      />
      <AnimatePresence initial={false}>
        {sorted.map((inc, i) => (
          <motion.li
            key={inc.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="relative"
          >
            <span
              className={cn(
                "absolute -right-[14px] top-3 h-2.5 w-2.5 rounded-full border-2 border-card",
                SEVERITY_DOT[inc.severity],
              )}
              aria-hidden
            />
            <div
              className={cn(
                "rounded-2xl border p-3 shadow-sm",
                SEVERITY_TONE[inc.severity],
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold">
                  {TYPE_LABEL[inc.type]} · {SEVERITY_LABEL[inc.severity]}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] opacity-70">
                  <Clock className="h-3 w-3" />
                  {toPersianShortDate(inc.createdAt)}
                </span>
              </div>
              <p className="text-[12px] leading-5 text-foreground/90">
                {inc.description}
              </p>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

