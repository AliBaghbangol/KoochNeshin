"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, ChevronUp } from "lucide-react";
import { useNav } from "@/store/nav-store";
import { useCompare } from "@/store/compare-store";
import { toFa } from "@/lib/format";

/**
 * Floating compare button — rendered globally in AppShell so it appears on
 * every page whenever the user has at least one tour selected for comparison.
 *
 * - Fixed to bottom-center
 * - Spring entrance / exit animation
 * - Shows "مقایسه تورها (X)" where X is the count of selected tours
 * - Hidden when the compare drawer is already open
 */
export function FloatingCompareButton() {
  const setCompareOpen = useNav((s) => s.setCompareOpen);
  const compareOpen = useNav((s) => s.compareOpen);
  const count = useCompare((s) => s.tourIds.length);

  const show = count > 0 && !compareOpen;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          key="floating-compare"
          type="button"
          initial={{ y: 80, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={() => setCompareOpen(true)}
          aria-label={`مقایسه تورها (${toFa(count)} تور انتخاب شده)`}
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-gold/40 bg-forest/90 px-5 py-3 text-cream shadow-2xl backdrop-blur-md transition hover:bg-forest max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="relative grid h-9 w-9 place-items-center rounded-full bg-gold text-forest">
            <GitCompare className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {/* Micro-interaction (brief §35): pop the badge when count changes */}
              <motion.span
                key={count}
                initial={{ scale: 0.4, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="grid place-items-center"
              >
                {toFa(count)}
              </motion.span>
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold leading-4">
              مقایسه تورها ({toFa(count)})
            </p>
            <p className="text-[10px] text-cream/70">
              {count >= 2
                ? "آماده مقایسه — کلیک کنید"
                : "یک تور دیگر اضافه کنید"}
            </p>
          </div>
          <ChevronUp className="h-4 w-4 text-gold" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
