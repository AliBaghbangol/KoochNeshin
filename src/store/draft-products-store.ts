"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EquipmentProduct } from "@/types";

/**
 * Draft products created by sellers in the front-end only (no backend).
 * Mirrors the pattern of `draft-tours-store.ts` — persisted to localStorage
 * via Zustand `persist` so they survive page refreshes.
 *
 * Each product is tagged with `sellerId` (the logged-in user's id) so
 * multiple sellers can coexist without seeing each other's products.
 */
export interface DraftProduct extends Omit<EquipmentProduct, "id" | "rating"> {
  id: string;
  /** Default 5 for freshly created products (no reviews yet). */
  rating: number;
  sellerId: string;
  createdAt: string;
  status: "draft" | "active";
}

interface DraftProductsState {
  products: DraftProduct[];
  addProduct: (p: Omit<DraftProduct, "id" | "createdAt">) => string;
  updateProduct: (id: string, updates: Partial<DraftProduct>) => void;
  removeProduct: (id: string) => void;
  duplicateProduct: (id: string) => string | null;
  getBySeller: (sellerId: string) => DraftProduct[];
  count: () => number;
}

function genId() {
  return `product_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useDraftProducts = create<DraftProductsState>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (p) => {
        const id = genId();
        set((s) => ({
          // newest first — matches draft-tours-store convention
          products: [
            { ...p, id, createdAt: new Date().toISOString() },
            ...s.products,
          ],
        }));
        return id;
      },
      updateProduct: (id, updates) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removeProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      duplicateProduct: (id) => {
        const src = get().products.find((p) => p.id === id);
        if (!src) return null;
        const newId = genId();
        set((s) => ({
          products: [
            {
              ...src,
              id: newId,
              title: `${src.title} (کپی)`,
              createdAt: new Date().toISOString(),
              stock: src.stock, // preserve stock
            },
            ...s.products,
          ],
        }));
        return newId;
      },
      getBySeller: (sellerId) =>
        get().products.filter((p) => p.sellerId === sellerId),
      count: () => get().products.length,
    }),
    { name: "kochneshin-draft-products" }
  ),
);
