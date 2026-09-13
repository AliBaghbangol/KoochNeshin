"use client";

import { useDraftTours, type DraftTour } from "@/store/draft-tours-store";
import { tours as mockTours } from "@/mocks/tours";
import type { Tour, TourCategory, Difficulty, TourStatus } from "@/types";

/**
 * Converts a DraftTour (created by a leader in the front-end) into a full
 * Tour object that can be displayed anywhere tours are shown (tours list,
 * tour detail, home page, etc.).
 *
 * Fields that DraftTour doesn't have (rating, reviewsCount, reservedCount,
 * reviews, leader, coordinates, badges) get sensible defaults.
 */
function draftToTour(d: DraftTour, leaderId: string): Tour {
  const lid = d.leaderId ?? leaderId; // prefer draft's own leaderId
  const images = d.imageUrl
    ? [d.imageUrl]
    : [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop&q=80",
      ];

  return {
    id: d.id,
    title: d.title,
    destination: d.destination,
    province: d.province,
    leaderId: lid,
    leader: {
      id: lid,
      fullName: "لیدر تور",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80",
      rating: 5,
      experienceYears: 1,
      verificationStatus: "verified",
    },
    price: d.price,
    discountPrice: d.discountPrice,
    duration: d.duration,
    capacity: d.capacity,
    reservedCount: 0,
    startDate: d.startDate,
    images,
    category: d.category as TourCategory,
    difficulty: d.difficulty as Difficulty,
    itinerary: d.itinerary,
    facilities: d.facilities,
    rating: 5,
    reviewsCount: 0,
    reviews: [],
    status: (d.status === "active" ? "active" : "draft") as TourStatus,
    coordinates: {
      lat: d.lat ?? 35.6892,
      lng: d.lng ?? 51.3890,
    },
    badges: ["جدید"],
  };
}

/**
 * Returns all tours visible to users: published draft tours (created by
 * leaders, status="active") merged with the mock seed tours.
 *
 * Published drafts appear FIRST (newest at top), so a leader's freshly
 * published tour is immediately visible.
 */
export function useAllTours(leaderId?: string): Tour[] {
  const draftTours = useDraftTours((s) => s.tours);
  const lid = leaderId ?? "draft-leader";
  const published = draftTours
    .filter((d) => d.status === "active")
    .map((d) => draftToTour(d, lid));
  return [...published, ...mockTours];
}

/**
 * Returns a specific leader's tours: their draft tours (any status, including
 * drafts and active) converted to Tour objects + any mock seed tours whose
 * `leaderId` matches (covers the demo leader `l1` etc.). Used by the leader
 * dashboard so that real leaders (whose `user.id` is not "l1") also see their
 * own draft tours instead of always getting an empty array.
 */
export function useMyTours(userId: string): Tour[] {
  const draftTours = useDraftTours((s) => s.tours);
  const myDrafts = draftTours
    .filter((d) => d.leaderId === userId)
    .map((d) => draftToTour(d, userId));
  const myMockTours = mockTours.filter((t) => t.leaderId === userId);
  return [...myDrafts, ...myMockTours];
}

/**
 * Non-hook version for places that can't use hooks (e.g. utility functions).
 * Reads from the store's current state.
 */
export function getAllTours(leaderId?: string): Tour[] {
  const lid = leaderId ?? "draft-leader";
  const draftTours = useDraftTours.getState().tours;
  const published = draftTours
    .filter((d) => d.status === "active")
    .map((d) => draftToTour(d, lid));
  return [...published, ...mockTours];
}
