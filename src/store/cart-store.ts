"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  addTour: (item: Omit<CartItem, "id" | "type"> & { id?: string }) => void;
  addEquipment: (
    item: Omit<CartItem, "id"> & { type: "equipment-sale" | "equipment-rent" }
  ) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

function genId() {
  return `ci_${Math.random().toString(36).slice(2, 9)}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addTour: (item) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              ...item,
              id: item.id ?? genId(),
              type: "tour" as const,
            },
          ],
        })),
      addEquipment: (item) =>
        set((s) => ({
          items: [...s.items, { ...item, id: genId() }],
        })),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, qty) } : i
          ),
        })),
      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      count: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "kochneshin-cart" , skipHydration: true }
  )
);
