"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompareState {
  tourIds: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      tourIds: [],
      toggle: (id) =>
        set((s) => ({
          tourIds: s.tourIds.includes(id)
            ? s.tourIds.filter((t) => t !== id)
            : [...s.tourIds, id].slice(-4),
        })),
      remove: (id) =>
        set((s) => ({ tourIds: s.tourIds.filter((t) => t !== id) })),
      clear: () => set({ tourIds: [] }),
      has: (id) => get().tourIds.includes(id),
    }),
    { name: "kochneshin-compare" , skipHydration: true }
  )
);
