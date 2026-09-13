// src/lib/fit-score/explain-fit-score.ts
import type { TourFitScore, FitScoreBreakdown } from "@/types/fit-score";

/**
 * Fit Score Explainability — spec §1 of KOCHNESHIN-V19-FRONTEND-DEV-SPEC-PART2.md.
 *
 * Returns a single human-readable Persian sentence that explains *why* the
 * tour earned its score, based on the top two breakdown dimensions. The
 * breakdown card stays — this sentence goes underneath it as a one-liner.
 *
 * Example output:
 *   «این تور به‌خاطر آب‌وهوا و بودجه امتیاز بالایی برای تو گرفته است.»
 */

const LABELS: Record<keyof FitScoreBreakdown, string> = {
  budget: "بودجه",
  difficulty: "سختی",
  weather: "آب‌وهوا",
  leader: "لیدر",
  preference: "علایق سفر",
};

/** Persian-friendly join: ["آب‌وهوا","بودجه"] → "آب‌وهوا و بودجه" */
function joinFa(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} و ${items[1]}`;
  return `${items.slice(0, -1).join("، ")} و ${items[items.length - 1]}`;
}

export function explainFitScore(fit: TourFitScore): string {
  const entries = Object.entries(fit.breakdown) as [
    keyof FitScoreBreakdown,
    number,
  ][];

  // top two dimensions by raw score
  const top = entries
    .slice()
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => LABELS[key]);

  const reasons = joinFa(top);
  return `این تور به‌خاطر تناسب در ${reasons} امتیاز بالایی برای تو گرفته است.`;
}
