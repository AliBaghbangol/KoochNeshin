"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Flag, Mountain, Route, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toFa } from "@/lib/format";
import type { ItineraryDay } from "@/types";
import { cn } from "@/lib/utils";

/**
 * کارت روزهای برنامه سفر (بخش ۶ سند v19) — رندر مستقیم ItineraryDay[]
 * موجود در types/index.ts؛ ساختار جدید اختراع نمی‌شود.
 */
export function ItineraryCard({
  days,
  className,
}: {
  days: ItineraryDay[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {days.map((day, i) => (
        <motion.div
          key={day.day}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.35 }}
          className={cn(
            "relative rounded-2xl border bg-background p-4 pr-5",
            day.highlight && "border-gold/40 bg-gold/5"
          )}
        >
          {/* خط مسیر کوچ */}
          {i < days.length - 1 && (
            <span
              aria-hidden
              className="absolute -bottom-3 right-8 h-3 w-0.5 border-r-2 border-dashed border-gold/50"
            />
          )}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald/10 text-sm font-black text-emerald">
                {toFa(day.day)}
              </span>
              <div>
                <p className="text-sm font-extrabold leading-5">{day.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {day.description}
                </p>
              </div>
            </div>
            {day.highlight && (
              <Badge className="shrink-0 rounded-full bg-gold/15 text-[10px] text-gold">
                <Flag className="h-3 w-3" aria-hidden />
                نقطه اوج
              </Badge>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 pr-11 text-[11px] text-muted-foreground">
            {typeof day.elevation === "number" && day.elevation > 0 && (
              <span className="inline-flex items-center gap-1">
                <Mountain className="h-3 w-3" aria-hidden />
                ارتفاع {toFa(day.elevation)} متر
              </span>
            )}
            {typeof day.distance === "number" && day.distance > 0 && (
              <span className="inline-flex items-center gap-1">
                <Route className="h-3 w-3" aria-hidden />
                {toFa(day.distance)} کیلومتر
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Utensils className="h-3 w-3" aria-hidden />
              {day.meals.join(" · ")}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
