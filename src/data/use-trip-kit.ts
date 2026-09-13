"use client";

import { useQuery } from "@tanstack/react-query";
import { delay } from "./mock-adapter";
import { equipment as mockEquipment } from "@/mocks/equipment";
import { useDraftProducts } from "@/store/draft-products-store";
import { getTripKit } from "@/lib/trip-kit/kit-rules";
import type { Tour } from "@/types";
import type { TripKit } from "@/types/trip-kit";

/**
 * هوک Trip Kit (بخش ۵ سند v19) — تور + محصولات واقعی موجود (mock + محصولات
 * منتشرشده فروشنده‌ها) → کیت پیشنهادی.
 * تنها نقطه‌ای که mock تجهیزات import می‌شود؛ کامپوننت‌ها از این هوک عبور می‌کنند.
 */
async function fetchTripKit(
  tour: Tour,
  draftProducts: ReturnType<typeof useDraftProducts.getState>["products"]
): Promise<TripKit> {
  await delay(350);
  // TODO(backend): جایگزین با GET `${API_BASE}/api/tours/${tour.id}/trip-kit/`
  const all = [...draftProducts, ...mockEquipment];
  return getTripKit(tour, all);
}

export function useTripKit(tour: Tour | null | undefined) {
  return useQuery({
    queryKey: ["trip-kit", tour?.id ?? null],
    queryFn: () => fetchTripKit(tour!, useDraftProducts.getState().products),
    enabled: !!tour,
    staleTime: 60_000,
  });
}
