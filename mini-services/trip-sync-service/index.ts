/**
 * trip-sync-service — KOCHNESHIN (کوچ‌نشین) v22
 *
 * Realtime relay for the Trip Room, implemented as a standalone mini-service
 * (socket.io on port 3003). This is the first slice of the real WebSocket
 * backend the frontend has been waiting for (the `TODO(backend)` comments in
 * `src/store/trip-room-store.ts` / `src/store/group-expenses-store.ts`).
 *
 * DESIGN — dumb relay + presence:
 *  - The Next.js client keeps owning the state (zustand + persist). The server
 *    NEVER stores room data; it only relays `tr` envelopes to everyone else in
 *    the booking room (`socket.broadcast` ⇒ sender never sees its own echo).
 *  - `origin` (browser clientId) lets receivers drop events that came from the
 *    same browser (those already arrive via the cross-tab `storage` sync), so
 *    the two channels never double-apply.
 *  - Toggle-shaped ops (reactions, pins, checklist) are emitted as EXPLICIT
 *    target state by the client, so relay is exactly-once idempotent.
 *  - Presence is per bookingId: sessions join with {userId, name, clientId};
 *    the server broadcasts the unique-online list on every join/leave.
 *
 * TODO(backend): replace this demo relay with the production Django Channels
 * (or socket.io gateway) that also authenticates sessions and persists data.
 * The client speaks the exact envelope contract documented in
 * `src/lib/realtime/trip-socket.ts`.
 */

import { createServer } from "http";
import { Server, type Socket } from "socket.io";

const PORT = 3003;

const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 128 * 1024, // relay payloads are tiny; guard against abuse
});

interface SessionInfo {
  userId: string;
  name: string;
  clientId: string;
  joinedAt: number;
}

/** bookingId -> socketId -> session */
const rooms = new Map<string, Map<string, SessionInfo>>();

const BOOKING_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function getRoom(bookingId: string): Map<string, SessionInfo> {
  let room = rooms.get(bookingId);
  if (!room) {
    room = new Map();
    rooms.set(bookingId, room);
  }
  return room;
}

/** Unique online users of one booking (dedup by userId, first session wins). */
function onlineListOf(bookingId: string): { userId: string; name: string }[] {
  const room = rooms.get(bookingId);
  if (!room) return [];
  const seen = new Set<string>();
  const list: { userId: string; name: string }[] = [];
  for (const s of room.values()) {
    if (seen.has(s.userId)) continue;
    seen.add(s.userId);
    list.push({ userId: s.userId, name: s.name });
  }
  return list;
}

function broadcastPresence(bookingId: string) {
  const online = onlineListOf(bookingId);
  io.to(`br:${bookingId}`).emit("presence", {
    bookingId,
    online,
    count: rooms.get(bookingId)?.size ?? 0,
    ts: Date.now(),
  });
}

/** Naive per-socket rate limit for relayed events. */
const relayTimestamps = new Map<string, number[]>();
function allowRelay(socket: Socket): boolean {
  const now = Date.now();
  const windowStart = now - 10_000;
  const list = (relayTimestamps.get(socket.id) ?? []).filter(
    (t) => t > windowStart,
  );
  if (list.length >= 120) {
    relayTimestamps.set(socket.id, list);
    return false;
  }
  list.push(now);
  relayTimestamps.set(socket.id, list);
  return true;
}

io.on("connection", (socket) => {
  let currentBooking: string | null = null;

  socket.on("join", (data: {
    bookingId?: unknown;
    user?: { id?: unknown; name?: unknown };
    clientId?: unknown;
  }) => {
    const bookingId = typeof data?.bookingId === "string" ? data.bookingId : "";
    if (!BOOKING_RE.test(bookingId)) return;
    const userId = typeof data?.user?.id === "string" ? data.user.id.slice(0, 64) : "anon";
    const name = typeof data?.user?.name === "string" ? data.user.name.slice(0, 64) : "مهمان";
    const clientId = typeof data?.clientId === "string" ? data.clientId.slice(0, 64) : socket.id;

    // leave previous booking if the socket re-joined elsewhere
    if (currentBooking && currentBooking !== bookingId) {
      rooms.get(currentBooking)?.delete(socket.id);
      broadcastPresence(currentBooking);
    }

    currentBooking = bookingId;
    getRoom(bookingId).set(socket.id, {
      userId,
      name,
      clientId,
      joinedAt: Date.now(),
    });
    void socket.join(`br:${bookingId}`);

    // tell the newcomer who is already online, then everyone the new list
    socket.emit("presence", {
      bookingId,
      online: onlineListOf(bookingId),
      count: rooms.get(bookingId)?.size ?? 0,
      ts: Date.now(),
    });
    broadcastPresence(bookingId);
  });

  /** Generic relay envelope — validated then broadcast minus sender. */
  socket.on("tr", (env: {
    bookingId?: unknown;
    kind?: unknown;
    payload?: unknown;
    origin?: unknown;
    ts?: unknown;
  }) => {
    if (!currentBooking || !allowRelay(socket)) return;
    const bookingId = typeof env?.bookingId === "string" ? env.bookingId : "";
    if (bookingId !== currentBooking || !BOOKING_RE.test(bookingId)) return;
    const kind = typeof env?.kind === "string" ? env.kind : "";
    if (!/^[a-z:]{2,32}$/.test(kind)) return;
    if (env?.payload === undefined || env.payload === null) return;

    socket.broadcast.to(`br:${bookingId}`).emit("tr", {
      bookingId,
      kind,
      payload: env.payload,
      origin: typeof env.origin === "string" ? env.origin : socket.id,
      ts: typeof env.ts === "number" ? env.ts : Date.now(),
    });
  });

  socket.on("disconnect", () => {
    relayTimestamps.delete(socket.id);
    if (!currentBooking) return;
    const room = rooms.get(currentBooking);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) rooms.delete(currentBooking);
    }
    broadcastPresence(currentBooking);
  });

  socket.on("error", (err) => {
    console.error(`socket error (${socket.id}):`, err);
  });
});

httpServer.listen(PORT, () => {
  console.log(`trip-sync-service (socket.io) listening on port ${PORT}`);
});

process.on("SIGTERM", () => {
  httpServer.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  httpServer.close(() => process.exit(0));
});
