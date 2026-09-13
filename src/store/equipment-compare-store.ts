"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EquipmentCompareState {
  productIds: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const MAX_COMPARE = 3;

export const useEquipmentCompare = create<EquipmentCompareState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (id) =>
        set((s) => {
          if (s.productIds.includes(id)) {
            return { productIds: s.productIds.filter((p) => p !== id) };
          }
          if (s.productIds.length >= MAX_COMPARE) {
            return { productIds: [...s.productIds.slice(1), id] };
          }
          return { productIds: [...s.productIds, id] };
        }),
      remove: (id) =>
        set((s) => ({ productIds: s.productIds.filter((p) => p !== id) })),
      clear: () => set({ productIds: [] }),
      has: (id) => get().productIds.includes(id),
    }),
    { name: "kochneshin-equipment-compare" }
  )
);
