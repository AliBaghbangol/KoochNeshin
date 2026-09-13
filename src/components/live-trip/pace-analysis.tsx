"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, TrendingDown, Gauge, Zap } from "lucide-react";
import type { Tour } from "@/types";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Pace Analysis — Live Trip enhancement (spec §3).
 *
 * Shows a mini area chart of the user's speed (km/h) over the trip's
 * duration, derived from the itinerary's distance per day + a per-day
 * pace factor. The current day is highlighted with a vertical marker.
 *
 * Also shows a "pace trend" indicator: is the user speeding up or slowing
 * down compared to yesterday? This helps the user self-assess their
 * physical performance.
 *
 * Mock data: deterministic from tour.id. TODO(backend): real GPS pace
 * data from the user's watch/phone.
 */

interface PacePoint {
  day: number;
  label: string;
  speed: number; // km/h
  distance: number;
}

export function PaceAnalysis({
  tour,
  currentDay = 1,
  className,
}: {
  tour: Tour;
  currentDay?: number;
  className?: string;
}) {
  const points: PacePoint[] = React.useMemo(() => {
    // Deterministic mock from tour.id — use a closure-based PRNG
    // to avoid reassigning outer variables (React Compiler friendly).
    const makeRng = (id: string) => {
      let s = 0;
      for (let i = 0; i < id.length; i++) {
        s = (s * 31 + id.charCodeAt(i)) | 0;
      }
      return (n: number) => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return (s % n) / n;
      };
    };
    const rand = makeRng(tour.id);

    const basePace =
      tour.category === "mountain" ? 4.0 :
      tour.category === "desert" ? 5.5 :
      tour.category === "forest" ? 4.5 :
      5.0;

    return tour.itinerary
      .filter((d) => typeof d.distance === "number")
      .map((d, i) => {
        // pace varies per day — some days faster, some slower
        const variation = (rand(10) - 5) * 0.3; // -1.5 to +1.5
        const fatigue = i > 0 ? -0.1 * i : 0; // slight slowdown over days
        const speed = Math.max(2, basePace + variation + fatigue);
        return {
          day: d.day,
          label: d.title,
          speed: Math.round(speed * 10) / 10,
          distance: d.distance as number,
        };
      });
  }, [tour]);

  if (points.length < 2) return null;

  // Chart dimensions
  const W = 280;
  const H = 70;
  const padX = 16;
  const padY = 8;

  const maxSpeed = Math.max(...points.map((p) => p.speed));
  const minSpeed = Math.min(...points.map((p) => p.speed));
  const range = maxSpeed - minSpeed || 1;

  const xStep = (W - 2 * padX) / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = padX + i * xStep;
    const y = H - padY - ((p.speed - minSpeed) / range) * (H - 2 * padY);
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${H - padY} L ${coords[0].x.toFixed(1)} ${H - padY} Z`;

  const currentCoord = coords.find((c) => c.day === currentDay) ?? coords[0];
  const prevCoord = coords.find((c) => c.day === currentDay - 1);
  const trend = prevCoord
    ? currentCoord.speed - prevCoord.speed
    : 0;
  const trendUp = trend > 0;

  // Overall average
  const avgSpeed = points.reduce((s, p) => s + p.speed, 0) / points.length;

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
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold">تحلیل سرعت</h3>
            <p className="text-[10px] text-muted-foreground">
              سرعت متوسط هر روز طی سفر
            </p>
          </div>
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1 text-base font-black text-accent">
            <Gauge className="h-3.5 w-3.5" />
            {toFa(currentCoord.speed)}
            <span className="text-[9px] font-normal text-muted-foreground">km/h</span>
          </div>
          {prevCoord && (
            <div className={cn(
              "flex items-center gap-0.5 text-[9px] font-bold",
              trendUp ? "text-emerald" : "text-sunset",
            )}>
              {trendUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {trendUp ? "+" : ""}{toFa(Math.round(trend * 10) / 10)}
              <span className="text-muted-foreground">از دیروز</span>
            </div>
          )}
        </div>
      </div>

      {/* area chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
          style={{ height: H }}
        >
          <defs>
            <linearGradient id="pace-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="pace-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* baseline grid */}
          <line
            x1={padX}
            y1={H - padY}
            x2={W - padX}
            y2={H - padY}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeDasharray="2 2"
          />

          {/* filled area */}
          <path d={areaPath} fill="url(#pace-grad)" />

          {/* line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="url(#pace-line)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* average speed dashed line */}
          {(() => {
            const avgY = H - padY - ((avgSpeed - minSpeed) / range) * (H - 2 * padY);
            return (
              <line
                x1={padX}
                y1={avgY}
                x2={W - padX}
                y2={avgY}
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="3 3"
                strokeOpacity={0.3}
              />
            );
          })()}

          {/* current day marker */}
          <motion.circle
            cx={currentCoord.x}
            cy={currentCoord.y}
            r={5}
            fill="#6366f1"
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
            stroke="#6366f1"
            strokeWidth={2}
            animate={{ r: [5, 12], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />

          {/* day markers */}
          {coords.map((c) => (
            <circle
              key={c.day}
              cx={c.x}
              cy={c.y}
              r={2}
              fill={c.day === currentDay ? "#6366f1" : "currentColor"}
              fillOpacity={c.day === currentDay ? 1 : 0.3}
            />
          ))}
        </svg>
      </div>

      {/* stats row */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="text-base" aria-hidden>🏃</span>
          میانگین: <span className="font-bold text-foreground">{toFa(Math.round(avgSpeed * 10) / 10)} km/h</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Zap className="h-3 w-3 text-gold" />
          سریع‌ترین: <span className="font-bold text-foreground">{toFa(maxSpeed)} km/h</span>
        </span>
        <span className="inline-flex items-center gap-1">
          روز {toFa(currentCoord.day)}
        </span>
      </div>
    </motion.div>
  );
}
