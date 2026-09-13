"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mountain, TrendingUp, MapPin, Calendar } from "lucide-react";
import type { Tour } from "@/types";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Elevation Profile mini-chart — Live Trip enhancement (spec §3).
 *
 * Renders a small SVG line chart showing the elevation profile across
 * the itinerary days, derived from `tour.itinerary[].elevation`. The
 * current day (passed via `currentDay`) is highlighted with a pulsing dot.
 *
 * Interactive: hovering over the chart shows a vertical guide line + a
 * tooltip card with the day's number, title, and elevation.
 */

interface ElevationPoint {
  day: number;
  elevation: number;
  label: string;
}

export function ElevationProfile({
  tour,
  currentDay = 1,
  className,
}: {
  tour: Tour;
  currentDay?: number;
  className?: string;
}) {
  const points: ElevationPoint[] = React.useMemo(() => {
    return tour.itinerary
      .filter((d) => typeof d.elevation === "number")
      .map((d) => ({
        day: d.day,
        elevation: d.elevation as number,
        label: d.title,
      }));
  }, [tour]);

  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  if (points.length < 2) {
    return (
      <div
        className={cn(
          "rounded-3xl border bg-card p-4 text-center text-[11px] text-muted-foreground",
          className,
        )}
      >
        داده‌ی ارتفاع کافی برای این تور موجود نیست.
      </div>
    );
  }

  // SVG dimensions
  const W = 280;
  const H = 80;
  const padX = 16;
  const padY = 10;

  const maxEl = Math.max(...points.map((p) => p.elevation));
  const minEl = Math.min(...points.map((p) => p.elevation));
  const range = maxEl - minEl || 1;

  const xStep = (W - 2 * padX) / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = padX + i * xStep;
    const y = H - padY - ((p.elevation - minEl) / range) * (H - 2 * padY);
    return { x, y, ...p };
  });

  // Build a smooth path with simple line segments
  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  // Filled area path (for gradient fill)
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${H - padY} L ${coords[0].x.toFixed(1)} ${H - padY} Z`;

  const currentCoord = coords.find((c) => c.day === currentDay) ?? coords[0];
  const peakPoint = coords.reduce((a, b) => (a.elevation > b.elevation ? a : b));
  const activeIdx = hoverIdx ?? coords.findIndex((c) => c.day === currentDay);
  const activeCoord = coords[activeIdx] ?? currentCoord;

  // Tooltip positioning — keep it inside the card horizontally, and
  // auto-flip above/below the data point based on where the point sits.
  // If the point is in the top half of the chart (y < H/2), the tooltip
  // renders BELOW the point (so it doesn't overflow the card top).
  // Otherwise it renders ABOVE the point (default).
  const tooltipX = Math.max(
    60,
    Math.min(W - 60, activeCoord.x),
  );
  const tooltipAbove = activeCoord.y > H / 2;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    findNearest(x);
  }

  function handleTouchMove(e: React.TouchEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || e.touches.length === 0) return;
    e.preventDefault(); // prevent page scroll while dragging on chart
    const rect = svg.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * W;
    findNearest(x);
  }

  function findNearest(x: number) {
    let nearest = 0;
    let minDist = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - x);
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/10 text-emerald">
            <Mountain className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold">پروفایل ارتفاع</h3>
            <p className="text-[10px] text-muted-foreground">
              روز {toFa(currentDay)} از {toFa(points.length)}
            </p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCoord.day}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="text-left"
          >
            <div className="text-base font-black text-emerald">
              {toFa(activeCoord.elevation)}
              <span className="text-[10px] font-normal text-muted-foreground">م</span>
            </div>
            <div className="text-[9px] text-muted-foreground">
              {hoverIdx !== null ? `روز ${toFa(activeCoord.day)}` : "ارتفاع فعلی"}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair touch-none"
          preserveAspectRatio="none"
          style={{ height: H }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="elev-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="elev-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {/* baseline grid */}
          <line
            x1={padX}
            y1={H - padY}
            x2={W - padX}
            y2={H - padY}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="2 2"
          />

          {/* filled area */}
          <path d={areaPath} fill="url(#elev-grad)" />

          {/* line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="url(#elev-line)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* peak marker */}
          <motion.circle
            cx={peakPoint.x}
            cy={peakPoint.y}
            r={3}
            fill="#f59e0b"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 }}
          />

          {/* current position pulsing dot — only when not hovering */}
          {hoverIdx === null && (
            <>
              <motion.circle
                cx={currentCoord.x}
                cy={currentCoord.y}
                r={5}
                fill="#10b981"
                stroke="white"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              />
              <motion.circle
                cx={currentCoord.x}
                cy={currentCoord.y}
                r={5}
                fill="none"
                stroke="#10b981"
                strokeWidth={2}
                animate={{ r: [5, 12], opacity: [0.7, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
            </>
          )}

          {/* hover guide line + dot */}
          <AnimatePresence>
            {hoverIdx !== null && (
              <>
                <motion.line
                  x1={activeCoord.x}
                  y1={padY}
                  x2={activeCoord.x}
                  y2={H - padY}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                />
                <motion.circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r={5}
                  fill="#10b981"
                  stroke="white"
                  strokeWidth={2}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  exit={{ scale: 0 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* day markers */}
          {coords.map((c) => (
            <circle
              key={c.day}
              cx={c.x}
              cy={c.y}
              r={2}
              fill={c.day === currentDay ? "#10b981" : "currentColor"}
              fillOpacity={c.day === currentDay ? 1 : 0.3}
            />
          ))}

          {/* invisible hit areas for each point */}
          {coords.map((c) => (
            <rect
              key={`hit-${c.day}`}
              x={c.x - xStep / 2}
              y={0}
              width={xStep}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(coords.indexOf(c))}
            />
          ))}
        </svg>

        {/* hover tooltip card — auto-flips above/below the data point */}
        <AnimatePresence>
          {hoverIdx !== null && (
            <motion.div
              initial={{ opacity: 0, y: tooltipAbove ? -6 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: tooltipAbove ? -6 : 6 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border bg-popover px-2.5 py-1.5 text-center shadow-lg",
                // small arrow pointing toward the data point
                tooltipAbove ? "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-popover" : "after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-popover",
              )}
              style={{
                left: `${(tooltipX / W) * 100}%`,
                top: tooltipAbove ? 0 : "auto",
                bottom: tooltipAbove ? "auto" : 0,
              }}
            >
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald">
                <Calendar className="h-2.5 w-2.5" />
                روز {toFa(activeCoord.day)}
              </div>
              <div className="mt-0.5 max-w-[140px] truncate text-[10px] font-semibold">
                {activeCoord.label}
              </div>
              <div className="mt-0.5 text-[11px] font-black text-foreground">
                {toFa(activeCoord.elevation)} متر
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-emerald" />
          روز {toFa(1)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Mountain className="h-3 w-3 text-gold" />
          اوج: {toFa(maxEl)}م
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          روز {toFa(points.length)}
        </span>
      </div>
    </motion.div>
  );
}
