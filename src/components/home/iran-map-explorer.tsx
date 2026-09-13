"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft, Users } from "lucide-react";
import { useGo } from "@/lib/use-go";
import { toFa } from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import {
  useIranMapPins,
  wireProvincePaths,
  type DestinationPin,
} from "@/hooks/use-iran-map-pins";
import {
  PROVINCE_NAMES_FA,
  IRAN_MAP_VIEWBOX,
  type AvailabilityStats,
} from "@/lib/iran-map";
import {
  fillColor,
  fillColorLight,
  capacityLevel,
  levelTextClass,
} from "@/lib/capacity";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Aggregation helpers live in use-iran-map-pins (shared with the      */
/* destinations map card) — this component only renders.               */
/* ------------------------------------------------------------------ */

/** Remaining-capacity line used by the tooltip AND the side panel —
 *  identical color language to the tour/equipment cards (green → red). */
function CapacityRow({ stats }: { stats: AvailabilityStats }) {
  const level = capacityLevel(stats.fillRatio);
  const isFull = stats.remaining <= 0;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          ظرفیت باقی‌مانده
        </span>
        <span className={cn(levelTextClass(isFull ? "full" : level))}>
          {isFull
            ? "تکمیل ظرفیت"
            : `${toFa(stats.remaining)} نفر از ${toFa(stats.capacity)}`}
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

/* ------------------------------------------------------------------ */

export function IranMapExplorer() {
  const go = useGo();
  const {
    svgContent,
    mounted,
    provStats,
    destPins,
    maxProvCount,
  } = useIranMapPins();
  const [hoverProv, setHoverProv] = React.useState<string | null>(null);
  const [hoverDest, setHoverDest] = React.useState<string | null>(null);

  /* Parse SVG, color provinces with the categorical 3-state scheme, wire interactions */
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

  /* Floating tooltip — follows the pointer, positioned via ref (no
     re-render on every mousemove). Content reacts to hover target. */
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

  /* Tooltip payload */
  const hoverProvName = hoverProv ? PROVINCE_NAMES_FA[hoverProv] : null;
  const hoverProvStats = hoverProvName ? provStats.get(hoverProvName) : undefined;
  const hoverPin = destPins.find((d) => d.name === hoverDest);

  /* Side panel payload (works on touch too — tap a province) */
  const panelProvName = hoverProvName;
  const panelProvStats = hoverProvStats;
  const panelPin = hoverPin;

  return (
    /* Hidden below tablet (<md): the interactive map is meaningless on
       small touch screens — the stacked info panel + tiny tap targets
       wasted a full screen. Tablet and desktop keep the full experience. */
    <section className="relative hidden min-h-screen items-center overflow-hidden bg-background py-8 md:flex">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Left: info panel */}
        <div className="flex flex-col justify-center">
          <ScrollReveal>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px w-10 bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                کاوش تعاملی
              </span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
              روی نقشه <span className="text-gradient-emerald">ایران</span>،
              مقصدت را پیدا کن
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              روی هر استان بزن تا تعداد تورها و ظرفیت باقی‌مانده‌اش رو ببینی.
            </p>
          </ScrollReveal>

          {/* Hover info */}
          <ScrollReveal delay={0.1}>
            <div className="mt-6 min-h-[104px] rounded-2xl border bg-card p-4">
              {panelProvName ? (
                <motion.div key={panelProvName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-lg font-bold text-primary">{panelProvName}</p>
                  {panelProvStats && panelProvStats.count > 0 ? (
                    <>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {toFa(panelProvStats.count)} تور فعال
                      </p>
                      <CapacityRow stats={panelProvStats} />
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      فعلاً توری برای این استان ثبت نشده است.
                    </p>
                  )}
                </motion.div>
              ) : panelPin ? (
                <motion.div key={panelPin.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-lg font-bold text-gold">{panelPin.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {toFa(panelPin.stats.count)} تور فعال
                  </p>
                  <CapacityRow stats={panelPin.stats} />
                </motion.div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  نشان ماوس را روی نقشه حرکت دهید...
                </p>
              )}
            </div>
          </ScrollReveal>

          {/* Top destinations */}
          <ScrollReveal delay={0.15}>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">مقاصد پرطرفدار</p>
              {[...destPins].sort((a, b) => b.stats.count - a.stats.count).slice(0, 5).map((t) => (
                <button key={t.name} onClick={() => go("tours", { destination: t.name })} className="flex w-full items-center justify-between rounded-xl border bg-card p-2.5 text-right transition max-sm:min-h-11 hover:border-primary/40">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{t.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{toFa(t.stats.count)} تور</span>
                </button>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <button onClick={() => go("tours")} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-emerald-dark">
              <MapPin className="h-4 w-4" />
              مشاهده همه تورها
              <ArrowLeft className="h-4 w-4" />
            </button>
          </ScrollReveal>
        </div>

        {/* Right: real Iran map with tour markers */}
        <div className="relative flex items-center justify-center">
          {/* On <lg the grid stacks, so this wrapper can't inherit height from a tall
              sibling row — give it the map's intrinsic aspect ratio so the SVG stays
              visible and tappable on mobile/tablet. Desktop (h-full + max-h) untouched. */}
          <div
            ref={wrapRef}
            onPointerMove={onPointerMove}
            className="relative h-full max-h-[80vh] w-full max-lg:aspect-[964/875] max-lg:h-auto"
          >
            {/* SVG container — provinces */}
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

            {/* Tour location markers — overlaid on SVG.
                Rendered client-only (see `mounted` note above) so persisted
                draft-tour data can never cause a hydration mismatch. */}
            <svg viewBox={IRAN_MAP_VIEWBOX} className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden={!mounted}>
              {mounted && destPins.map((t) => {
                const x = t.x;
                const y = t.y;
                const intensity = Math.min(1, t.stats.count / 5);
                const isActive = hoverDest === t.name;
                // Pin marker — classic teardrop/map-pin shape.
                // The pin is drawn so that its TIP sits exactly at (x, y).
                const pinW = 11 + intensity * 3; // half-width of the pin head
                const pinH = 26 + intensity * 4; // total pin height (head + tip)
                const headR = pinW; // radius of the round head
                const headCy = y - pinH + headR;
                const path = `M ${x} ${y} 
                  C ${x - pinW * 0.4} ${y - pinH * 0.45}, ${x - pinW} ${headCy + pinW * 0.3}, ${x - pinW} ${headCy}
                  A ${pinW} ${pinW} 0 1 1 ${x + pinW} ${headCy}
                  C ${x + pinW} ${headCy + pinW * 0.3}, ${x + pinW * 0.4} ${y - pinH * 0.45}, ${x} ${y} Z`;
                return (
                  <g key={t.name}>
                    {/* Enlarged invisible tap target — touch only (<lg). Desktop hit
                        behaviour stays exactly as before (pointer-events-none). */}
                    <circle
                      cx={x}
                      cy={y - pinH * 0.5}
                      r={pinH * 0.8}
                      fill="transparent"
                      className="pointer-events-none max-lg:pointer-events-auto max-lg:cursor-pointer"
                      onMouseEnter={() => setHoverDest(t.name)}
                      onMouseLeave={() => setHoverDest(null)}
                      onClick={() => go("tours", { destination: t.name })}
                    />
                    {/* Pulse ring — only for popular destinations (2+ tours) */}
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
                    {/* Pin shadow (subtle, under the pin) */}
                    <ellipse
                      cx={x}
                      cy={y + 1}
                      rx={pinW * 0.5}
                      ry={2}
                      fill="#000"
                      opacity="0.18"
                    />
                    {/* Pin marker (teardrop shape) — colored on the shared
                        green→red availability scale like the cards */}
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
                    {/* Inner dot (gives the pin a "hole" like classic map markers) */}
                    <circle
                      cx={x}
                      cy={headCy}
                      r={pinW * 0.42}
                      fill={isActive ? "#fff" : "#0b1f1a"}
                      className="pointer-events-none"
                    />
                    {/* Tour count badge — small number above the pin head */}
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
          </div>

          {/* Legend — categorical 3-state provinces + destination pins */}
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
    </section>
  );
}
