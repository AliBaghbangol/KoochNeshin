"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  tourIds: string[];
  equipmentIds: string[];
  // Tour actions
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  // Equipment actions
  toggleEquipment: (id: string) => void;
  addEquipment: (id: string) => void;
  removeEquipment: (id: string) => void;
  hasEquipment: (id: string) => boolean;
  // Common
  clear: () => void;
  count: () => number;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      tourIds: [],
      equipmentIds: [],
      // Tours
      toggle: (id) =>
        set((s) => ({
          tourIds: s.tourIds.includes(id)
            ? s.tourIds.filter((t) => t !== id)
            : [...s.tourIds, id],
        })),
      add: (id) =>
        set((s) =>
          s.tourIds.includes(id)
            ? s
            : { tourIds: [...s.tourIds, id] }
        ),
      remove: (id) =>
        set((s) => ({ tourIds: s.tourIds.filter((t) => t !== id) })),
      has: (id) => get().tourIds.includes(id),
      // Equipment
      toggleEquipment: (id) =>
        set((s) => ({
          equipmentIds: s.equipmentIds.includes(id)
            ? s.equipmentIds.filter((t) => t !== id)
            : [...s.equipmentIds, id],
        })),
      addEquipment: (id) =>
        set((s) =>
          s.equipmentIds.includes(id)
            ? s
            : { equipmentIds: [...s.equipmentIds, id] }
        ),
      removeEquipment: (id) =>
        set((s) => ({
          equipmentIds: s.equipmentIds.filter((t) => t !== id),
        })),
      hasEquipment: (id) => get().equipmentIds.includes(id),
      // Common
      clear: () => set({ tourIds: [], equipmentIds: [] }),
      count: () => get().tourIds.length + get().equipmentIds.length,
    }),
    { name: "kochneshin-wishlist" , skipHydration: true }
  )
);
