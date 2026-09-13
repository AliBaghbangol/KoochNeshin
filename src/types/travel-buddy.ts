// src/types/travel-buddy.ts
/**
 * Travel Buddy types — spec §5 of KOCHNESHIN-V19-FRONTEND-DEV-SPEC-PART2.md.
 *
 * Privacy (mandatory per spec):
 *  - `phone` is NEVER part of `TravelBuddyCandidate` — only revealed after an
 *    explicit match + backend-enforced consent.
 *  - age / gender are NOT included by default.
 */

import type { TravelDNAScores } from "@/types/dna";

export type BuddyRequestStatus = "none" | "pending" | "matched" | "declined";

export interface TravelBuddyPreference {
  userId: string;
  tourId: string;
  optedIn: boolean;
  /** فیلدهایی که کاربر اجازه می‌دهد در کارت کاندید دیده شوند */
  visibleFields: ("name" | "avatar" | "dna" | "tripsCount")[];
}

export interface TravelBuddyCandidate {
  userId: string;
  name: string;
  avatar?: string;
  rating: number;
  tripsCount: number;
  dna: TravelDNAScores;
  matchScore: number;
  /** وضعیت درخواست کاربر فعلی به این کاندید */
  requestStatus: BuddyRequestStatus;
  /** علایق برجسته (از dna برگرفته می‌شود) */
  highlights: string[];
}
