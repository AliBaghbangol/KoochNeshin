"use client";

/**
 * Travel Buddy store — spec §5.
 *
 * Symmetry rule (mandatory per spec): a user who has NOT opted in cannot see
 * other candidates. `optedIn` is OFF by default — never auto-on.
 *
 * TODO(backend): replace seed + request lifecycle with real API:
 *   - GET  /api/tours/:id/buddies?dna=...
 *   - POST /api/tours/:id/buddy/opt-in
 *   - POST /api/buddies/:id/request
 *   - POST /api/buddies/:id/accept
 *   - POST /api/buddies/:id/block
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TravelDNAScores } from "@/types/dna";
import type {
  TravelBuddyCandidate,
  BuddyRequestStatus,
} from "@/types/travel-buddy";
import { computeMatchScore, dnaHighlights } from "@/lib/travel-buddy/compute-match-score";

interface BuddyState {
  /** آیا کاربر فعلی opt-in کرده — پیش‌فرض false. */
  optedIn: boolean;
  tourId: string | null;
  candidates: TravelBuddyCandidate[];
  /** بلاک‌شده‌ها (frontend only) */
  blockedIds: string[];
  setOptedIn: (v: boolean, tourId?: string) => void;
  setTour: (tourId: string, myDna: TravelDNAScores | null) => void;
  sendRequest: (userId: string) => void;
  /** برای دمو — شبیه‌سازی پاسخ مثبت از طرف مقابل */
  simulateAccept: (userId: string) => void;
  block: (userId: string) => void;
  /** لیست نهایی پس از حذف بلاک‌شده‌ها */
  visibleCandidates: () => TravelBuddyCandidate[];
}

const SEED_CANDIDATES: Array<
  Omit<TravelBuddyCandidate, "matchScore" | "highlights" | "requestStatus">
> = [
  {
    userId: "sara",
    name: "سارا کریمی",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80",
    rating: 4.9,
    tripsCount: 14,
    dna: { explorer: 88, adventurer: 92, social: 70, natureLover: 85 },
  },
  {
    userId: "hossein",
    name: "حسین موسوی",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces&q=80",
    rating: 4.7,
    tripsCount: 9,
    dna: { explorer: 75, adventurer: 80, social: 60, natureLover: 90 },
  },
  {
    userId: "negin",
    name: "نگار محمدی",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
    rating: 5.0,
    tripsCount: 22,
    dna: { explorer: 95, adventurer: 70, social: 90, natureLover: 80 },
  },
  {
    userId: "reza",
    name: "رضا احمدی",
    avatar:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=faces&q=80",
    rating: 4.6,
    tripsCount: 6,
    dna: { explorer: 60, adventurer: 95, social: 50, natureLover: 75 },
  },
  {
    userId: "maryam",
    name: "مریم حسینی",
    avatar:
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=faces&q=80",
    rating: 4.8,
    tripsCount: 11,
    dna: { explorer: 82, adventurer: 65, social: 85, natureLover: 92 },
  },
];

const DEFAULT_DNA: TravelDNAScores = {
  explorer: 80,
  adventurer: 75,
  social: 70,
  natureLover: 78,
};

export const MY_DEFAULT_DNA = DEFAULT_DNA;

function withMeta(
  c: (typeof SEED_CANDIDATES)[number],
  myDna: TravelDNAScores,
): TravelBuddyCandidate {
  return {
    ...c,
    matchScore: computeMatchScore(myDna, c.dna),
    highlights: dnaHighlights(c.dna),
    requestStatus: "none",
  };
}

export const useTravelBuddy = create<BuddyState>()(
  persist(
    (set, get) => ({
      optedIn: false,
      tourId: null,
      candidates: SEED_CANDIDATES.map((c) => withMeta(c, DEFAULT_DNA)),
      blockedIds: [],
      setOptedIn: (v, tourId) =>
        set((s) => ({
          optedIn: v,
          tourId: tourId ?? s.tourId,
        })),
      setTour: (tourId, myDna) =>
        set((s) => ({
          tourId,
          candidates: SEED_CANDIDATES.map((c) =>
            withMeta(c, myDna ?? DEFAULT_DNA),
          ),
        })),
      sendRequest: (userId) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.userId === userId ? { ...c, requestStatus: "pending" } : c,
          ),
        })),
      simulateAccept: (userId) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.userId === userId
              ? { ...c, requestStatus: "matched" }
              : c,
          ),
        })),
      block: (userId) =>
        set((s) => ({
          blockedIds: [...new Set([...s.blockedIds, userId])],
        })),
      visibleCandidates: () => {
        const { candidates, blockedIds } = get();
        return candidates.filter((c) => !blockedIds.includes(c.userId));
      },
    }),
    {
      name: "koch-travel-buddy-v1",
      partialize: (s) => ({
        optedIn: s.optedIn,
        tourId: s.tourId,
        blockedIds: s.blockedIds,
      }),
    },
  ),
);
