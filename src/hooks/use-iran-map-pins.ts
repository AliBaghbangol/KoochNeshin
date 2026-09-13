"use client";

import * as React from "react";
import { useAllTours } from "@/hooks/use-all-tours";
import { projectIran, type AvailabilityStats } from "@/lib/iran-map";
import { tourFillRatio } from "@/lib/capacity";

/* ------------------------------------------------------------------ */
/* Shared Iran-map data layer — used by the home explorer AND the      */
/* destinations map card, so both always render identical pins/stats.  */
/* ------------------------------------------------------------------ */

export const emptyStats = (): AvailabilityStats => ({
  count: 0,
  capacity: 0,
  reserved: 0,
  remaining: 0,
  fillRatio: 0,
});

/** Group tours by a key and accumulate capacity stats. */
export function aggregate<T extends string>(
  allTours: ReturnType<typeof useAllTours>,
  keyOf: (t: (typeof allTours)[number]) => T | undefined,
): Map<T, AvailabilityStats> {
  const map = new Map<T, AvailabilityStats>();
  for (const t of allTours) {
    const key = keyOf(t);
    if (!key) continue;
    const s = map.get(key) ?? emptyStats();
    s.count += 1;
    s.capacity += t.capacity;
    s.reserved += t.reservedCount;
    map.set(key, s);
  }
  for (const s of map.values()) {
    s.remaining = s.capacity - s.reserved;
    s.fillRatio = tourFillRatio(s.reserved, s.capacity);
  }
  return map;
}

export interface DestinationPin {
  name: string;
  lat: number;
  lng: number;
  stats: AvailabilityStats;
  /** projected svg coordinates (filled in after aggregation) */
  x: number;
  y: number;
}

/**
 * All map data: live per-province stats, per-destination pins (projected to
 * SVG coordinates) and the raw province SVG content. Marker pins depend on
 * localStorage-backed draft tours (useAllTours merges published drafts from
 * persisted zustand stores, which the server render never sees) — `mounted`
 * gates their render so the first client render matches the server HTML and
 * avoids SVG attribute hydration mismatches.
 */
export function useIranMapPins() {
  const allTours = useAllTours();
  const [svgContent, setSvgContent] = React.useState<string>("");
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  /* Real per-province / per-destination stats (live: includes published
     draft tours created by leaders, exactly like the rest of the app). */
  const provStats = React.useMemo(
    () => aggregate(allTours, (t) => t.province),
    [allTours],
  );

  const destPins = React.useMemo<DestinationPin[]>(() => {
    const byName = new Map<string, { pin: DestinationPin; n: number }>();
    for (const t of allTours) {
      const entry = byName.get(t.destination);
      if (entry) {
        entry.pin.stats.count += 1;
        entry.pin.stats.capacity += t.capacity;
        entry.pin.stats.reserved += t.reservedCount;
        // average the coordinates so multi-tour destinations sit centred
        entry.n += 1;
        entry.pin.lat += (t.coordinates.lat - entry.pin.lat) / entry.n;
        entry.pin.lng += (t.coordinates.lng - entry.pin.lng) / entry.n;
      } else {
        byName.set(t.destination, {
          pin: {
            name: t.destination,
            lat: t.coordinates.lat,
            lng: t.coordinates.lng,
            stats: {
              count: 1,
              capacity: t.capacity,
              reserved: t.reservedCount,
              remaining: t.capacity - t.reservedCount,
              fillRatio: 0,
            },
            x: 0,
            y: 0,
          },
          n: 1,
        });
      }
    }
    const pins = [...byName.values()].map(({ pin }) => {
      pin.stats.remaining = pin.stats.capacity - pin.stats.reserved;
      pin.stats.fillRatio = tourFillRatio(pin.stats.reserved, pin.stats.capacity);
      const p = projectIran(pin.lat, pin.lng);
      // Round to 2 decimals — kills float noise so values are stable across
      // renders and platforms.
      return { ...pin, x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 };
    });
    return pins;
  }, [allTours]);

  const maxProvCount = React.useMemo(
    () => Math.max(1, ...[...provStats.values()].map((s) => s.count)),
    [provStats],
  );

  /* Load the province SVG inline */
  React.useEffect(() => {
    let alive = true;
    fetch("/iran-map.svg")
      .then((res) => res.text())
      .then((text) => {
        if (alive) setSvgContent(text);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return { allTours, svgContent, mounted, provStats, destPins, maxProvCount };
}

/**
 * Parse the province SVG into `container`, color provinces with the
 * categorical 3-state scheme and wire hover/click interactions.
 * Shared by home explorer & destinations card so behavior is identical.
 */
export function wireProvincePaths(
  container: HTMLDivElement,
  svgContent: string,
  provStats: Map<string, AvailabilityStats>,
  maxProvCount: number,
  handlers: {
    onHover: (id: string | null) => void;
    onProvinceClick: (provinceName: string) => void;
  },
  PROVINCE_NAMES_FA: Record<string, string>,
) {
  container.innerHTML = svgContent;
  const svg = container.querySelector("svg");
  if (!svg) return;
  svg.style.width = "100%";
  svg.style.height = "100%";

  // Hover tooltips only for real mouse pointers — pointerType filtering is
  // robust on hybrid touch laptops (unlike a one-shot media query) and
  // keeps touch taps free of transient tooltips.

  const paths = container.querySelectorAll("path");
  paths.forEach((path) => {
    const id = path.getAttribute("id") || "";
    const name = PROVINCE_NAMES_FA[id];
    if (!name) return; // unknown id — leave styled as base
    const stats = provStats.get(name);
    const count = stats?.count ?? 0;
    const intensity = count / maxProvCount;
    // Categorical 3-state map (user spec):
    //   پرطرفدار  → sunset (the original popular color, theme-aware)
    //   دارای تور → emerald (regular tour province)
    //   خالی      → var(--muted) neutral — effectively "no color"
    const isPopular = count > 0 && intensity > 0.6;
    path.style.fill =
      count > 0 ? (isPopular ? "var(--sunset)" : "var(--emerald)") : "var(--muted)";
    path.setAttribute(
      "fill-opacity",
      count > 0 ? String(0.15 + intensity * 0.35) : "1",
    );
    path.setAttribute("stroke", "#fff");
    path.setAttribute("stroke-width", "0.5");
    path.style.cursor = "pointer";
    path.style.transition = "all 0.2s";

    const restOpacity = count > 0 ? String(0.15 + intensity * 0.35) : "1";

    path.addEventListener("pointerenter", (e) => {
      if ((e as PointerEvent).pointerType !== "mouse") return;
      path.setAttribute("fill-opacity", "0.65");
      path.setAttribute("stroke", "#d9a94e");
      path.setAttribute("stroke-width", "1.5");
      handlers.onHover(id);
    });
    path.addEventListener("pointerleave", (e) => {
      if ((e as PointerEvent).pointerType !== "mouse") return;
      path.setAttribute("fill-opacity", restOpacity);
      path.setAttribute("stroke", "#fff");
      path.setAttribute("stroke-width", "0.5");
      handlers.onHover(null);
    });
    path.addEventListener("click", () => {
      if (name) handlers.onProvinceClick(name);
    });
  });
}
