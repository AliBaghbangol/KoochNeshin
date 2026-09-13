// src/lib/travel-buddy/compute-match-score.ts
import type { TravelDNAScores } from "@/types/dna";

/**
 * Buddy Match Score — spec §5.
 *
 * Weights are the canonical ones from the spec:
 *   travel style .25  |  experience .20  |  interest .20
 *   pace .10          |  budget .10      |  age .05  |  social .10
 *
 * `pace`, `budget` and `age` are stubbed at 80 (neutral) until the backend
 * exposes those fields. Age is intentionally neutral unless explicit consent
 * is given (spec §5 privacy rule).
 */

const styleDiff = (a: number, b: number) => 100 - Math.abs(a - b);

export function computeMatchScore(
  myDNA: TravelDNAScores,
  theirDNA: TravelDNAScores,
): number {
  return Math.round(
    0.25 * styleDiff(myDNA.explorer, theirDNA.explorer) +
      0.2 * styleDiff(myDNA.adventurer, theirDNA.adventurer) +
      0.2 * styleDiff(myDNA.natureLover, theirDNA.natureLover) +
      0.1 * 80 + // pace — stubbed
      0.1 * 80 + // budget — stubbed
      0.05 * 80 + // age — only with explicit consent (not implemented)
      0.1 * styleDiff(myDNA.social, theirDNA.social),
  );
}

/** Convert DNA scores to short Persian highlight labels for the candidate card. */
export function dnaHighlights(scores: TravelDNAScores): string[] {
  const out: { label: string; value: number }[] = [
    { label: "🏔 کوه‌نوردی", value: scores.adventurer },
    { label: "🔥 ماجراجویی", value: scores.explorer },
    { label: "🌿 طبیعت", value: scores.natureLover },
    { label: "👥 اجتماعی", value: scores.social },
  ];
  return out
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((x) => x.label);
}
