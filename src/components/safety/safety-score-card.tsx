"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Info } from "lucide-react";
import type { Tour } from "@/types";
import {
  computeSafetyScore,
  SAFETY_DIMENSION_META,
  safetyScoreTone,
} from "@/lib/safety/compute-safety-score";
import { toFa } from "@/lib/format";
import { track as trackEvent } from "@/lib/analytics/track";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * 🛡 کارت امتیاز ایمنی سفر — spec §4.
 *
 * نمایشی شفاف از ۶ بُعد ایمنی تور. قرار است کنار Fit Score در
 * `tour-detail-view` بنشیند تا کاربر هم «مناسب بودن» و هم «امن بودن»
 * تور را با هم ببیند (Killer Loop §8).
 *
 * پیام حقوقی: این کارت هرگز نباید القا کند که سفر ۱۰۰٪ بی‌خطر است —
 * زیر کارت همیشه یک یادآوری درباره‌ی تماس با اورژانس ۱۱۵ هست.
 */
export function SafetyScoreCard({ tour }: { tour: Tour }) {
  const { score, breakdown } = React.useMemo(
    () => computeSafetyScore(tour),
    [tour],
  );
  const tone = safetyScoreTone(score);

  React.useEffect(() => {
    trackEvent("safety_score_viewed", { tourId: tour.id, score });
  }, [tour.id, score]);

  const circumference = 2 * Math.PI * 32;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-sm ring-1 ring-black/[0.02]"
      aria-label="امتیاز ایمنی سفر"
    >
      {/* subtle decorative gradient */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-40",
          tone.bg,
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid h-12 w-12 place-items-center rounded-2xl",
              tone.bg,
              tone.text,
            )}
          >
            {score >= 80 ? (
              <ShieldCheck className="h-6 w-6" aria-hidden />
            ) : (
              <ShieldAlert className="h-6 w-6" aria-hidden />
            )}
          </span>
          <div>
            <h3 className="text-base font-extrabold">امتیاز ایمنی سفر</h3>
            <p className="text-[11px] text-muted-foreground">
              ارزیابی شفاف ۶ بُعد ایمنی این تور
            </p>
          </div>
        </div>

        <div className="relative grid h-20 w-20 place-items-center">
          <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              strokeWidth="6"
              className="stroke-muted"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={tone.ring}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{
                strokeDashoffset: circumference * (1 - score / 100),
              }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </svg>
          <div className="text-center">
            <div className="text-lg font-black leading-none">
              {toFa(score)}
            </div>
            <div className="mt-0.5 text-[9px] text-muted-foreground">
              از {toFa(100)}
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(
          Object.keys(SAFETY_DIMENSION_META) as (keyof typeof SAFETY_DIMENSION_META)[]
        ).map((key, i) => {
          const v = breakdown[key];
          const meta = SAFETY_DIMENSION_META[key];
          const ok = v >= 75;
          return (
            <motion.li
              key={key}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              className={cn(
                "relative flex items-center gap-2.5 overflow-hidden rounded-xl border-r-2 bg-card px-3 py-2.5 shadow-sm transition hover:shadow-md",
                ok ? "border-r-emerald" : "border-r-sunset",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                  ok ? "bg-emerald/15 text-emerald" : "bg-sunset/15 text-sunset",
                )}
                aria-hidden
              >
                {ok ? "✓" : "!"}
              </span>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-1 cursor-help text-xs font-semibold">
                      {meta.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <p className="text-[11px] leading-4">{meta.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-[11px] font-extrabold text-muted-foreground">
                {toFa(v)}٪
              </span>
            </motion.li>
          );
        })}
      </ul>

      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-[11px] font-bold",
          tone.bg,
          tone.text,
        )}
      >
        <span>وضعیت کلی</span>
        <span>{tone.label}</span>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        این امتیاز یک ارزیابی کمک‌کننده است و نجات را تضمین نمی‌کند. در شرایط
        اضطراری واقعی، حتماً با اورژانس (۱۱۵) نیز تماس بگیرید.
      </p>
    </motion.section>
  );
}
