"use client";

import { create } from "zustand";

export interface BundleDeal {
  id: string;
  title: string;
  description: string;
  productIds: string[];
  discountPercent: number; // e.g. 15 means 15% off
  badge?: string;
  color: "emerald" | "sunset" | "gold";
}

// Predefined bundle deals — combinations of equipment that go together
export const BUNDLE_DEALS: BundleDeal[] = [
  {
    id: "camping-starter",
    title: "پکیج شروع کمپینگ",
    description: "چادر + کیسه خواب + کوله — همه‌چیز برای اولین کمپ",
    productIds: ["e1", "e2", "e3"],
    discountPercent: 15,
    badge: "محبوب",
    color: "emerald",
  },
  {
    id: "mountain-pro",
    title: "پکیج کوهنورد حرفه‌ای",
    description: "کفش + کوله + ژاکت — تجهیزات کامل برای صعود",
    productIds: ["e4", "e3", "e5"],
    discountPercent: 20,
    badge: "ویژه",
    color: "sunset",
  },
  {
    id: "budget-camper",
    title: "پکیج کم‌بودجه",
    description: "اجاق + چراغ پیشانی + کیسه خواب — سبک و اقتصادی",
    productIds: ["e6", "e7", "e2"],
    discountPercent: 10,
    badge: "اقتصادی",
    color: "gold",
  },
];

interface BundleState {
  activeBundle: string | null;
  setActiveBundle: (id: string | null) => void;
}

export const useBundleDeals = create<BundleState>((set) => ({
  activeBundle: null,
  setActiveBundle: (id) => set({ activeBundle: id }),
}));

// Helper to calculate bundle price
export function calculateBundlePrice(
  bundle: BundleDeal,
  getProduct: (id: string) => { price: number; rentPricePerDay?: number } | undefined,
  mode: "sale" | "rent" = "sale"
): { original: number; discounted: number; savings: number } {
  let original = 0;
  bundle.productIds.forEach((id) => {
    const p = getProduct(id);
    if (p) {
      original += mode === "sale" ? p.price : p.rentPricePerDay ?? 0;
    }
  });
  const discounted = Math.round(original * (1 - bundle.discountPercent / 100));
  return {
    original,
    discounted,
    savings: original - discounted,
  };
}
