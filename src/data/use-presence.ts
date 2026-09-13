"use client";

import { useViewerCount } from "@/store/viewing-store";

/**
 * هوک presence (بخش ۷ سند v19) — پرده‌ای بین mock فعلی و presence واقعی.
 *
 * NEXT_PUBLIC_PRESENCE_MODE:
 *  - "mock" (پیش‌فرض): عدد شبه‌واقعی پایدار از viewing-store — DEV-ONLY
 *  - "real": باید به WebSocket/polling واقعی وصل شود؛ فعلاً پیاده‌سازی ندارد
 *    تا عمداً شکست واضح بدهد و تصادفاً داده جعلی در production نمایش نرود.
 */
export function usePresence(tourId: string): number {
  // همیشه صدا زده می‌شود (Rules of Hooks)؛ در حالت real خطا پرتاب می‌شود
  const mockCount = useViewerCount(tourId);
  const mode = process.env.NEXT_PUBLIC_PRESENCE_MODE ?? "mock";

  if (mode === "real") {
    // TODO(backend): wire to real presence channel (socket.io room per tour)
    throw new Error(
      "Real presence not implemented yet — wire to WebSocket here (بخش ۷ سند v19)"
    );
  }

  return mockCount;
}
