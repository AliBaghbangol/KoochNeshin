"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { TravelDNAScores } from "@/types/dna";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * DNA Radar Chart — Travel Buddy match visualization (spec §5 enhancement).
 *
 * Shows two overlaid polygons: the current user's DNA scores and the
 * candidate's DNA scores, across 4 axes (explorer, adventurer, social,
 * natureLover). Helps the user instantly see where they overlap and where
 * they differ.
 *
 * Pure visualization — no logic. The actual match score is computed in
 * `compute-match-score.ts`.
 */

const AXES: { key: keyof TravelDNAScores; label: string; emoji: string }[] = [
  { key: "explorer", label: "اکسپلورر", emoji: "🔥" },
  { key: "adventurer", label: "ماجراجو", emoji: "🏔️" },
  { key: "social", label: "اجتماعی", emoji: "👥" },
  { key: "natureLover", label: "طبیعت‌دوست", emoji: "🌿" },
];

export function DnaRadarChart({
  myDna,
  theirDna,
  matchScore,
  compact = false,
}: {
  myDna: TravelDNAScores;
  theirDna: TravelDNAScores;
  matchScore: number;
  compact?: boolean;
}) {
  const data = AXES.map((axis) => ({
    axis: axis.label,
    emoji: axis.emoji,
    من: myDna[axis.key],
    او: theirDna[axis.key],
  }));

  const tone =
    matchScore >= 85
      ? { ring: "text-emerald", bg: "bg-emerald/10", label: "تطابق عالی" }
      : matchScore >= 70
        ? { ring: "text-gold", bg: "bg-gold/10", label: "تطابق خوب" }
        : { ring: "text-muted-foreground", bg: "bg-muted", label: "تطابق متوسط" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]",
        compact && "p-3",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald/10 text-emerald">
            <span className="text-sm" aria-hidden>
              🧬
            </span>
          </span>
          <h3 className="text-sm font-bold">نقشه DNA تطابق</h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            tone.bg,
            tone.ring,
          )}
        >
          {toFa(matchScore)}٪ {tone.label}
        </span>
      </div>

      <div className={cn("relative", compact ? "h-44" : "h-56")}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 10, fill: "currentColor", fillOpacity: 0.7 }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={false}
              axisLine={false}
              tickCount={5}
            />
            <Radar
              name="من"
              dataKey="من"
              stroke="#10b981"
              strokeWidth={2}
              fill="#10b981"
              fillOpacity={0.15}
              isAnimationActive
            />
            <Radar
              name="او"
              dataKey="او"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 2"
              fill="#f59e0b"
              fillOpacity={0.1}
              isAnimationActive
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] font-bold">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
          من
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-gold border-dashed bg-gold/20" />
          هم‌سفر
        </span>
      </div>
    </motion.div>
  );
}
