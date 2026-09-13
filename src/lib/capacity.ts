/**
 * Shared capacity/stock color system.
 *
 * Everything that can "run out" — tour seats, equipment stock (sale or
 * rent), map pins — is colored on one smooth scale: green when plenty is
 * available and progressively redder as the availability approaches zero.
 *
 * The scale interpolates hue in HSL space:
 *   hue 142 (green) → hue 0 (red)
 * so callers can use it for Tailwind-free contexts (SVG fills, inline
 * styles) and still read text labels through the stepped helpers below.
 */

/** Clamp a ratio (0..1 where 1 = completely full / out of stock). */
const clamp01 = (r: number) => Math.min(1, Math.max(0, r));

/** Hue for a fill ratio: 0 → 142 (green), 1 → 0 (red). */
export function fillHue(ratio: number): number {
  return Math.round(142 * (1 - clamp01(ratio)));
}

/** Smooth green→red HSL color for a fill ratio (SVG fills / inline styles). */
export function fillColor(ratio: number, s = 62, l = 42): string {
  return `hsl(${fillHue(ratio)} ${s}% ${l}%)`;
}

/** Same scale, slightly lighter — useful for small dots and pins. */
export function fillColorLight(ratio: number): string {
  return `hsl(${fillHue(ratio)} 68% 50%)`;
}

export type CapacityLevel = "ok" | "medium" | "high" | "critical" | "full";

/** Stepped level for a fill ratio (used for text/icon colors). */
export function capacityLevel(ratio: number): CapacityLevel {
  const r = clamp01(ratio);
  if (r >= 1) return "full";
  if (r >= 0.85) return "critical";
  if (r >= 0.65) return "high";
  if (r >= 0.4) return "medium";
  return "ok";
}

/** Tailwind classes matching the stepped levels. */
const LEVEL_TEXT: Record<CapacityLevel, string> = {
  ok: "text-emerald",
  medium: "text-emerald-light",
  high: "text-gold",
  critical: "text-sunset",
  full: "text-destructive",
};

const LEVEL_BG: Record<CapacityLevel, string> = {
  ok: "bg-emerald",
  medium: "bg-emerald-light",
  high: "bg-gold",
  critical: "bg-sunset",
  full: "bg-destructive",
};

const LEVEL_CHIP: Record<CapacityLevel, string> = {
  ok: "bg-emerald/10 text-emerald border-emerald/30",
  medium: "bg-emerald-light/10 text-emerald-light border-emerald-light/30",
  high: "bg-gold/10 text-gold border-gold/30",
  critical: "bg-sunset/10 text-sunset border-sunset/30",
  full: "bg-destructive/10 text-destructive border-destructive/30",
};

export function levelTextClass(level: CapacityLevel): string {
  return LEVEL_TEXT[level];
}

export function levelBgClass(level: CapacityLevel): string {
  return LEVEL_BG[level];
}

export function levelChipClass(level: CapacityLevel): string {
  return LEVEL_CHIP[level];
}

/**
 * Tour seat availability: ratio of seats already reserved (1 = fully booked).
 */
export function tourFillRatio(reservedCount: number, capacity: number): number {
  if (capacity <= 0) return 1;
  return clamp01(reservedCount / capacity);
}

/**
 * Equipment stock availability: 1 = completely out, 0 = fully stocked.
 * STOCK_FULL is the mock ceiling (40 units) — anything at or above it
 * counts as "plenty".
 */
export const STOCK_FULL = 40;

export function stockFillRatio(stock: number): number {
  if (stock <= 0) return 1;
  return clamp01(1 - stock / STOCK_FULL);
}
