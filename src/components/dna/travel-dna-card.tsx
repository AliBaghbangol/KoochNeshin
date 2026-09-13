"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Dna, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toFa } from "@/lib/format";
import { dominantTrait } from "@/lib/dna/compute-dna";
import type { TravelDNA } from "@/types/dna";

/**
 * کارت نمایش نتیجه Travel DNA — چهار ویژگی با نوار پیشرفت متحرک
 * (بخش ۳ سند v19 — «Travel DNA / 78% Explorer …»).
 * رنگ‌ها فقط از پالت فعلی پروژه (emerald/gold/sunset) — رنگ اختراع نشده.
 */

const TRAIT_STYLE: Record<
  string,
  { label: string; emoji: string; barClass: string; textClass: string }
> = {
  explorer: {
    label: "کاوشگر",
    emoji: "🧭",
    barClass: "bg-gold",
    textClass: "text-gold",
  },
  adventurer: {
    label: "ماجراجو",
    emoji: "🧗",
    barClass: "bg-sunset",
    textClass: "text-sunset",
  },
  social: {
    label: "اجتماعی",
    emoji: "🤝",
    barClass: "bg-emerald-light",
    textClass: "text-emerald-light",
  },
  natureLover: {
    label: "طبیعت‌دوست",
    emoji: "🌿",
    barClass: "bg-emerald",
    textClass: "text-emerald",
  },
};

export function TravelDnaCard({
  dna,
  onRebuild,
  className,
}: {
  dna: TravelDNA;
  onRebuild?: () => void;
  className?: string;
}) {
  const top = React.useMemo(() => dominantTrait(dna.scores), [dna.scores]);
  const entries = React.useMemo(
    () =>
      (Object.entries(dna.scores) as [string, number][]).sort(
        (a, b) => b[1] - a[1]
      ),
    [dna.scores]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl border bg-card p-5 shadow-sm sm:p-6 ${className ?? ""}`}
    >
      {/* هاله تزئینی */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-emerald/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 h-44 w-44 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
            <Dna className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-extrabold">DNA سفر تو</h3>
            <p className="text-xs text-muted-foreground">
              امضای سفر شما: {top.emoji} {top.label} — {toFa(top.value)}٪
            </p>
          </div>
        </div>
        {onRebuild && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRebuild}
            className="shrink-0 gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            دوباره بساز
          </Button>
        )}
      </div>

      <div className="relative mt-5 space-y-3.5">
        {entries.map(([key, value], i) => {
          const s = TRAIT_STYLE[key];
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold">
                  <span aria-hidden>{s.emoji}</span>
                  {s.label}
                </span>
                <span className={`font-extrabold ${s.textClass}`}>
                  {toFa(value)}٪
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`h-full rounded-full ${s.barClass}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{
                    duration: 0.9,
                    delay: 0.15 + i * 0.12,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="relative mt-4 text-[11px] leading-5 text-muted-foreground">
        این پروفایل برای شخصی‌سازی امتیاز تناسب تورها، کیت تجهیزات و برنامه‌ریز
        هوشمند استفاده می‌شود.
      </p>
    </motion.div>
  );
}
