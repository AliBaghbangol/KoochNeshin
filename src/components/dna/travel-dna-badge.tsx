"use client";

import { Dna } from "lucide-react";
import { toFa } from "@/lib/format";
import { dominantTrait } from "@/lib/dna/compute-dna";
import type { TravelDNA } from "@/types/dna";

/**
 * نسخه کوچک Travel DNA برای هدر/پروفایل (بخش ۳ سند v19).
 * مثال: 🧬 کاوشگر ۷۸٪
 */
export function TravelDnaBadge({
  dna,
  className,
}: {
  dna: TravelDNA;
  className?: string;
}) {
  const top = dominantTrait(dna.scores);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1 text-xs font-bold text-emerald ${className ?? ""}`}
      title="DNA سفر شما"
    >
      <Dna className="h-3.5 w-3.5" aria-hidden />
      {top.emoji} {top.label} {toFa(top.value)}٪
    </span>
  );
}
