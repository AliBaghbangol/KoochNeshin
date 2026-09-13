"use client";

/**
 * Live Trip store — spec §3.
 *
 * Privacy default is `none` (location sharing OFF). The user must explicitly
 * pick a scope via the modal on entry — never auto-on.
 *
 * The "live" feeling is local-only: position updates come from
 * `useGeolocation` (the user's own browser). Syncing to other members needs
 * a real WebSocket backend — see TODO(backend) comments.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LiveTripState,
  LiveTripStatus,
  LocationShareScope,
  LiveLocation,
} from "@/types/live-trip";

interface LiveTripStore {
  trips: Record<string, LiveTripState>;
  getTrip: (bookingId: string) => LiveTripState | undefined;
  startTrip: (
    bookingId: string,
    tourTitle: string,
    // Optional — when omitted the store falls back to DEFAULT_MEMBERS
    // (`members ?? DEFAULT_MEMBERS` below). The dashboard calls it with
    // undefined explicitly; passing `[]` there would wrongly empty the roster.
    members?: LiveTripState["members"],
  ) => void;
  setStatus: (bookingId: string, status: LiveTripStatus) => void;
  setShareScope: (bookingId: string, scope: LocationShareScope) => void;
  setLocation: (bookingId: string, loc: LiveLocation) => void;
  setWeatherSummary: (bookingId: string, summary: string) => void;
  setNextWaypoint: (bookingId: string, km: number) => void;
  /** ثبت یک SOS محلی — TODO(backend): POST /api/trips/:id/sos */
  sosTrigger: (
    bookingId: string,
    location?: LiveLocation,
  ) => { at: string; location?: LiveLocation };
}

const DEFAULT_MEMBERS: LiveTripState["members"] = [
  {
    userId: "leader_1",
    name: "علی رضایی",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces&q=80",
    lastSeenAt: new Date().toISOString(),
    batteryLevel: 78,
    online: true,
  },
  {
    userId: "sara",
    name: "سارا کریمی",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces&q=80",
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    batteryLevel: 42,
    online: true,
  },
  {
    userId: "hossein",
    name: "حسین موسوی",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=faces&q=80",
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    batteryLevel: 15,
    online: false,
  },
  {
    userId: "me",
    name: "شما",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces&q=80",
    lastSeenAt: new Date().toISOString(),
    batteryLevel: 90,
    online: true,
  },
];

export const useLiveTrip = create<LiveTripStore>()(
  persist(
    (set, get) => ({
      trips: {},
      getTrip: (bookingId) => get().trips[bookingId],
      startTrip: (bookingId, tourTitle, members) =>
        set((s) => ({
          trips: {
            ...s.trips,
            [bookingId]: {
              tripId: bookingId,
              bookingId,
              status: "active",
              members: members ?? DEFAULT_MEMBERS,
              shareScope: "none", // explicit opt-in
              startedAt: new Date().toISOString(),
              nextWaypointDistanceKm: 3.2,
            },
          },
        })),
      setStatus: (bookingId, status) =>
        set((s) => {
          const t = s.trips[bookingId];
          if (!t) return s;
          return { trips: { ...s.trips, [bookingId]: { ...t, status } } };
        }),
      setShareScope: (bookingId, scope) =>
        set((s) => {
          const t = s.trips[bookingId];
          if (!t) return s;
          return { trips: { ...s.trips, [bookingId]: { ...t, shareScope: scope } } };
        }),
      setLocation: (bookingId, loc) =>
        set((s) => {
          const t = s.trips[bookingId];
          if (!t) return s;
          return {
            trips: { ...s.trips, [bookingId]: { ...t, currentLocation: loc } },
          };
        }),
      setWeatherSummary: (bookingId, summary) =>
        set((s) => {
          const t = s.trips[bookingId];
          if (!t) return s;
          return {
            trips: { ...s.trips, [bookingId]: { ...t, weatherSummary: summary } },
          };
        }),
      setNextWaypoint: (bookingId, km) =>
        set((s) => {
          const t = s.trips[bookingId];
          if (!t) return s;
          return {
            trips: {
              ...s.trips,
              [bookingId]: { ...t, nextWaypointDistanceKm: km },
            },
          };
        }),
      sosTrigger: (bookingId, location) => {
        // TODO(backend): POST /api/trips/:id/sos with location + timestamp
        return { at: new Date().toISOString(), location };
      },
    }),
    {
      name: "koch-live-trip-v1",
      partialize: (s) => ({ trips: s.trips }),
    },
  ),
);
