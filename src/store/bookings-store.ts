"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookingStatus } from "@/types";

/**
 * User tour bookings — persisted to localStorage.
 *
 * When a user completes checkout for a tour, a booking record is added here
 * via `addBooking`. The dashboard merges these real bookings with the mock
 * seed bookings so the UI is never empty but new purchases show up at the top.
 */
export interface UserBooking {
  id: string;
  tourId: string;
  tourTitle: string;
  tourImage: string;
  tourDate: string;
  participants: number;
  totalPrice: number;
  status: BookingStatus;
  leader: string;
  createdAt: string;
  /**
   * Optional timestamp marking when the trip actually ended in the real world.
   * Used by Travel Stories (spec §6) to trigger the "share your memories"
   * prompt on the dashboard. Non-destructive — older bookings simply have
   * `undefined` here.
   *
   * TODO(backend): the backend should set this when the tour's end date
   * passes and the leader marks the trip as completed.
   */
  completedAt?: string;
}

interface BookingsState {
  bookings: UserBooking[];
  addBooking: (b: Omit<UserBooking, "id" | "createdAt">) => string;
  cancelBooking: (id: string) => void;
  count: () => number;
  /** Mark a booking as completed (non-destructive — sets `completedAt`). */
  completeBooking: (id: string) => void;
}

function genId() {
  return `booking_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useBookings = create<BookingsState>()(
  persist(
    (set, get) => ({
      bookings: [],
      addBooking: (b) => {
        const id = genId();
        set((s) => ({
          bookings: [
            { ...b, id, createdAt: new Date().toISOString() },
            ...s.bookings,
          ],
        }));
        return id;
      },
      cancelBooking: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, status: "cancelled" as BookingStatus } : b
          ),
        })),
      completeBooking: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id && !b.completedAt
              ? { ...b, completedAt: new Date().toISOString() }
              : b,
          ),
        })),
      count: () => get().bookings.length,
    }),
    { name: "kochneshin-user-bookings" }
  ),
);
