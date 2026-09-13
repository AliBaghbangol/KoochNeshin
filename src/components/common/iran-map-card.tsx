"use client";

import * as React from "react";
import { MapPin, MapPinned, Users } from "lucide-react";
import { useGo } from "@/lib/use-go";
import { toFa } from "@/lib/format";
import {
  useIranMapPins,
  wireProvincePaths,
} from "@/hooks/use-iran-map-pins";
import {
  PROVINCE_NAMES_FA,
  IRAN_MAP_VIEWBOX,
  type AvailabilityStats,
} from "@/lib/iran-map";
import { fillColor, fillColorLight } from "@/lib/capacity";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Capacity line — same color language as the home explorer tooltip.   */
/* ------------------------------------------------------------------ */

function CapacityRow({ stats }: { stats: AvailabilityStats }) {
  const remaining = stats.remaining;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          ظرفیت باقی‌مانده
        </span>
        <span className={cn(remaining <= 0 ? "text-destructive" : "text-emerald")}>
          {remaining <= 0
            ? "تکمیل ظرفیت"
            : `${toFa(remaining)} نفر از ${toFa(stats.capacity)}`}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.max(6, (1 - stats.fillRatio) * 100)}%`,
            backgroundColor: fillColor(stats.fillRatio),
          }}
        />
      </div>
    </div>
  );
}

/**
 * The EXACT interactive Iran map from the home page (real province SVG +
 * precise destination pins + hover tooltip + legend), packaged as a
 * standalone card for the destinations page.
 */
export function IranMapCard({ className }: { className?: string }) {
  const go = useGo();
  const { svgContent, mounted, provStats, destPins, maxProvCount } =
    useIranMapPins();
  const [hoverProv, setHoverProv] = React.useState<string | null>(null);
  const [hoverDest, setHoverDest] = React.useState<string | null>(null);

  /* Color + wire province paths — identical behavior to home */
  const svgRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!svgContent || !svgRef.current) return;
    wireProvincePaths(
      svgRef.current,
      svgContent,
      provStats,
      maxProvCount,
      { onHover: setHoverProv, onProvinceClick: (name) => go("tours", { province: name }) },
      PROVINCE_NAMES_FA,
    );
  }, [svgContent, provStats, maxProvCount, go]);

  /* Floating tooltip — follows the pointer, positioned via ref */
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const ptr = React.useRef({ x: 0, y: 0 });

  const moveTip = React.useCallback(() => {
    const tip = tipRef.current;
    const wrap = wrapRef.current;
    if (!tip || !wrap) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let x = ptr.current.x + 16;
    if (x + tw > w - 8) x = ptr.current.x - tw - 16;
    let y = ptr.current.y - th - 14;
    if (y < 8) y = ptr.current.y + 18;
    x = Math.max(8, Math.min(x, w - tw - 8));
    y = Math.max(8, Math.min(y, h - th - 8));
    tip.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  React.useEffect(() => {
    moveTip();
  }, [hoverProv, hoverDest, moveTip]);

  const onPointerMove = (e: React.PointerEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    ptr.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    moveTip();
  };

  const hoverProvName = hoverProv ? PROVINCE_NAMES_FA[hoverProv] : null;
  const hoverProvStats = hoverProvName ? provStats.get(hoverProvName) : undefined;
  const hoverPin = destPins.find((d) => d.name === hoverDest);

  return (
    <div className={cn("overflow-hidden rounded-3xl border bg-card", className)}>
      {/* Card header */}
      <div className="flex items-center gap-2.5 border-b p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald/10 text-emerald">
          <MapPinned className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">نقشه تعاملی ایران</p>
          <p className="text-[11px] text-muted-foreground">
            روی هر استان یا نشانِ مقصد بزن تا تورهای همان ناحیه را ببینی
          </p>
        </div>
      </div>

      {/* Map stage */}
      <div className="relative flex items-center justify-center p-2 sm:p-3">
        <div
          ref={wrapRef}
          onPointerMove={onPointerMove}
          className="relative h-[380px] w-full max-sm:aspect-[964/875] max-sm:h-auto sm:h-[420px] lg:h-[460px]"
        >
          {/* Provinces SVG */}
          <div ref={svgRef} className="absolute inset-0 h-full w-full" />

          {/* Floating hover tooltip (pointer devices only) */}
          <div
            ref={tipRef}
            role="tooltip"
            className={cn(
              "pointer-events-none absolute left-0 top-0 z-20 w-52 rounded-xl border bg-card p-3 shadow-xl transition-opacity duration-150",
              (hoverProvName && hoverProvStats) || hoverPin
                ? "opacity-100"
                : "opacity-0"
            )}
          >
            {hoverProvName && hoverProvStats && hoverProvStats.count > 0 ? (
              <>
                <p className="flex items-center justify-between text-sm font-bold text-primary">
                  {hoverProvName}
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {toFa(hoverProvStats.count)} تور فعال
                  </span>
                </p>
                <CapacityRow stats={hoverProvStats} />
              </>
            ) : hoverProvName ? (
              <>
                <p className="text-sm font-bold text-primary">{hoverProvName}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">توری ثبت نشده</p>
              </>
            ) : hoverPin ? (
              <>
                <p className="flex items-center justify-between text-sm font-bold text-gold">
                  {hoverPin.name}
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {toFa(hoverPin.stats.count)} تور فعال
                  </span>
                </p>
                <CapacityRow stats={hoverPin.stats} />
              </>
            ) : null}
          </div>

          {/* Destination pins — precise lat/lng → SVG projection (client-only) */}
          <svg
            viewBox={IRAN_MAP_VIEWBOX}
            className="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden={!mounted}
          >
            {mounted && destPins.map((t) => {
              const x = t.x;
              const y = t.y;
              const intensity = Math.min(1, t.stats.count / 5);
              const isActive = hoverDest === t.name;
              const pinW = 11 + intensity * 3;
              const pinH = 26 + intensity * 4;
              const headR = pinW;
              const headCy = y - pinH + headR;
              const path = `M ${x} ${y} 
                C ${x - pinW * 0.4} ${y - pinH * 0.45}, ${x - pinW} ${headCy + pinW * 0.3}, ${x - pinW} ${headCy}
                A ${pinW} ${pinW} 0 1 1 ${x + pinW} ${headCy}
                C ${x + pinW} ${headCy + pinW * 0.3}, ${x + pinW * 0.4} ${y - pinH * 0.45}, ${x} ${y} Z`;
              return (
                <g key={t.name}>
                  <circle
                    cx={x}
                    cy={y - pinH * 0.5}
                    r={pinH * 0.8}
                    fill="transparent"
                    className="pointer-events-none max-sm:pointer-events-auto max-sm:cursor-pointer"
                    onMouseEnter={() => setHoverDest(t.name)}
                    onMouseLeave={() => setHoverDest(null)}
                    onClick={() => go("tours", { destination: t.name })}
                  />
                  {t.stats.count >= 2 && (
                    <circle
                      cx={x}
                      cy={headCy}
                      r={pinW + 4}
                      fill="#d9a94e"
                      opacity="0.25"
                      className="animate-ping"
                      style={{ transformOrigin: `${x}px ${headCy}px`, animationDuration: "2.5s" }}
                    />
                  )}
                  <ellipse
                    cx={x}
                    cy={y + 1}
                    rx={pinW * 0.5}
                    ry={2}
                    fill="#000"
                    opacity="0.18"
                  />
                  <path
                    d={path}
                    fill={isActive ? "#e8622c" : fillColorLight(t.stats.fillRatio)}
                    stroke="#fff"
                    strokeWidth="1.5"
                    className="pointer-events-auto cursor-pointer transition-all duration-200"
                    style={{
                      filter: isActive
                        ? "drop-shadow(0 4px 8px rgba(232,98,44,0.5))"
                        : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                    }}
                    onMouseEnter={() => setHoverDest(t.name)}
                    onMouseLeave={() => setHoverDest(null)}
                    onClick={() => go("tours", { destination: t.name })}
                  />
                  <circle
                    cx={x}
                    cy={headCy}
                    r={pinW * 0.42}
                    fill={isActive ? "#fff" : "#0b1f1a"}
                    className="pointer-events-none"
                  />
                  <g className="pointer-events-none">
                    <circle
                      cx={x + pinW * 0.7}
                      cy={headCy - pinW * 0.5}
                      r={6}
                      fill="#0f6b4a"
                      stroke="#fff"
                      strokeWidth="1"
                    />
                    <text
                      x={x + pinW * 0.7}
                      y={headCy - pinW * 0.5 + 3.5}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#fff"
                      className="pointer-events-none"
                    >
                      {t.stats.count}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Legend — identical to home */}
          <div className="absolute bottom-2 left-2 flex flex-col gap-1.5 rounded-xl bg-background/80 p-2.5 text-[10px] backdrop-blur">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sunset" />
              پرطرفدار
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald" />
              دارای تور
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-border bg-muted" />
              بدون تور
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="10" height="14" viewBox="0 0 10 14" className="shrink-0">
                <path d="M5 14 C 5 14, 0 8, 0 5 A 5 5 0 1 1 10 5 C 10 8, 5 14, 5 14 Z" fill="#d9a94e" stroke="#fff" strokeWidth="0.8" />
                <circle cx="5" cy="5" r="1.8" fill="#0b1f1a" />
              </svg>
              مقصد تور
            </span>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <p className="flex items-center gap-1.5 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
        رنگ استان‌ها بر اساس تعداد و محبوبیت تورها پر شده است.
      </p>
    </div>
  );
}
