"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stat card for the Live Trip dashboard — spec §3 layout:
 *   📍 موقعیت · ⛰ ارتفاع · 🥾 فاصله · 🌡 دما
 *
 * v2: stronger shadow, semantic right-border accent, larger value type.
 */
export function LiveStatCard({
  icon: Icon,
  emoji,
  label,
  value,
  hint,
  tone = "default",
  delay = 0,
}: {
  icon?: LucideIcon;
  emoji?: string;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "live" | "warning";
  delay?: number;
}) {
  const accent =
    tone === "live"
      ? "border-r-red-500"
      : tone === "warning"
        ? "border-r-sunset"
        : "border-r-emerald";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -2 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-r-2 bg-card p-4 shadow-sm ring-1 ring-black/[0.02] transition hover:shadow-md",
        tone === "live" && "bg-red-500/5",
        tone === "warning" && "bg-sunset/5",
        accent,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-xl shadow-sm",
              tone === "live"
                ? "bg-red-500/15 text-red-600"
                : tone === "warning"
                  ? "bg-sunset/15 text-sunset"
                  : "bg-emerald/10 text-emerald",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
        {emoji && <span className="text-base" aria-hidden>{emoji}</span>}
        <span className="text-[11px] font-bold text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-2.5 text-xl font-black leading-tight">{value}</div>
      {hint && <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>}
      {tone === "live" && (
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
          LIVE
        </span>
      )}
    </motion.div>
  );
}

