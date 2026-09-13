// src/lib/live-trip/offline-cache.ts
/**
 * Offline cache for live trip critical data — spec §3 (Offline rule).
 *
 * Even without internet, the user must be able to access:
 *   - itinerary تور
 *   - شماره تماس لیدر
 *   - لیست اعضا
 *   - چک‌لیست ایمنی
 *
 * Stored in a separate localStorage key (NOT React Query cache which
 * expires) so it survives a refresh and an offline reload.
 *
 * "use client" — call only from client components.
 */
import type { ItineraryDay } from "@/types";

export interface OfflineTripData {
  itinerary: ItineraryDay[];
  leaderContact: string;
  leaderName: string;
  members: { name: string; avatar?: string }[];
  safetyChecklist: string[];
  cachedAt: string; // ISO
}

const KEY = (tripId: string) => `koch-trip-offline:${tripId}`;

export function cacheOfflineTripData(tripId: string, data: OfflineTripData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(tripId), JSON.stringify(data));
  } catch {
    /* localStorage might be full — silently ignore */
  }
}

export function readOfflineTripData(tripId: string): OfflineTripData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY(tripId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfflineTripData;
  } catch {
    return null;
  }
}

export function clearOfflineTripData(tripId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY(tripId));
}

/** True if the browser reports it is offline. */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
