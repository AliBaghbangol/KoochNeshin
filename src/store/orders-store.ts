"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
// Static import is safe here: the seller store binding is only dereferenced
// inside action bodies (at runtime, after both modules have fully loaded),
// never at module-evaluation time. This avoids any circular-import issues.
import { useSellerOrders } from "./seller-orders-store";

/**
 * User equipment orders (purchase or rental) — persisted to localStorage.
 *
 * When a user completes checkout for equipment, an order record is added
 * here via `addOrder`. The dashboard merges these real orders with the mock
 * seed orders so the UI is never empty but new purchases show up at the top.
 *
 * New orders start with status "processing" (just paid, not yet delivered).
 *
 * Sync with seller-orders-store:
 *   Each order created at checkout gets a `sharedOrderId` that is also stored
 *   on the matching SellerOrder record. When a seller confirms/cancels an
 *   order from their panel, the matching user-side order is updated via
 *   `markDeliveredByShared` / `markCancelledByShared`. Conversely, when a
 *   user cancels an order (`cancelOrder`), the seller side is synced.
 */

export type OrderStatus = "delivered" | "processing" | "returned";

export interface UserOrder {
  id: string;
  items: string;
  total: number;
  date: string;
  status: OrderStatus;
  createdAt: string;
  /** Shared key linking this order to its mirror in seller-orders-store. */
  sharedOrderId?: string;
  /** Populated when status transitions to "returned" due to a cancellation. */
  cancelReason?: string;
}

interface OrdersState {
  orders: UserOrder[];
  addOrder: (o: Omit<UserOrder, "id" | "createdAt">) => string;
  markDelivered: (id: string) => void;
  markReturned: (id: string) => void;
  /** Look up an order by its `sharedOrderId` and mark it delivered. */
  markDeliveredByShared: (sharedOrderId: string) => void;
  /** Look up an order by its `sharedOrderId` and mark it returned (cancelled)
   *  with an optional reason. */
  markCancelledByShared: (sharedOrderId: string, reason?: string) => void;
  /** User-initiated cancellation — also propagates to the seller store. */
  cancelOrder: (id: string, reason?: string) => void;
  count: () => number;
}

function genId() {
  return `OR-${Math.floor(1000 + Math.random() * 9000)}`;
}

export const useOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (o) => {
        const id = genId();
        set((s) => ({
          orders: [
            { ...o, id, createdAt: new Date().toISOString() },
            ...s.orders,
          ],
        }));
        return id;
      },
      markDelivered: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status: "delivered" as const } : o
          ),
        })),
      markReturned: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status: "returned" as const } : o
          ),
        })),
      markDeliveredByShared: (sharedOrderId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.sharedOrderId === sharedOrderId
              ? { ...o, status: "delivered" as const }
              : o
          ),
        })),
      markCancelledByShared: (sharedOrderId, reason) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.sharedOrderId === sharedOrderId
              ? {
                  ...o,
                  status: "returned" as const,
                  cancelReason: reason ?? o.cancelReason,
                }
              : o
          ),
        })),
      cancelOrder: (id, reason) => {
        const target = get().orders.find((o) => o.id === id);
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: "returned" as const,
                  cancelReason: reason ?? o.cancelReason,
                }
              : o
          ),
        }));
        // Propagate to seller store if a shared id exists.
        if (target?.sharedOrderId) {
          useSellerOrders
            .getState()
            .cancelOrderByShared(target.sharedOrderId, reason);
        }
      },
      count: () => get().orders.length,
    }),
    { name: "kochneshin-user-orders" }
  ),
);
