"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Sparkles, ChevronDown } from "lucide-react";
import type { TravelDNAScores } from "@/types/dna";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Lazy wrapper around the DNA Radar Chart so the recharts bundle is only
 * loaded when the user actually expands a candidate card. Falls back to
 * a small skeleton while loading.
 */

const DnaRadarChartLazy = dynamic(
  () => import("./dna-radar-chart").then((m) => m.DnaRadarChart),
  {
    loading: () => (
      <div className="h-44 animate-pulse rounded-3xl border bg-card" />
    ),
    ssr: false,
  },
);

const MatchInsightsLazy = dynamic(
  () => import("./match-insights").then((m) => m.MatchInsights),
  {
    loading: () => (
      <div className="mt-2 h-24 animate-pulse rounded-2xl border bg-card" />
    ),
    ssr: false,
  },
);

interface Props {
  myDna: TravelDNAScores;
  theirDna: TravelDNAScores;
  matchScore: number;
  candidateName?: string;
}

/**
 * Expandable wrapper that mounts the (heavy) recharts chart only after the
 * user clicks the toggle. Re-mounts it each time it expands so React can
 * GC the chart when collapsed.
 */
export function LazyDnaRadarChart({ myDna, theirDna, matchScore, candidateName }: Props) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border bg-background/40 px-3 py-2 text-[11px] font-bold text-emerald transition hover:bg-emerald/5"
      >
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          {expanded ? "بستن نقشه DNA" : "مشاهده نقشه DNA تطابق"}
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <DnaRadarChartLazy
              myDna={myDna}
              theirDna={theirDna}
              matchScore={matchScore}
              compact
            />
            <MatchInsightsLazy
              myDna={myDna}
              theirDna={theirDna}
              matchScore={matchScore}
              candidateName={candidateName}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
