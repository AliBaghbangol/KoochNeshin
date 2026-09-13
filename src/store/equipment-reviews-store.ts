"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface EquipmentReview {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  date: string; // ISO
  // Equipment-specific fields
  durability?: number; // 1-5
  valueForMoney?: number; // 1-5
  wouldRecommend: boolean;
  /** Seller's reply to this review (set via `replyToReview`). */
  sellerReply?: { text: string; date: string };
}

interface EquipmentReviewsState {
  reviews: EquipmentReview[];
  addReview: (r: Omit<EquipmentReview, "id" | "date">) => void;
  replyToReview: (reviewId: string, text: string) => void;
  getForProduct: (productId: string) => EquipmentReview[];
  hasReviewed: (productId: string, author: string) => boolean;
  count: () => number;
}

function genId() {
  return `er_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Seed reviews — used when the store is first created (empty localStorage).
// Covers a few of the mock equipment IDs ("e1".."e8") so the seller dashboard
// "نظرات" tab isn't empty on first visit. Real user-submitted reviews are
// prepended above these on `addReview`.
const SEED_REVIEWS: EquipmentReview[] = [
  {
    id: "er_seed_1",
    productId: "e1",
    author: "سارا احمدی",
    rating: 5,
    comment: "چادر خیلی باکیفیتیه و در برابر باران کاملاً مقاومه. نصب راحتی داره.",
    date: "2025-01-12T10:30:00.000Z",
    durability: 5,
    valueForMoney: 4,
    wouldRecommend: true,
  },
  {
    id: "er_seed_2",
    productId: "e1",
    author: "محمدرضا کاظمی",
    rating: 4,
    comment: "کیفیت خوبه ولی وزنش کمی زیاده. در کل راضی‌ام.",
    date: "2025-01-10T08:15:00.000Z",
    durability: 4,
    valueForMoney: 4,
    wouldRecommend: true,
  },
  {
    id: "er_seed_3",
    productId: "e2",
    author: "نگار محمدی",
    rating: 5,
    comment: "کوله‌پشتی عالی، جیب‌های زیادی داره و خیلی راحته.",
    date: "2025-01-08T14:00:00.000Z",
    durability: 5,
    valueForMoney: 5,
    wouldRecommend: true,
  },
  {
    id: "er_seed_4",
    productId: "e4",
    author: "علی رضایی",
    rating: 3,
    comment: "کفش خوبه ولی سایزبندی‌اش دقیق نیست. پیشنهاد می‌کنم یک سایز بزرگ‌تر بگیرید.",
    date: "2025-01-05T19:45:00.000Z",
    durability: 4,
    valueForMoney: 3,
    wouldRecommend: false,
  },
  {
    id: "er_seed_5",
    productId: "e6",
    author: "زهرا کریمی",
    rating: 5,
    comment: "چراغ پیشانی خیلی روشنه و باتری‌اش طولانی می‌کشه. عالی بود.",
    date: "2025-01-03T11:20:00.000Z",
    durability: 5,
    valueForMoney: 5,
    wouldRecommend: true,
  },
];

export const useEquipmentReviews = create<EquipmentReviewsState>()(
  persist(
    (set, get) => ({
      reviews: SEED_REVIEWS,
      addReview: (r) =>
        set((s) => ({
          reviews: [
            { ...r, id: genId(), date: new Date().toISOString() },
            ...s.reviews,
          ],
        })),
      replyToReview: (reviewId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((s) => ({
          reviews: s.reviews.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  sellerReply: { text: trimmed, date: new Date().toISOString() },
                }
              : r
          ),
        }));
      },
      getForProduct: (productId) =>
        get().reviews.filter((r) => r.productId === productId),
      hasReviewed: (productId, author) =>
        get().reviews.some(
          (r) => r.productId === productId && r.author === author
        ),
      count: () => get().reviews.length,
    }),
    { name: "kochneshin-equipment-reviews" }
  )
);
