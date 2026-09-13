"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/store/auth-store";
import { delay } from "./mock-adapter";
import { useTravelDNA } from "./use-travel-dna";
import { computeFitScore } from "@/lib/fit-score/compute-fit-score";
import type { Tour } from "@/types";
import type { TourFitScore } from "@/types/fit-score";

/**
 * هوک Fit Score (بخش ۴ سند v19).
 * - به Travel DNA وابسته است (بدون DNA امتیاز عمومی ۷۰ برمی‌گردد).
 * - latency برای نمایش skeleton در صفحه تور؛ روی کارت‌ها 0 تا فلاش نزند.
 */
export function useTourFitScore(
  tour: Tour | null | undefined,
  opts?: { latency?: number }
) {
  const user = useAuth((s) => s.user);
  // Guests get a stable local profile id so DNA built inline on a tour page
  // (no login required) still drives the fit score.
  const dnaUserId = user?.id ?? "guest";
  const dnaQuery = useTravelDNA(dnaUserId);
  const dna = dnaQuery.data ?? null;
  const hasDNA = !!dna;
  const latency = opts?.latency ?? 0;

  const query = useQuery({
    queryKey: ["fit-score", tour?.id ?? null, dna?.computedAt ?? "no-dna"],
    queryFn: async (): Promise<TourFitScore | null> => {
      if (!tour) return null;
      if (latency) await delay(latency);
      // TODO(backend): جایگزین با GET `${API_BASE}/api/tours/${tour.id}/fit-score/?dna=…`
      return computeFitScore(tour, dna);
    },
    enabled: !!tour,
    staleTime: Infinity,
  });

  return {
    score: query.data?.score ?? null,
    breakdown: query.data?.breakdown ?? null,
    hasDNA,
    isLoading: query.isLoading || dnaQuery.isLoading,
  };
}
