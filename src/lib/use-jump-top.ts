"use client";

import { useEffect } from "react";

/**
 * EVERY page opens from its very top — the same proven fix as the tour
 * detail page (user report: sidebar/pages look like they don't start at
 * the top and you had to scroll to reach them).
 *
 * Two things used to fight the reset:
 *  1. A client navigation from a long/scrolled page can keep the previous
 *     scroll offset until the new route finishes rendering (Suspense) —
 *     and scroll-anchoring then drags the position even lower as real
 *     content grows, so the user landed mid-page.
 *  2. globals.css sets `html { scroll-behavior: smooth }` — so even a
 *     scrollTo(0,0) ANIMATED instead of jumping.
 *
 * Force an INSTANT jump by briefly overriding the CSS behavior, and
 * re-assert over the first frames — including right after the
 * skeleton → content swap. `dep` (e.g. an id) re-runs the guard when it
 * changes so hopping between items re-opens at the top.
 */
export function useJumpTop(dep?: string) {
  useEffect(() => {
    const jumpTop = () => {
      const root = document.documentElement;
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      root.style.scrollBehavior = prev;
    };
    jumpTop();
    const raf = requestAnimationFrame(jumpTop);
    const timers = [120, 400].map((t) => window.setTimeout(jumpTop, t));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [dep]);
}
