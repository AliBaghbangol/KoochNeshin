"use client";

import * as React from "react";

/**
 * Smart snap-scroll wrapper.
 * - Creates a snap point at the TOP of every direct child section
 * - For sections taller than viewport: also creates intermediate points
 * - Scroll up works correctly — finds nearest point in either direction
 * - Ignores wheel events inside modals/dialogs/drawers
 */
export function SnapScroll({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isAnimating = React.useRef(false);
  const touchStartY = React.useRef(0);
  const touchStartX = React.useRef(0);
  const pointsRef = React.useRef<number[]>([]);

  // Snap-scroll is a desktop-only experience. On touch/mobile viewports users
  // get natural free scrolling (per the responsive brief) — desktop unchanged.
  const isDesktopViewport = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(max-width: 1023px)").matches) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return true;
  }, []);

  const buildSnapPoints = React.useCallback((): number[] => {
    const container = containerRef.current;
    if (!container) return [];

    const sections = Array.from(container.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement
    );
    const viewportH = window.innerHeight;
    const points: number[] = [];

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;

      // Always add section top as a snap point
      if (points.length === 0 || points[points.length - 1] !== top) {
        points.push(top);
      }

      // For sections taller than viewport, add intermediate + bottom snap points
      if (height > viewportH) {
        const numSteps = Math.floor(height / viewportH);
        for (let i = 1; i < numSteps; i++) {
          const pt = top + i * viewportH;
          if (pt < top + height - viewportH + 10) {
            points.push(pt);
          }
        }
        // Add bottom snap point (where section bottom aligns with viewport bottom)
        const lastPt = top + height - viewportH;
        if (lastPt > (points[points.length - 1] || 0) + 5) {
          points.push(lastPt);
        }
      }
    });

    return [...new Set(points)].sort((a, b) => a - b);
  }, []);

  // Find nearest snap point index — direction-aware
  const getNearestIndex = React.useCallback(
    (direction: "up" | "down"): number => {
      const points = pointsRef.current;
      if (points.length === 0) return 0;

      const scrollY = window.scrollY;

      if (direction === "down") {
        // Find first point that's significantly below current scroll
        for (let i = 0; i < points.length; i++) {
          if (points[i] > scrollY + 5) {
            return i;
          }
        }
        return points.length - 1;
      } else {
        // Find last point that's significantly above current scroll
        let idx = 0;
        for (let i = 0; i < points.length; i++) {
          if (points[i] < scrollY - 5) {
            idx = i;
          } else {
            break;
          }
        }
        return idx;
      }
    },
    []
  );

  const snapTo = React.useCallback((idx: number) => {
    const points = pointsRef.current;
    if (idx < 0 || idx >= points.length) return;
    if (isAnimating.current) return;

    isAnimating.current = true;
    window.scrollTo({
      top: points[idx],
      behavior: "smooth",
    });

    window.setTimeout(() => {
      isAnimating.current = false;
    }, 400);
  }, []);

  React.useEffect(() => {
    if (!isDesktopViewport()) return;

    // Initial build
    pointsRef.current = buildSnapPoints();

    // Recalc after content loads
    const t1 = setTimeout(() => {
      pointsRef.current = buildSnapPoints();
    }, 1000);
    const t2 = setTimeout(() => {
      pointsRef.current = buildSnapPoints();
    }, 3000);

    // Periodic recalculation so late-mounted sections (e.g. RecentlyViewed
    // that only appears after a user visits a tour) don't leave stale snap
    // points. Recompute every 5s for up to ~30s, then stop.
    let recalcCount = 0;
    const recalcInterval = setInterval(() => {
      pointsRef.current = buildSnapPoints();
      recalcCount++;
      if (recalcCount >= 6) clearInterval(recalcInterval);
    }, 5000);

    const onResize = () => {
      pointsRef.current = buildSnapPoints();
    };
    window.addEventListener("resize", onResize);

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;

      // Don't intercept inside modals/dialogs/drawers
      const target = e.target as HTMLElement | null;
      if (target?.closest(
        '[role="dialog"], [data-radix-dialog-content], [data-radix-popper-content-wrapper], [data-scrollable], .custom-scroll, [data-vaul-drawer]'
      )) {
        return;
      }

      const points = pointsRef.current;
      if (points.length === 0) return;

      const scrollY = window.scrollY;
      const lastPoint = points[points.length - 1];

      // If at or past the last snap point, allow free scroll to reach content below (like footer)
      if (scrollY >= lastPoint - 10 && e.deltaY > 0) {
        return; // let native scroll handle it
      }
      // If at the very top and scrolling up, let native scroll handle it
      if (scrollY <= 5 && e.deltaY < 0) {
        return;
      }

      e.preventDefault();
      if (isAnimating.current) return;

      const direction = e.deltaY > 0 ? "down" : "up";
      const idx = getNearestIndex(direction);
      snapTo(idx);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      const deltaX = touchStartX.current - e.changedTouches[0].clientX;

      if (Math.abs(deltaX) > Math.abs(deltaY)) return;
      if (Math.abs(deltaY) < 30) return;
      if (isAnimating.current) return;

      const points = pointsRef.current;
      if (points.length === 0) return;

      const scrollY = window.scrollY;
      const lastPoint = points[points.length - 1];

      // Allow free scroll at edges
      if (scrollY >= lastPoint - 10 && deltaY > 0) return;
      if (scrollY <= 5 && deltaY < 0) return;

      const direction = deltaY > 0 ? "down" : "up";
      const idx = getNearestIndex(direction);
      snapTo(idx);
    };

    const onKey = (e: KeyboardEvent) => {
      if (isAnimating.current) return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        const idx = getNearestIndex("down");
        snapTo(idx);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        const idx = getNearestIndex("up");
        snapTo(idx);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(recalcInterval);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [buildSnapPoints, getNearestIndex, snapTo, isDesktopViewport]);

  return <div ref={containerRef}>{children}</div>;
}
