"use client";

import { useQuery } from "@tanstack/react-query";
import { delay } from "./mock-adapter";
import { useAllTours } from "@/hooks/use-all-tours";
import { rankTours } from "@/lib/planner/rank-tours";
import type { TripPlannerInput, PlannerResult } from "@/types/planner";

/**
 * هوک Planner (بخش ۶ سند v19) — رتبه‌بندی rule-based روی تورهای واقعی
 * (mock + تورهای منتشرشده لیدرها).
 */
async function fetchPlannerResult(
  input: TripPlannerInput,
  tours: ReturnType<typeof useAllTours>
): Promise<PlannerResult> {
  await delay(700); // «فکر کردن» موتور — تجربه UX
  // TODO(backend/AI): جایگزین با POST `${API_BASE}/api/planner/plan/`
  // (سمت سرور: rank همان فرمول + بعداً LLM برای پردازش متن آزاد)
  const matches = rankTours(tours, input, 5);
  const best = matches[0];
  const isApproximate = !best || best.score < 60;
  return { input, matches, isApproximate };
}

export function usePlannerResult(
  input: TripPlannerInput | null,
  enabled: boolean
) {
  const tours = useAllTours();
  return useQuery({
    queryKey: ["planner", input],
    queryFn: () => fetchPlannerResult(input!, tours),
    enabled: enabled && !!input,
    staleTime: 0,
    gcTime: 0,
  });
}
