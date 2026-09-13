"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Navigation, Mountain, Tent, Palmtree, Landmark, TreePine } from "lucide-react";
import { toFa } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/format";
import { projectIran } from "@/lib/iran-map";
import { tourFillRatio, fillColor, capacityLevel, levelTextClass } from "@/lib/capacity";
import type { Tour, TourCategory } from "@/types";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<TourCategory, typeof Mountain> = {
  mountain: Mountain,
  desert: Tent,
  coastal: Palmtree,
  historical: Landmark,
  forest: TreePine,
};

interface TourMapProps {
  tours: Tour[];
  focusId?: string;
  height?: string;
  showLegend?: boolean;
  onMarkerClick?: (tour: Tour) => void;
}

/**
 * Interactive real Iran map with pin markers.
 *
 * Uses the real `/iran-map.svg` file (amCharts Iran provinces) loaded inline
 * via fetch, with teardrop pin markers overlaid at accurate lat/lng-derived
 * SVG coordinates. Same visual language as the home page's IranMapExplorer.
 *
 * The SVG viewBox is "-2 42.5 964 875" (amCharts Mercator projection).
 * Marker coordinates were derived from real lat/lng using the projection
 * formula in the home page component.
 */
export function TourMap({
  tours,
  focusId,
  height = "h-80",
  showLegend = true,
  onMarkerClick,
}: TourMapProps) {
  const [hover, setHover] = React.useState<string | null>(null);
  const [svgContent, setSvgContent] = React.useState<string>("");
  const svgRef = React.useRef<HTMLDivElement>(null);

  // Load the real Iran SVG inline
  React.useEffect(() => {
    fetch("/iran-map.svg")
      .then((res) => res.text())
      .then(setSvgContent)
      .catch(() => {});
  }, []);

  // Style province paths after the SVG is injected
  React.useEffect(() => {
    if (!svgContent || !svgRef.current) return;
    const container = svgRef.current;
    container.innerHTML = svgContent;
    const svg = container.querySelector("svg");
    if (!svg) return;
    svg.style.width = "100%";
    svg.style.height = "100%";

    const paths = container.querySelectorAll("path");
    paths.forEach((path) => {
      path.setAttribute("fill", "#0f6b4a");
      path.setAttribute("fill-opacity", "0.12");
      path.setAttribute("stroke", "rgba(255,255,255,0.4)");
      path.setAttribute("stroke-width", "0.5");
      path.style.transition = "all 0.2s";
    });
  }, [svgContent]);

  // Group tours by destination (for marker clustering)
  const markers = React.useMemo(() => {
    const map = new Map<
      string,
      { tour: Tour; lat: number; lng: number; count: number }
    >();
    tours.forEach((t) => {
      const key = `${t.coordinates.lat.toFixed(2)},${t.coordinates.lng.toFixed(2)}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, {
          tour: t,
          lat: t.coordinates.lat,
          lng: t.coordinates.lng,
          count: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [tours]);

  // Convert real lat/lng to SVG x/y using the VERIFIED Web-Mercator
  // projection solved from /public/iran-map.svg itself (same one the home
  // page's IranMapExplorer uses). The old hand-fitted linear formula placed
  // southern pins ~200 svg-units too far south (off the map) and northern
  // pins inside the Caspian — pins looked like they were in the wrong
  // province.
  const project = (lat: number, lng: number): { x: number; y: number } =>
    projectIran(lat, lng);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-forest to-emerald-dark",
        height,
      )}
    >
      {/* SVG container — real Iran provinces */}
      <div ref={svgRef} className="absolute inset-0 h-full w-full" />

      {/* Tour markers — overlaid pin shapes */}
      <svg
        viewBox="-2 42.5 964 875"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {markers.map((m) => {
          const { x, y } = project(m.lat, m.lng);
          const key = `${m.lat},${m.lng}`;
          const isActive = hover === key;
          const isFocus = m.tour.id === focusId;
          const intensity = Math.min(m.count / 3, 1);
          const pinW = isFocus ? 16 : 12 + intensity * 3;
          const pinH = isFocus ? 36 : 26 + intensity * 4;
          const headCy = y - pinH + pinW;
          // Pin color encodes the tour's remaining capacity on the shared
          // green→red scale — the fuller the tour, the redder the pin.
          const capRatio = tourFillRatio(m.tour.reservedCount, m.tour.capacity);
          const capColor = fillColor(capRatio, 66, 46);

          // Teardrop pin path — tip at (x, y)
          const path = `M ${x} ${y}
            C ${x - pinW * 0.4} ${y - pinH * 0.45}, ${x - pinW} ${headCy + pinW * 0.3}, ${x - pinW} ${headCy}
            A ${pinW} ${pinW} 0 1 1 ${x + pinW} ${headCy}
            C ${x + pinW} ${headCy + pinW * 0.3}, ${x + pinW * 0.4} ${y - pinH * 0.45}, ${x} ${y} Z`;

          return (
            <g key={key}>
              {/* Pulse ring for focus/active */}
              {(isFocus || isActive) && (
                <circle
                  cx={x}
                  cy={headCy}
                  r={pinW + 4}
                  fill="#d9a94e"
                  opacity="0.25"
                  className="animate-ping"
                  style={{
                    transformOrigin: `${x}px ${headCy}px`,
                    animationDuration: "2.5s",
                  }}
                />
              )}
              {/* Pin shadow */}
              <ellipse
                cx={x}
                cy={y + 1}
                rx={pinW * 0.5}
                ry={2}
                fill="#000"
                opacity="0.18"
              />
              {/* Pin marker */}
              <path
                d={path}
                fill={isFocus || isActive ? "#e8622c" : capColor}
                stroke="#fff"
                strokeWidth="1.5"
                className="pointer-events-auto cursor-pointer transition-all duration-200"
                style={{
                  filter: isActive
                    ? "drop-shadow(0 4px 8px rgba(232,98,44,0.5))"
                    : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                }}
                onMouseEnter={() => setHover(key)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onMarkerClick?.(m.tour)}
              />
              {/* Inner dot */}
              <circle
                cx={x}
                cy={headCy}
                r={pinW * 0.42}
                fill={isActive ? "#fff" : "#0b1f1a"}
                className="pointer-events-none"
              />
              {/* Count badge */}
              {m.count > 1 && (
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
                  >
                    {m.count}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {(hover || focusId) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute right-4 top-4 z-10 max-w-[220px] rounded-2xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur"
        >
          {(() => {
            const key = hover;
            const m = markers.find(
              (mk) => `${mk.lat},${mk.lng}` === key,
            );
            if (!m) return null;
            const CatIcon = CATEGORY_ICONS[m.tour.category];
            return (
              <>
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald/15 text-emerald">
                    <CatIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold text-emerald">
                    {CATEGORY_LABELS[m.tour.category]}
                  </span>
                </div>
                <p className="text-sm font-bold leading-5">
                  {m.tour.destination}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {m.tour.province}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {toFa(m.count)} تور فعال
                  </span>
                  <span className="flex items-center gap-0.5 font-bold text-gold">
                    ★ {toFa(m.tour.rating)}
                  </span>
                </div>
                {/* Capacity line — dot matches the pin's green→red color */}
                {(() => {
                  const ratio = tourFillRatio(m.tour.reservedCount, m.tour.capacity);
                  const level = capacityLevel(ratio);
                  const remaining = Math.max(0, m.tour.capacity - m.tour.reservedCount);
                  return (
                    <div className="mt-1.5 flex items-center justify-between border-t pt-1.5 text-[10px]">
                      <span className="flex items-center gap-1 font-bold text-foreground">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: fillColor(ratio, 66, 46) }}
                        />
                        ظرفیت
                      </span>
                      <span className={levelTextClass(level)}>
                        {remaining <= 0
                          ? "تکمیل ظرفیت"
                          : `${toFa(remaining)} نفر باقی از ${toFa(m.tour.capacity)}`}
                      </span>
                    </div>
                  );
                })()}
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-3 right-3 rounded-xl border bg-card/90 px-3 py-2 backdrop-blur">
          <div className="flex flex-col gap-1.5 text-[10px] text-muted-foreground">
            {/* Capacity scale: green = free seats → red = fully booked */}
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-14 shrink-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(to left, hsl(142 62% 42%), hsl(71 62% 42%), hsl(0 62% 42%))",
                }}
              />
              ظرفیت: آزاد ← تکمیل
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="10" height="14" viewBox="0 0 10 14" className="shrink-0">
                <path d="M5 14 C 5 14, 0 8, 0 5 A 5 5 0 1 1 10 5 C 10 8, 5 14, 5 14 Z" fill="#e8622c" stroke="#fff" strokeWidth="0.8" />
                <circle cx="5" cy="5" r="1.8" fill="#fff" />
              </svg>
              تور فعلی / انتخابی
            </span>
          </div>
        </div>
      )}

      {/* Title overlay */}
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-xl border bg-card/90 px-3 py-1.5 backdrop-blur">
        <Navigation className="h-4 w-4 text-emerald" />
        <span className="text-xs font-bold">نقشه تعاملی ایران</span>
      </div>
    </div>
  );
}
