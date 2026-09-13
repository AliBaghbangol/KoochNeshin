"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentSearch {
  q: string;
  /** epoch ms — when this search was last executed */
  ts: number;
}

interface RecentSearchState {
  queries: RecentSearch[];
  add: (q: string) => void;
  clear: () => void;
  remove: (q: string) => void;
}

const MAX_RECENT = 6;

export const useRecentSearches = create<RecentSearchState>()(
  persist(
    (set) => ({
      queries: [],
      add: (q) => {
        const trimmed = q.trim();
        if (!trimmed || trimmed.length < 2) return;
        set((s) => ({
          queries: [
            { q: trimmed, ts: Date.now() },
            ...s.queries.filter((x) => x.q !== trimmed),
          ].slice(0, MAX_RECENT),
        }));
      },
      clear: () => set({ queries: [] }),
      remove: (q) =>
        set((s) => ({ queries: s.queries.filter((x) => x.q !== q) })),
    }),
    {
      name: "kochneshin-recent-searches",
      skipHydration: true,
      version: 1,
      // Migrate the legacy string[] shape ({q:"..."} impossible) to entries
      // with timestamps so existing users keep their history.
      migrate: (persisted) => {
        const legacy = persisted as
          | { queries?: (string | RecentSearch)[] }
          | undefined;
        const raw = Array.isArray(legacy?.queries) ? legacy!.queries! : [];
        const queries: RecentSearch[] = raw
          .map((entry) =>
            typeof entry === "string" ? { q: entry, ts: Date.now() } : entry
          )
          .filter(
            (e) => e && typeof e.q === "string" && typeof e.ts === "number"
          );
        return { queries };
      },
    }
  )
);

/** Persian relative time for a recency timestamp (e.g. «۳ دقیقه پیش»). */
export function formatRelativeTs(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "همین حالا";
  if (min < 60) return `${min.toLocaleString("fa-IR")} دقیقه پیش`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs.toLocaleString("fa-IR")} ساعت پیش`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "دیروز";
  if (days < 7) return `${days.toLocaleString("fa-IR")} روز پیش`;
  return new Date(ts).toLocaleDateString("fa-IR", {
    month: "short",
    day: "numeric",
  });
}
