"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookingStatus } from "@/types";

/**
 * Leader bookings — persisted to localStorage.
 *
 * Seeded with mock bookings on first load. `confirmBooking` and
 * `cancelBooking` mutate the state so the UI updates immediately.
 */

export interface LeaderBooking {
  id: string;
  tourId: string;
  tourTitle: string;
  traveler: string;
  date: string;
  participants: number;
  totalPrice: number;
  status: BookingStatus;
}

const SEED_BOOKINGS: LeaderBooking[] = [
  { id: "b1", tourId: "t1", tourTitle: "صعود فصلی قله دماوند از مسیر جنوبی", traveler: "علی رضایی", date: "2025-07-12", participants: 2, totalPrice: 5500000, status: "confirmed" },
  { id: "b2", tourId: "t1", tourTitle: "صعود فصلی قله دماوند از مسیر جنوبی", traveler: "سارا کریمی", date: "2025-07-12", participants: 1, totalPrice: 2750000, status: "pending" },
  { id: "b3", tourId: "t5", tourTitle: "صعود زمستانی قله دماوند", traveler: "حسین موسوی", date: "2025-08-04", participants: 3, totalPrice: 9300000, status: "confirmed" },
  { id: "b4", tourId: "t9", tourTitle: "کویر دشت لوت — کمپینگ ستاره‌ای", traveler: "زهرا اکبری", date: "2025-07-30", participants: 2, totalPrice: 4700000, status: "pending" },
  { id: "b5", tourId: "t1", tourTitle: "صعود فصلی قله دماوند از مسیر جنوبی", traveler: "محمد جوادی", date: "2025-07-12", participants: 4, totalPrice: 11000000, status: "cancelled" },
  { id: "b6", tourId: "t5", tourTitle: "صعود زمستانی قله دماوند", traveler: "فاطمه قاسمی", date: "2025-08-04", participants: 1, totalPrice: 3100000, status: "confirmed" },
  { id: "b7", tourId: "t9", tourTitle: "کویر دشت لوت — کمپینگ ستاره‌ای", traveler: "رضا شریفی", date: "2025-07-30", participants: 5, totalPrice: 11750000, status: "confirmed" },
  { id: "b8", tourId: "t1", tourTitle: "صعود فصلی قله دماوند از مسیر جنوبی", traveler: "نگار صادقی", date: "2025-07-12", participants: 2, totalPrice: 5500000, status: "pending" },
];

interface LeaderBookingsState {
  bookings: LeaderBooking[];
  confirmBooking: (id: string) => void;
  cancelBooking: (id: string) => void;
  resetBookings: () => void;
}

export const useLeaderBookings = create<LeaderBookingsState>()(
  persist(
    (set) => ({
      bookings: SEED_BOOKINGS,
      confirmBooking: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, status: "confirmed" as const } : b
          ),
        })),
      cancelBooking: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, status: "cancelled" as const } : b
          ),
        })),
      resetBookings: () => set({ bookings: SEED_BOOKINGS }),
    }),
    { name: "kochneshin-leader-bookings" }
  ),
);
