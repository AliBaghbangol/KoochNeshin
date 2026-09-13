"use client";

/**
 * Trip-room realtime layer — the first slice of real WebSocket sync (v22).
 *
 * ── CONTRACT (shared with mini-services/trip-sync-service/index.ts) ─────────
 * join      { bookingId, user: {id, name}, clientId }         client → server
 * presence  { bookingId, online: [{userId, name}], count, ts } server → client
 * tr        { bookingId, kind, payload, origin, ts }           both ways
 *
 * `tr` kinds (payload):
 *  - msg:new      TripRoomMessage (full, id already assigned)
 *  - msg:delete   { messageId }
 *  - msg:react    { messageId, emoji, userId, add }     (explicit, idempotent)
 *  - msg:pin      { messageId, pinned, byName }          (explicit, idempotent)
 *  - ann:new      TripRoomAnnouncement (full)
 *  - ann:pin      { announcementId, pinned }
 *  - cl:add       TripRoomChecklistItem (full)
 *  - cl:toggle    { itemId, done, userId, userName }     (explicit)
 *  - cl:remove    { itemId }
 *  - poll:new     { poll: TripRoomPoll, authorName }
 *  - poll:vote    { pollId, optionId, userId }           (explicit single-choice)
 *  - poll:close   { pollId }
 *  - exp:upsert   GroupExpense (full)
 *  - exp:remove   { expenseId }
 *  - settled:set  SettledTransfer[] (full list for the booking)
 *  - budgets:set  ExpenseBudgets (full map for the booking)
 *  - typing       { userId, name, isTyping }
 *
 * Dedup model: the server relays with `socket.broadcast` (no echo to sender).
 * Events whose `origin` equals OUR browser clientId are dropped because the
 * same browser already syncs those via the `storage` event (cross-tab.ts) —
 * so toggle-shaped ops can never double-apply. All list-shaped appliers are
 * idempotent upserts anyway.
 *
 * TODO(backend): swap this demo relay for the production gateway that also
 * authenticates users and persists history — the envelope contract stays.
 */

import { io, type Socket } from "socket.io-client";
import { useRealtime } from "@/store/realtime-store";

const STORAGE_KEY = "koch-client-id";
const TYPING_PING_MS = 2000;

let socket: Socket | null = null;
let boundStore = false;

/** Stable per-browser id (localStorage) — used to drop same-origin relays. */
export function getClientId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "c_anon";
  }
}

/** Lazy singleton — safe on SSR (returns null) and before first use. */
export function getTripSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) {
    // Never use PORT in the URL, always use XTransformPort.
    // DO NOT change the path, it is used by Caddy to forward to the right port.
    socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socket.on("connect", () => useRealtime.getState().setConnected(true));
    socket.on("disconnect", () => useRealtime.getState().setConnected(false));
    socket.on("connect_error", () => useRealtime.getState().setConnected(false));
  }
  if (!boundStore) {
    boundStore = true;
    if (socket.connected) useRealtime.getState().setConnected(true);
  }
  return socket;
}

/** Fire-and-forget relay emit — silently no-ops while offline / on SSR. */
export function emitLive(
  bookingId: string,
  kind: string,
  payload: unknown,
): void {
  const s = getTripSocket();
  if (!s?.connected) return;
  s.emit("tr", {
    bookingId,
    kind,
    payload,
    origin: getClientId(),
    ts: Date.now(),
  });
}

/* ---------------- outgoing typing helpers (throttled) ---------------- */

let lastTypingPing = 0;
let typingActive = false;

export function emitTypingStart(
  bookingId: string,
  user: { userId: string; name: string },
): void {
  const now = Date.now();
  if (now - lastTypingPing < TYPING_PING_MS && typingActive) return;
  lastTypingPing = now;
  typingActive = true;
  emitLive(bookingId, "typing", { ...user, isTyping: true });
}

export function emitTypingStop(
  bookingId: string,
  user: { userId: string; name: string },
): void {
  if (!typingActive) return;
  typingActive = false;
  emitLive(bookingId, "typing", { ...user, isTyping: false });
}
