"use client";

/**
 * Realtime store — ephemeral connection state for the trip-room socket layer.
 *
 * Deliberately NOT persisted (unlike the other koch-* stores): connection
 * status, online roster and «who is typing» are session-scoped by nature.
 * Cross-tab sync also doesn't apply here — each tab owns its own socket.
 *
 * Consumed by `useTripRealtime` (writer) and the room header / chat panel
 * (readers).
 */

import { create } from "zustand";

export interface OnlineUser {
  userId: string;
  name: string;
}

export interface RemoteTyper {
  userId: string;
  name: string;
  /** Date.now() of the last typing ping — entries older than ~4s are pruned */
  at: number;
}

interface RealtimeState {
  connected: boolean;
  /** bookingId -> unique online users (presence from trip-sync-service) */
  onlineByBooking: Record<string, OnlineUser[]>;
  /** bookingId -> active remote typers (auto-expiring) */
  typingByBooking: Record<string, RemoteTyper[]>;
  setConnected: (v: boolean) => void;
  setOnline: (bookingId: string, users: OnlineUser[]) => void;
  pingTyping: (bookingId: string, user: { userId: string; name: string }) => void;
  stopTyping: (bookingId: string, userId: string) => void;
  pruneTyping: (bookingId: string, maxAgeMs?: number) => void;
}

export const useRealtime = create<RealtimeState>()((set) => ({
  connected: false,
  onlineByBooking: {},
  typingByBooking: {},
  setConnected: (v) => set({ connected: v }),
  setOnline: (bookingId, users) =>
    set((s) => ({
      onlineByBooking: { ...s.onlineByBooking, [bookingId]: users },
    })),
  pingTyping: (bookingId, user) =>
    set((s) => {
      const list = (s.typingByBooking[bookingId] ?? []).filter(
        (t) => t.userId !== user.userId,
      );
      return {
        typingByBooking: {
          ...s.typingByBooking,
          [bookingId]: [...list, { ...user, at: Date.now() }],
        },
      };
    }),
  stopTyping: (bookingId, userId) =>
    set((s) => ({
      typingByBooking: {
        ...s.typingByBooking,
        [bookingId]: (s.typingByBooking[bookingId] ?? []).filter(
          (t) => t.userId !== userId,
        ),
      },
    })),
  pruneTyping: (bookingId, maxAgeMs = 4000) =>
    set((s) => {
      const list = s.typingByBooking[bookingId] ?? [];
      const now = Date.now();
      const fresh = list.filter((t) => now - t.at < maxAgeMs);
      if (fresh.length === list.length) return s;
      return {
        typingByBooking: { ...s.typingByBooking, [bookingId]: fresh },
      };
    }),
}));
