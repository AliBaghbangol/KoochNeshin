// src/lib/bookings/mock-bookings.ts
/**
 * Shared mock bookings used by the dashboard and the Part 2 features
 * (Trip Room, Live Trip, Travel Stories trigger).
 *
 * Kept in `lib/` (not `mocks/`) so it is safe to import from both client
 * components and server components without pulling the whole tours array.
 *
 * TODO(backend): replace with a real `GET /api/bookings/:id` call once the
 * Django endpoints are wired. The shape matches `UserBooking` exactly so
 * the swap is a drop-in.
 */
import type { UserBooking } from "@/store/bookings-store";
import { tours } from "@/mocks/tours";

/** Seed bookings — stable IDs so `/trips/ub1/room` works as a demo URL. */
export const MOCK_BOOKINGS: UserBooking[] = [
  {
    id: "ub1",
    tourId: "t1",
    tourTitle: "صعود فصلی قله دماوند از مسیر جنوبی",
    tourImage: tours[0].images[0],
    tourDate: "2025-07-12",
    participants: 2,
    totalPrice: 5_500_000,
    status: "confirmed",
    leader: "سینا رستمی",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: "ub2",
    tourId: "t9",
    tourTitle: "کویر دشت لوت — کمپینگ ستاره‌ای",
    tourImage: tours[8].images[0],
    tourDate: "2025-07-30",
    participants: 1,
    totalPrice: 2_350_000,
    status: "pending",
    leader: "آرش کاظمی",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "ub3",
    tourId: "t13",
    tourTitle: "مرنجاب — کاروانسرا و دریاچه نمک",
    tourImage: tours[12].images[0],
    tourDate: "2025-07-23",
    participants: 3,
    totalPrice: 2_970_000,
    status: "confirmed",
    leader: "آرش کاظمی",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "ub4",
    tourId: "t4",
    tourTitle: "جنگل ابر — طبیعت‌گردی مه‌آلود",
    tourImage: tours[3].images[0],
    tourDate: "2025-06-15",
    participants: 2,
    totalPrice: 3_200_000,
    status: "cancelled",
    leader: "نگار محمدی",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    // simulate a completed trip so the Stories trigger fires on the dashboard
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
];

/**
 * Find a booking by id. Merges real user bookings (from the persisted store)
 * with the mock seeds so the demo always finds `ub1` etc.
 *
 * Call from a client component only.
 */
export function findBooking(
  userBookings: UserBooking[],
  id: string,
): UserBooking | undefined {
  return [...userBookings, ...MOCK_BOOKINGS].find((b) => b.id === id);
}
