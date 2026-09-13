"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompare,
  X,
  Star,
  Users,
  Trophy,
  Check,
  Sparkles,
  Crown,
  Heart,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TravelBuddyCandidate } from "@/types/travel-buddy";
import type { TravelDNAScores } from "@/types/dna";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Compare Candidates — Travel Buddy enhancement (spec §5).
 *
 * Lets the user select 2-3 candidates and see them side-by-side in a
 * comparison dialog. Each candidate appears as a column; rows compare
 * their attributes (match score, rating, trips, DNA scores).
 *
 * The best value in each row is highlighted with a crown/trophy icon.
 *
 * Selection: each BuddyCandidateCard gets a "compare" checkbox. When
 * 2+ are selected, a floating "Compare" button appears. Clicking it
 * opens this dialog.
 */

type Dimension = keyof TravelDNAScores;

const DIM_LABELS: Record<Dimension, { label: string; emoji: string }> = {
  explorer: { label: "اکسپلورر", emoji: "🔥" },
  adventurer: { label: "ماجراجو", emoji: "🏔️" },
  social: { label: "اجتماعی", emoji: "👥" },
  natureLover: { label: "طبیعت", emoji: "🌿" },
};

const DIMS = Object.keys(DIM_LABELS) as Dimension[];

export function CompareCandidatesDialog({
  candidates,
  open,
  onOpenChange,
}: {
  candidates: TravelBuddyCandidate[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (candidates.length < 2) return null;

  // Find best value for each row
  const bestMatch = candidates.reduce((a, b) =>
    a.matchScore > b.matchScore ? a : b,
  );
  const bestRating = candidates.reduce((a, b) =>
    a.rating > b.rating ? a : b,
  );
  const bestTrips = candidates.reduce((a, b) =>
    a.tripsCount > b.tripsCount ? a : b,
  );
  const bestDims: Record<Dimension, TravelBuddyCandidate> = {} as Record<
    Dimension,
    TravelBuddyCandidate
  >;
  DIMS.forEach((d) => {
    bestDims[d] = candidates.reduce((a, b) =>
      a.dna[d] > b.dna[d] ? a : b,
    );
  });

  const rows: {
    label: string;
    emoji: string;
    render: (c: TravelBuddyCandidate) => React.ReactNode;
    isBest: (c: TravelBuddyCandidate) => boolean;
  }[] = [
    {
      label: "امتیاز تطابق",
      emoji: "🎯",
      render: (c) => (
        <span className={cn("text-base font-black", c === bestMatch ? "text-emerald" : "")}>
          {toFa(c.matchScore)}٪
        </span>
      ),
      isBest: (c) => c === bestMatch,
    },
    {
      label: "امتیاز لیدر",
      emoji: "⭐",
      render: (c) => (
        <span className={cn("text-sm font-bold", c === bestRating ? "text-gold" : "")}>
          {toFa(c.rating.toFixed(1))}
        </span>
      ),
      isBest: (c) => c === bestRating,
    },
    {
      label: "تعداد سفر",
      emoji: "🧳",
      render: (c) => (
        <span className={cn("text-sm font-bold", c === bestTrips ? "text-emerald" : "")}>
          {toFa(c.tripsCount)} سفر
        </span>
      ),
      isBest: (c) => c === bestTrips,
    },
    ...DIMS.map((d) => ({
      label: DIM_LABELS[d].label,
      emoji: DIM_LABELS[d].emoji,
      render: (c: TravelBuddyCandidate) => (
        <div className="flex items-center gap-1">
          <span className={cn("text-sm font-bold", c === bestDims[d] ? "text-emerald" : "")}>
            {toFa(c.dna[d])}
          </span>
          {/* mini bar */}
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                c === bestDims[d] ? "bg-emerald" : "bg-muted-foreground/40",
              )}
              style={{ width: `${c.dna[d]}%` }}
            />
          </div>
        </div>
      ),
      isBest: (c: TravelBuddyCandidate) => c === bestDims[d],
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald/10 text-emerald">
              <GitCompare className="h-5 w-5" />
            </span>
            مقایسه هم‌سفرها
          </DialogTitle>
          <DialogDescription>
            {toFa(candidates.length)} هم‌سفر در حال مقایسه هستند — بهترین مقدار هر ردیف مشخص شده
          </DialogDescription>
        </DialogHeader>

        {/* comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* header row — candidate avatars + names */}
            <thead>
              <tr>
                <th className="sticky right-0 bg-card p-2 text-right text-[10px] font-bold text-muted-foreground">
                  معیار
                </th>
                {candidates.map((c, i) => (
                  <th key={c.userId} className="min-w-[120px] p-2 text-center">
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-background">
                        <AvatarImage src={c.avatar} alt={c.name} />
                        <AvatarFallback>{c.name.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-bold">{c.name}</span>
                      <div className="flex flex-wrap justify-center gap-0.5">
                        {c.highlights.slice(0, 2).map((h) => (
                          <span
                            key={h}
                            className="rounded-full bg-emerald/10 px-1 py-0.5 text-[8px] font-bold text-emerald"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={row.label}
                  className={cn(
                    "border-t border-border/40",
                    ri % 2 === 0 ? "bg-background/30" : "",
                  )}
                >
                  <td className="sticky right-0 bg-card p-2 text-right text-[11px] font-bold text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>{row.emoji}</span>
                      {row.label}
                    </span>
                  </td>
                  {candidates.map((c) => (
                    <td key={c.userId} className="p-2 text-center">
                      <div className="relative inline-flex items-center justify-center">
                        {row.isBest(c) && (
                          <motion.span
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="absolute -top-2 -left-2 grid h-4 w-4 place-items-center rounded-full bg-gold text-white"
                            aria-label="بهترین"
                          >
                            <Crown className="h-2.5 w-2.5 fill-white" />
                          </motion.span>
                        )}
                        {row.render(c)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* winner summary */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 rounded-2xl border border-emerald/30 bg-gradient-to-l from-emerald/10 to-transparent p-3"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/15 text-emerald">
            <Trophy className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-emerald">
              بهترین تطابق کلی: {bestMatch.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              با امتیاز {toFa(bestMatch.matchScore)}٪ — {toFa(bestMatch.tripsCount)} سفر تجربه
            </p>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-br from-emerald to-emerald-dark gap-1.5"
          >
            <Heart className="h-3.5 w-3.5" />
            درخواست از {bestMatch.name.split(" ")[0]}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Floating compare bar — appears when 2+ candidates are selected.
 * Shows the count + a "Compare" button.
 */
export function CompareFloatingBar({
  count,
  onCompare,
  onClear,
}: {
  count: number;
  onCompare: () => void;
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {count >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="sticky bottom-24 z-[90] mx-auto flex w-fit items-center gap-3 rounded-full border bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur-md"
        >
          <span className="flex items-center gap-1.5 text-[12px] font-bold">
            <GitCompare className="h-4 w-4 text-emerald" />
            {toFa(count)} هم‌سفر انتخاب‌شده
          </span>
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-emerald text-white"
            onClick={onCompare}
          >
            <Sparkles className="h-3.5 w-3.5" />
            مقایسه
          </Button>
          <button
            type="button"
            onClick={onClear}
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
            aria-label="پاک کردن انتخاب‌ها"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Per-card compare checkbox — rendered on each BuddyCandidateCard.
 */
export function CompareCheckbox({
  selected,
  onToggle,
}: {
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "absolute left-3 bottom-3 grid h-6 w-6 place-items-center rounded-lg border-2 transition",
        selected
          ? "border-emerald bg-emerald text-white"
          : "border-border bg-card text-transparent hover:border-emerald/40",
      )}
      aria-label={selected ? "حذف از مقایسه" : "افزودن به مقایسه"}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}
