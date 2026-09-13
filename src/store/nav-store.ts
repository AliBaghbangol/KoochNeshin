"use client";

import { create } from "zustand";

export type ViewName =
  | "home"
  | "tours"
  | "tour-detail"
  | "leader-profile"
  | "leader-dashboard"
  | "seller-dashboard"
  | "admin-dashboard"
  | "equipment"
  | "product-detail"
  | "cart"
  | "checkout"
  | "auth"
  | "user-dashboard"
  | "about"
  | "contact"
  | "blog"
  | "blog-detail"
  | "destinations"
  | "category"
  | "planner"
  | "trip-room"
  | "live-trip"
  | "stories"
  | "story-detail"
  | "safety-center"
  | "buddies"
  | "not-found";

interface NavState {
  view: ViewName;
  params: Record<string, string>;
  history: { view: ViewName; params: Record<string, string> }[];
  compareOpen: boolean;
  authOpen: boolean;
  cartOpen: boolean;
  equipCompareOpen: boolean;
  wishlistOpen: boolean;
  go: (view: ViewName, params?: Record<string, string>) => void;
  back: () => void;
  setCompareOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setEquipCompareOpen: (open: boolean) => void;
  setWishlistOpen: (open: boolean) => void;
}

export const useNav = create<NavState>((set, get) => ({
  view: "home",
  params: {},
  history: [],
  compareOpen: false,
  authOpen: false,
  cartOpen: false,
  equipCompareOpen: false,
  wishlistOpen: false,
  go: (view, params = {}) => {
    const { view: curView, params: curParams, history } = get();
    if (curView === view && JSON.stringify(curParams) === JSON.stringify(params))
      return;
    set({
      view,
      params,
      history: [...history, { view: curView, params: curParams }].slice(-30),
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  back: () => {
    const { history } = get();
    if (history.length === 0) {
      set({ view: "home", params: {} });
      return;
    }
    const last = history[history.length - 1];
    set({ view: last.view, params: last.params, history: history.slice(0, -1) });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  setCompareOpen: (open) => set({ compareOpen: open }),
  setAuthOpen: (open) => set({ authOpen: open }),
  setCartOpen: (open) => set({ cartOpen: open }),
  setEquipCompareOpen: (open) => set({ equipCompareOpen: open }),
  setWishlistOpen: (open) => set({ wishlistOpen: open }),
}));
