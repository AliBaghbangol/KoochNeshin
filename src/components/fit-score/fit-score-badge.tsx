"use client";

import { Target } from "lucide-react";
import { toFa } from "@/lib/format";
import { useTourFitScore } from "@/data/use-tour-fit-score";
import type { Tour } from "@/types";

/**
 * نشان کوچک Fit Score روی کارت تور (بخش ۴ سند v19 — قانون طلایی:
 * هرگز به‌عنوان امتیاز قطعی نمایش داده نمی‌شود؛ فقط با DNA و با زیرنویس/تولتیپ
 * «بر اساس ترجیحات فعلی شما»).
 * اگر کاربر DNA ندارد، نشان مخفی می‌شود (Empty state فقط در صفحه تور).
 */
export function FitScoreBadge({ tour }: { tour: Tour }) {
  const { score, hasDNA } = useTourFitScore(tour);
  if (!hasDNA || score === null) return null;

  const tone =
    score >= 85
      ? "border-emerald/40 bg-emerald/90 text-cream"
      : score >= 70
        ? "border-gold/40 bg-gold/90 text-forest"
        : "border-border bg-card/90 text-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-extrabold shadow-sm backdrop-blur-sm ${tone}`}
      title={`متناسب با تو — بر اساس ترجیحات فعلی شما`}
    >
      <Target className="h-3 w-3" aria-hidden />
      {toFa(score)}٪ متناسب با تو
    </span>
  );
}
