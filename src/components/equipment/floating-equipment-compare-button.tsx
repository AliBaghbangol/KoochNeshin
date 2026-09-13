"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, ChevronUp } from "lucide-react";
import { useNav } from "@/store/nav-store";
import { useCompare } from "@/store/compare-store";
import { useEquipmentCompare } from "@/store/equipment-compare-store";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Floating equipment-compare button — rendered globally in AppShell (next to
 * the tours FloatingCompareButton) so it appears on every page whenever the
 * user has at least one product selected for comparison — including the home
 * page's popular-equipment cards, which previously had no way to open the
 * compare drawer.
 *
 * - Fixed to bottom-center; when the tours compare button is also visible it
 *   automatically stacks above it instead of overlapping.
 * - Spring entrance / exit animation
 * - Shows "مقایسه تجهیزات (X)" where X is the count of selected products
 * - Hidden when the equipment compare drawer is already open
 */
export function FloatingEquipmentCompareButton() {
  const setEquipCompareOpen = useNav((s) => s.setEquipCompareOpen);
  const equipCompareOpen = useNav((s) => s.equipCompareOpen);
  const count = useEquipmentCompare((s) => s.productIds.length);

  // Tours button visibility (same conditions as FloatingCompareButton) so we
  // can stack vertically instead of overlapping at bottom-center.
  const tourCount = useCompare((s) => s.tourIds.length);
  const compareOpen = useNav((s) => s.compareOpen);
  const toursVisible = tourCount > 0 && !compareOpen;

  const show = count > 0 && !equipCompareOpen;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          key="floating-equipment-compare"
          type="button"
          initial={{ y: 80, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={() => setEquipCompareOpen(true)}
          aria-label={`مقایسه تجهیزات (${toFa(count)} تجهیز انتخاب شده)`}
          className={cn(
            "fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-sunset/40 bg-sunset px-5 py-3 text-cream shadow-2xl transition hover:bg-sunset-dark",
            toursVisible
              ? "bottom-[7.25rem] max-lg:bottom-[calc(10rem+env(safe-area-inset-bottom))]"
              : "bottom-6 max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
          )}
        >
          <div className="relative grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white">
            <GitCompare className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1 text-[10px] font-bold text-cream">
              {/* Micro-interaction: pop the badge when count changes */}
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
              مقایسه تجهیزات ({toFa(count)})
            </p>
            <p className="text-[10px] text-cream/80">
              {count >= 2
                ? "آماده مقایسه — کلیک کنید"
                : "یک تجهیز دیگر اضافه کنید"}
            </p>
          </div>
          <ChevronUp className="h-4 w-4 text-white" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
