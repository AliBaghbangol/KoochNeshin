"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { delay, LS_KEYS } from "./mock-adapter";
import type { TravelDNA } from "@/types/dna";

/**
 * هوک Travel DNA — الگوی لایه داده (بخش ۲ و ۳ سند v19).
 * فعلاً persist در localStorage؛ بعداً فقط بدنه fetch/save عوض می‌شود.
 */

async function fetchTravelDNA(userId: string): Promise<TravelDNA | null> {
  await delay(300);
  // TODO(backend): جایگزین با: fetch(`${API_BASE}/api/travel-dna/${userId}/`)
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS_KEYS.travelDNA(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TravelDNA;
  } catch {
    return null;
  }
}

export function useTravelDNA(userId: string | undefined) {
  return useQuery({
    queryKey: ["travel-dna", userId ?? null],
    queryFn: () => fetchTravelDNA(userId!),
    enabled: !!userId,
  });
}

/** ذخیره DNA — با mutation-style helper که کش React Query را هم به‌روز می‌کند */
export function useSaveTravelDNA(userId: string | undefined) {
  const qc = useQueryClient();
  return React.useCallback(
    (dna: TravelDNA) => {
      if (!userId) return;
      // TODO(backend): POST `${API_BASE}/api/travel-dna/${userId}/`
      localStorage.setItem(LS_KEYS.travelDNA(userId), JSON.stringify(dna));
      qc.setQueryData(["travel-dna", userId], dna);
      qc.invalidateQueries({ queryKey: ["fit-score"] });
    },
    [qc, userId]
  );
}

/** پاک کردن DNA (شروع مجدد) */
export function useClearTravelDNA(userId: string | undefined) {
  const qc = useQueryClient();
  return React.useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(LS_KEYS.travelDNA(userId));
    qc.setQueryData(["travel-dna", userId], null);
    qc.invalidateQueries({ queryKey: ["fit-score"] });
  }, [qc, userId]);
}
