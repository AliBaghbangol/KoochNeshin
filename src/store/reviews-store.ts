"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserReview {
  id: string;
  tourId: string;
  author: string;
  rating: number;
  comment: string;
  date: string; // ISO
}

interface ReviewsState {
  reviews: UserReview[];
  addReview: (r: Omit<UserReview, "id" | "date">) => void;
  getForTour: (tourId: string) => UserReview[];
  hasReviewed: (tourId: string, author: string) => boolean;
  count: () => number;
}

function genId() {
  return `ur_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useReviews = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],
      addReview: (r) =>
        set((s) => ({
          reviews: [
            { ...r, id: genId(), date: new Date().toISOString() },
            ...s.reviews,
          ],
        })),
      getForTour: (tourId) =>
        get().reviews.filter((r) => r.tourId === tourId),
      hasReviewed: (tourId, author) =>
        get().reviews.some(
          (r) => r.tourId === tourId && r.author === author
        ),
      count: () => get().reviews.length,
    }),
    { name: "kochneshin-reviews" }
  )
);
