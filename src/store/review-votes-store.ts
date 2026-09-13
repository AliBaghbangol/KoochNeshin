"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ReviewVotesState {
  // Map of reviewId → { helpful: number, voted: boolean }
  votes: Record<string, { helpful: number; voted: boolean }>;
  toggleHelpful: (reviewId: string) => void;
  getHelpful: (reviewId: string, baseCount: number) => number;
  hasVoted: (reviewId: string) => boolean;
}

export const useReviewVotes = create<ReviewVotesState>()(
  persist(
    (set, get) => ({
      votes: {},
      toggleHelpful: (reviewId) =>
        set((s) => {
          const current = s.votes[reviewId] ?? { helpful: 0, voted: false };
          const voted = !current.voted;
          return {
            votes: {
              ...s.votes,
              [reviewId]: {
                helpful: voted ? current.helpful + 1 : Math.max(0, current.helpful - 1),
                voted,
              },
            },
          };
        }),
      getHelpful: (reviewId, baseCount) => {
        const v = get().votes[reviewId];
        if (!v) return baseCount;
        return baseCount + (v.voted ? 1 : 0);
      },
      hasVoted: (reviewId) => get().votes[reviewId]?.voted ?? false,
    }),
    { name: "kochneshin-review-votes" }
  )
);
