"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";

/**
 * نشانگر مراحل برنامه‌ریز (بخش ۶ سند v19) — ۶ مرحله + نتیجه.
 */
export function PlannerStepper({
  current,
  labels,
}: {
  current: number; // 0..5 مراحل، 6 = نتیجه
  labels: string[];
}) {
  return (
    <div
      className="custom-scroll -mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={labels.length + 1}
      aria-valuenow={current + 1}
    >
      {labels.map((label, i) => {
        const done = current > i;
        const active = current === i;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "h-0.5 w-4 shrink-0 rounded-full sm:w-6",
                  done || active ? "bg-emerald" : "bg-border"
                )}
              />
            )}
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors",
                done && "border-emerald/30 bg-emerald/10 text-emerald",
                active && "border-emerald bg-emerald text-cream shadow-sm",
                !done && !active && "border-border bg-card text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "grid h-4.5 w-4.5 place-items-center rounded-full text-[9px] font-black",
                  done
                    ? "bg-emerald text-cream"
                    : active
                      ? "bg-cream/20 text-cream"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-2.5 w-2.5" /> : toFa(i + 1)}
              </span>
              <span className="whitespace-nowrap">{label}</span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
