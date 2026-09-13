"use client";

import * as React from "react";
import { create } from "zustand";

// DEV-ONLY MOCK — این عدد واقعی نیست؛ جایگزین با presence واقعی (WebSocket)
// قبل از production. MODE واقعی در src/data/use-presence.ts کنترل می‌شود
// (NEXT_PUBLIC_PRESENCE_MODE = "mock" | "real").
// سند v19 بخش ۷: عدد باید بین رفرش‌ها پایدار بماند تا اعتماد کاربر نشکند.

interface ViewingState {
  // Map of tourId → count of people viewing
  viewing: Record<string, number>;
  // Re-roll counts periodically
  tick: () => void;
}

// Deterministic pseudo-random based on string hash
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * عدد پایدار در طول روز: hash(tourId + تاریخ امروز) — بین رفرش‌ها و در یک روز
 * یکسان می‌ماند، فردا به‌نرمی تغییر می‌کند (الگوی واقعی‌تر از random خام).
 */
function genCount(tourId: string): number {
  const day = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  return 3 + (hashStr(`${tourId}:${day}`) % 16); // 3-18 viewers
}

export const useViewing = create<ViewingState>((set) => ({
  viewing: {},
  tick: () =>
    set((s) => {
      // Slightly fluctuate existing counts by ±1
      const next: Record<string, number> = {};
      Object.entries(s.viewing).forEach(([id, count]) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
        next[id] = Math.max(2, Math.min(25, count + delta));
      });
      return { viewing: next };
    }),
}));

// Hook that returns a stable viewer count for a tour
export function useViewerCount(tourId: string): number {
  const count = useViewing((s) => s.viewing[tourId]);
  const tick = useViewing((s) => s.tick);

  React.useEffect(() => {
    // Initialize if not present
    const cur = useViewing.getState().viewing[tourId];
    if (cur === undefined) {
      useViewing.setState((s) => ({
        viewing: { ...s.viewing, [tourId]: genCount(tourId) },
      }));
    }
  }, [tourId]);

  // Periodically tick (every 8-15s) — only when document is visible
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        tick();
      }
    }, 10000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [tick]);

  return count ?? genCount(tourId);
}
