// src/types/live-trip.ts
/**
 * Live Trip Mode types — spec §3 of KOCHNESHIN-V19-FRONTEND-DEV-SPEC-PART2.md.
 *
 * Privacy is OFF by default (spec §3 mandatory rule). The user must
 * explicitly opt-in via the location-sharing modal on entry — never auto-on.
 */

export type LiveTripStatus = "not_started" | "active" | "completed";

export type LocationShareScope = "none" | "leader_only" | "group";

export interface LiveLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  updatedAt: string; // ISO
}

export interface LiveTripMemberStatus {
  userId: string;
  name: string;
  avatar?: string;
  lastSeenAt: string; // ISO
  batteryLevel?: number; // 0-100
  online?: boolean;
}

export interface LiveTripState {
  tripId: string;
  bookingId: string;
  status: LiveTripStatus;
  /** موقعیت فعلی کاربر — فقط روی کلاینت خودش، sync واقعی نیاز به بک‌اند دارد. */
  currentLocation?: LiveLocation;
  /** فاصله تا نقطه بعدی (km) — فعلاً mock */
  nextWaypointDistanceKm?: number;
  /** خلاصه آب‌وهوا — از weather-widget موجود خوانده می‌شود */
  weatherSummary?: string;
  members: LiveTripMemberStatus[];
  /** حریم خصوصی: پیش‌فرض "none" (خاموش) */
  shareScope: LocationShareScope;
  startedAt?: string;
}
