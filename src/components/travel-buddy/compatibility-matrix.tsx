"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Grid3x3, List, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuddyCandidateCard } from "./buddy-candidate-card";
import type { TravelBuddyCandidate } from "@/types/travel-buddy";
import type { TravelDNAScores } from "@/types/dna";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Compatibility Matrix view — Travel Buddy enhancement (spec §5).
 *
 * An alternative to the card grid that shows all candidates in a matrix
 * table where each row is a candidate and each column is a DNA dimension.
 * Cells are color-coded by alignment (aligned/complementary/different).
 *
 * This gives a quick at-a-glance comparison when there are many candidates.
 *
 * Toggle button switches between "grid" (cards) and "matrix" (table) views.
 */

type Dimension = keyof TravelDNAScores;

const DIM_HEADERS: { key: Dimension; label: string; emoji: string }[] = [
  { key: "explorer", label: "اکسپلورر", emoji: "🔥" },
  { key: "adventurer", label: "ماجراجو", emoji: "🏔️" },
  { key: "social", label: "اجتماعی", emoji: "👥" },
  { key: "natureLover", label: "طبیعت", emoji: "🌿" },
];

function cellTone(diff: number): { bg: string; text: string; label: string } {
  const d = Math.abs(diff);
  if (d <= 10) {
    return { bg: "bg-emerald/15", text: "text-emerald", label: "هم‌سو" };
  }
  if (d <= 25) {
    return { bg: "bg-gold/15", text: "text-gold", label: "مکمل" };
  }
  return { bg: "bg-sunset/15", text: "text-sunset", label: "متفاوت" };
}

export function CompatibilityMatrix({
  candidates,
  myDna,
  onCardClick,
  compareSelected,
  onToggleCompare,
}: {
  candidates: TravelBuddyCandidate[];
  myDna: TravelDNAScores;
  onCardClick?: (c: TravelBuddyCandidate) => void;
  compareSelected?: Set<string>;
  onToggleCompare?: (userId: string) => void;
}) {
  const [view, setView] = React.useState<"grid" | "matrix">("grid");

  if (candidates.length === 0) return null;

  return (
    <div>
      {/* view toggle */}
      <div className="mb-3 flex items-center justify-end gap-1.5">
        <span className="text-[10px] text-muted-foreground">نمایش:</span>
        <div className="flex rounded-full border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full transition",
              view === "grid"
                ? "bg-emerald text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
            aria-label="نمایش کارت"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setView("matrix")}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full transition",
              view === "matrix"
                ? "bg-emerald text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
            aria-label="نمایش ماتریس"
          >
            <Grid3x3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c, i) => (
            <BuddyCandidateCard
              key={c.userId}
              candidate={c}
              index={i}
              myDna={myDna}
              onMatched={onCardClick}
              compareSelected={compareSelected?.has(c.userId) ?? false}
              onToggleCompare={onToggleCompare}
            />
          ))}
        </div>
      ) : (
        <CompatibilityTable candidates={candidates} myDna={myDna} onRowClick={onCardClick} />
      )}
    </div>
  );
}

function CompatibilityTable({
  candidates,
  myDna,
  onRowClick,
}: {
  candidates: TravelBuddyCandidate[];
  myDna: TravelDNAScores;
  onRowClick?: (c: TravelBuddyCandidate) => void;
}) {
  // Sort by matchScore desc
  const sorted = [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-3xl border bg-card shadow-sm ring-1 ring-black/[0.02]"
    >
      {/* header row */}
      <div className="grid grid-cols-[1fr_repeat(4,minmax(56px,1fr))_minmax(64px,1fr)] gap-1 border-b bg-muted/40 p-2 text-[9px] font-bold text-muted-foreground sm:text-[10px]">
        <div className="px-1">هم‌سفر</div>
        {DIM_HEADERS.map((h) => (
          <div key={h.key} className="text-center">
            <span className="inline-block">{h.emoji}</span>
            <span className="hidden sm:inline"> {h.label}</span>
          </div>
        ))}
        <div className="text-center">
          <ArrowUpDown className="mx-auto h-2.5 w-2.5" />
          تطابق
        </div>
      </div>

      {/* data rows */}
      <div className="divide-y divide-border/40">
        {sorted.map((c, i) => {
          const tone =
            c.matchScore >= 85
              ? "text-emerald"
              : c.matchScore >= 70
                ? "text-gold"
                : "text-muted-foreground";
          return (
            <motion.button
              key={c.userId}
              type="button"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              onClick={() => onRowClick?.(c)}
              className="grid w-full grid-cols-[1fr_repeat(4,minmax(56px,1fr))_minmax(64px,1fr)] items-center gap-1 p-2 text-right transition hover:bg-muted/30"
            >
              {/* name cell */}
              <div className="flex items-center gap-1.5 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                <span className="truncate text-[11px] font-bold">{c.name}</span>
              </div>
              {/* dimension cells */}
              {DIM_HEADERS.map((h) => {
                const mine = myDna[h.key];
                const theirs = c.dna[h.key];
                const diff = mine - theirs;
                const tone = cellTone(diff);
                return (
                  <div
                    key={h.key}
                    className={cn(
                      "flex flex-col items-center rounded-lg py-1",
                      tone.bg,
                    )}
                  >
                    <span className={cn("text-[11px] font-black", tone.text)}>
                      {toFa(theirs)}
                    </span>
                    <span className={cn("text-[8px] font-bold", tone.text)}>
                      {tone.label}
                    </span>
                  </div>
                );
              })}
              {/* match score cell */}
              <div className="text-center">
                <span className={cn("text-base font-black", tone)}>
                  {toFa(c.matchScore)}٪
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* legend */}
      <div className="flex items-center justify-center gap-3 border-t bg-muted/30 px-2 py-1.5 text-[9px] font-bold text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald/60" />
          هم‌سو (≤۱۰)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gold/60" />
          مکمل (≤۲۵)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sunset/60" />
          متفاوت (&gt;۲۵)
        </span>
      </div>
    </motion.div>
  );
}
