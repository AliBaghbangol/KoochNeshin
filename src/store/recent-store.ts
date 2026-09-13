"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentState {
  tourIds: string[];
  track: (id: string) => void;
  clear: () => void;
  count: () => number;
}

const MAX_RECENT = 8;

export const useRecent = create<RecentState>()(
  persist(
    (set, get) => ({
      tourIds: [],
      track: (id) =>
        set((s) => ({
          tourIds: [id, ...s.tourIds.filter((t) => t !== id)].slice(
            0,
            MAX_RECENT
          ),
        })),
      clear: () => set({ tourIds: [] }),
      count: () => get().tourIds.length,
    }),
    { name: "kochneshin-recent" , skipHydration: true }
  )
);
