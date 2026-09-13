"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
// Static import is safe here: the user orders store binding is only
// dereferenced inside action bodies (at runtime, after both modules have
// fully loaded), never at module-evaluation time. This avoids any
// circular-import issues.
import { useOrders } from "./orders-store";

/**
 * Seller orders state — front-end only.
 *
 * Mock orders are seeded once (when the store first initializes with an
 * empty array) so the seller has something to interact with. After that,
 * `confirmOrder` / `cancelOrder` mutate the persisted state and the
 * changes survive page refreshes.
 *
 * Sync with orders-store (user side):
 *   Each order created at checkout with an equipment item is mirrored into
 *   this store via `addOrder`, with the same `sharedOrderId` stored on both
 *   sides. When the seller confirms/cancels, the matching user-side order
 *   is updated through `useOrders.getState().markDeliveredByShared` /
 *   `markCancelledByShared`. Conversely, when a user cancels from their
 *   dashboard, `cancelOrderByShared` is called here.
 */

export type OrderStatus = "pending" | "confirmed" | "cancelled";
export type OrderType = "sale" | "rent";

export interface SellerOrder {
  id: string;
  customer: string;
  product: string;
  qty: number;
  total: number;
  status: OrderStatus;
  date: string;
  type: OrderType;
  /** Shared key linking this order to its mirror in orders-store. */
  sharedOrderId?: string;
  /** Populated when status transitions to "cancelled". */
  cancelReason?: string;
}

interface SellerOrdersState {
  orders: SellerOrder[];
  addOrder: (o: Omit<SellerOrder, "id">) => string;
  confirmOrder: (id: string) => void;
  cancelOrder: (id: string, reason?: string) => void;
  /** Look up by sharedOrderId and mark confirmed. */
  confirmOrderByShared: (sharedOrderId: string) => void;
  /** Look up by sharedOrderId and mark cancelled (with optional reason). */
  cancelOrderByShared: (sharedOrderId: string, reason?: string) => void;
  resetOrders: () => void;
}

// Seed data — used when the store is first created (empty localStorage).
const SEED_ORDERS: SellerOrder[] = [
  { id: "o1", customer: "سارا احمدی", product: "چادر کمپینگ دو نفره پرو", qty: 1, total: 2850000, status: "confirmed", date: "2025-01-15", type: "sale" },
  { id: "o2", customer: "محمدرضا کاظمی", product: "کوله‌پشتی ۶۵ لیتر کوهستان", qty: 1, total: 1200000, status: "pending", date: "2025-01-14", type: "sale" },
  { id: "o3", customer: "نگار محمدی", product: "اجاره چادر کمپینگ", qty: 1, total: 450000, status: "confirmed", date: "2025-01-13", type: "rent" },
  { id: "o4", customer: "علی رضایی", product: "کفش کوهنوردی حرفه‌ای", qty: 1, total: 3200000, status: "confirmed", date: "2025-01-12", type: "sale" },
  { id: "o5", customer: "زهرا کریمی", product: "اجاره کیسه خواب", qty: 2, total: 200000, status: "pending", date: "2025-01-11", type: "rent" },
  { id: "o6", customer: "حسین موسوی", product: "چراغ پیشانی LED", qty: 3, total: 540000, status: "confirmed", date: "2025-01-10", type: "sale" },
];

function genId() {
  return `o-${Math.floor(1000 + Math.random() * 9000)}`;
}

export const useSellerOrders = create<SellerOrdersState>()(
  persist(
    (set, get) => ({
      orders: SEED_ORDERS,
      addOrder: (o) => {
        const id = genId();
        set((s) => ({ orders: [{ ...o, id }, ...s.orders] }));
        return id;
      },
      confirmOrder: (id) => {
        const target = get().orders.find((o) => o.id === id);
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status: "confirmed" as const } : o
          ),
        }));
        // Propagate to user-side order.
        if (target?.sharedOrderId) {
          useOrders.getState().markDeliveredByShared(target.sharedOrderId);
        }
      },
      cancelOrder: (id, reason) => {
        const target = get().orders.find((o) => o.id === id);
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: "cancelled" as const,
                  cancelReason: reason ?? o.cancelReason,
                }
              : o
          ),
        }));
        // Propagate to user-side order.
        if (target?.sharedOrderId) {
          useOrders
            .getState()
            .markCancelledByShared(target.sharedOrderId, reason);
        }
      },
      confirmOrderByShared: (sharedOrderId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.sharedOrderId === sharedOrderId
              ? { ...o, status: "confirmed" as const }
              : o
          ),
        })),
      cancelOrderByShared: (sharedOrderId, reason) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.sharedOrderId === sharedOrderId
              ? {
                  ...o,
                  status: "cancelled" as const,
                  cancelReason: reason ?? o.cancelReason,
                }
              : o
          ),
        })),
      resetOrders: () => set({ orders: SEED_ORDERS }),
    }),
    { name: "kochneshin-seller-orders" }
  ),
);
