"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { XpEvent, XpEventType } from "@/types/xp";
import { XP_AMOUNTS, XP_PER_LEVEL } from "@/types/xp";
import { evaluateAchievements } from "@/lib/xp/achievement-rules";
import type { Achievement } from "@/types/xp";

// TODO(backend): sync XP ledger with server — این ledger صرفاً محلی/localStorage است
// و قبل از production باید با ledger سمت سرور (Django) همگام شود.

interface XpState {
  events: XpEvent[];
  unlocked: string[]; // achievement ids
  /** دستاوردهای تازه باز شده که هنوز toast نشان داده نشده‌اند */
  pending: Achievement[];
  addEvent: (type: XpEventType, meta?: Record<string, string | number>) => Achievement[];
  consumePending: () => Achievement[];
  clearAll: () => void;
}

export const useXP = create<XpState>()(
  persist(
    (set, get) => ({
      events: [],
      unlocked: [],
      pending: [],
      addEvent: (type, meta) => {
        const state = get();

        // Frontend-only dedup: prevent XP farming by checking if an event
        // with the same type + same meta.tourId already exists.
        // This is a UX-level guard — the real dedup must happen on the
        // server (TODO(backend): sync XP ledger with server).
        if (meta?.tourId) {
          const alreadyHas = state.events.some(
            (e) => e.type === type && e.meta?.tourId === meta.tourId,
          );
          if (alreadyHas) return [];
        }

        const event: XpEvent = {
          id: `xp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type,
          amount: XP_AMOUNTS[type],
          at: new Date().toISOString(),
          meta,
        };
        const events = [...state.events, event];
        const newly = evaluateAchievements(events, state.unlocked);
        set({
          events,
          unlocked: [...state.unlocked, ...newly.map((a) => a.id)],
          pending: [...state.pending, ...newly],
        });
        return newly;
      },
      consumePending: () => {
        const p = get().pending;
        if (p.length) set({ pending: [] });
        return p;
      },
      clearAll: () => set({ events: [], unlocked: [], pending: [] }),
    }),
    {
      name: "kochneshin-xp",
      partialize: (s) => ({ events: s.events, unlocked: s.unlocked }),
    }
  )
);

/** مجموع XP و سطح فعلی + پیشرفت تا سطح بعد */
export function xpSummary(events: XpEvent[]) {
  const total = events.reduce((sum, e) => sum + e.amount, 0);
  const level = Math.floor(total / XP_PER_LEVEL) + 1;
  const into = total % XP_PER_LEVEL;
  return {
    total,
    level,
    into,
    needed: XP_PER_LEVEL,
    progress: Math.round((into / XP_PER_LEVEL) * 100),
  };
}
