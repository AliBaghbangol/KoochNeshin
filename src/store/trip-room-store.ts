"use client";

/**
 * Trip Room store — spec §2.
 *
 * ⚠️ SECURITY NOTE FOR THE NEXT AGENT: every access-level check in this
 * file (and in the components that consume it) is **frontend-only UX**.
 * The real authorization MUST happen in the Django/DRF backend on every
 * request. Treat these flags as hints for which buttons to show, never as
 * a security boundary. See the `can*` helpers below.
 *
 * Implementation: zustand + persist (localStorage). The "realtime" feel is
 * faked by a small self-poll: `tick()` is called every few seconds by the
 * `useTripRoomMessages` hook (see `src/data/use-trip-room.ts`) and rotates
 * a queue of canned mock messages so the room feels alive in the demo.
 * TODO(backend): replace with WebSocket subscription (`trip_room:*` events).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  TripRoom,
  TripRoomMessage,
  TripRoomAccessLevel,
  TripRoomAnnouncement,
  TripRoomPoll,
  TripRoomChecklistItem,
} from "@/types/trip-room";
import type { UserBooking } from "@/store/bookings-store";
import { enableCrossTabSync } from "@/lib/cross-tab";
import { emitLive } from "@/lib/realtime/trip-socket";

/**
 * v22: realtime relay — every collaborative mutation also emits a `tr`
 * envelope to the trip-sync-service (other browsers apply it via
 * `applyRemote`). Same-browser tabs keep syncing through the `storage`
 * event (cross-tab), and same-origin relays are dropped on arrival, so the
 * two channels never double-apply. Toggle-shaped ops emit EXPLICIT target
 * state (add/done/pinned) instead of a toggle, keeping the relay idempotent.
 *
 * TODO(backend): replace the relay with the production WebSocket gateway
 * that authenticates + persists; envelope contract in
 * `src/lib/realtime/trip-socket.ts`.
 */

/** آخرین بار که یک پیام واقعی از مرورگر دیگری آمد — رباتِ دمو تا ۴۵ث ساکت می‌ماند */
let lastRemoteMsgAt = 0;

interface TripRoomState {
  rooms: Record<string, TripRoom>; // bookingId -> room
  /** booking whose room is currently open in the UI */
  activeBookingId: string | null;
  setActive: (bookingId: string | null) => void;
  ensureRoom: (booking: UserBooking) => TripRoom;
  getRoom: (bookingId: string) => TripRoom | undefined;
  sendMessage: (bookingId: string, msg: Omit<TripRoomMessage, "id" | "createdAt">) => void;
  deleteMessage: (bookingId: string, messageId: string) => void;
  toggleReaction: (bookingId: string, messageId: string, emoji: string, userId: string) => void;
  markMessagesRead: (bookingId: string, messageIds: string[], userId: string) => void;
  /** سنجاق/برداشتن سنجاق پیام — فقط لیدر/ادمین (frontend gate) */
  togglePinMessage: (bookingId: string, messageId: string, byName: string) => void;
  addAnnouncement: (bookingId: string, a: Omit<TripRoomAnnouncement, "id" | "createdAt">) => void;
  togglePinAnnouncement: (bookingId: string, announcementId: string) => void;
  toggleChecklist: (bookingId: string, itemId: string, userId: string, userName: string) => void;
  /** افزودن آیتم دلخواه به چک‌لیست توسط هر عضو (v21.9) */
  addChecklistItem: (bookingId: string, label: string, userId: string, userName: string) => void;
  /** حذف آیتم دلخواه — فقط اضافه‌کننده یا لیدر/ادمین (frontend gate) */
  removeChecklistItem: (bookingId: string, itemId: string) => void;
  votePoll: (bookingId: string, pollId: string, optionId: string, userId: string) => void;
  addPoll: (bookingId: string, question: string, options: string[], authorId: string, authorName: string) => void;
  closePoll: (bookingId: string, pollId: string) => void;
  /** self-poll helper — rotates a small queue of mock messages */
  tick: (bookingId: string) => void;
  setStatus: (bookingId: string, status: TripRoom["status"]) => void;
  /** v22 — apply a relayed remote mutation (from trip-sync-service) */
  applyRemote: (bookingId: string, kind: string, payload: unknown) => void;
  /** v22 — mirror the live presence roster onto `members[].online` */
  applyPresence: (bookingId: string, onlineIds: string[]) => void;
}

function genId(prefix = "m") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** کاربر فعلی — در پروژه واقعی از auth-store می‌آید؛ فعلاً mock پایدار. */
const ME = {
  id: "me",
  name: "شما",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces&q=80",
};

/** اعضای mock گروه — برای دمو. لیدر همیشه اول است. */
const MOCK_MEMBERS = [
  {
    userId: "leader_1",
    name: "علی رضایی",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces&q=80",
    role: "leader" as const,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    online: true,
  },
  {
    userId: "sara",
    name: "سارا کریمی",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces&q=80",
    role: "traveler" as const,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    online: true,
  },
  {
    userId: "hossein",
    name: "حسین موسوی",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=faces&q=80",
    role: "traveler" as const,
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    online: false,
  },
  {
    userId: ME.id,
    name: ME.name,
    avatar: ME.avatar,
    role: "traveler" as const,
    joinedAt: new Date().toISOString(),
    online: true,
  },
];

const DEFAULT_CHECKLIST: TripRoomChecklistItem[] = [
  { id: "cl_members", label: "لیست اعضا تأیید شد", done: true },
  { id: "cl_emergency", label: "اطلاعات تماس اضطراری ثبت شد", done: false },
  { id: "cl_firstaid", label: "کمک‌های اولیه بررسی شد", done: false },
  { id: "cl_weather", label: "بررسی وضعیت آب‌وهوا", done: true },
  { id: "cl_gear", label: "بررسی تجهیزات گروه", done: false },
  { id: "cl_route", label: "بررسی مسیر و نقاط استراحت", done: false },
];

/** پیام‌های mock که `tick` یکی‌یکی تزریق می‌کند تا چت زنده به‌نظر برسد. */
const ROTATING_MESSAGES: Array<Omit<TripRoomMessage, "id" | "createdAt">> = [
  {
    authorId: "sara",
    authorName: "سارا کریمی",
    authorAvatar: MOCK_MEMBERS[1].avatar,
    text: "سلام دوستان! کفش کوهنوردی بهتره بگیرم یا اجاره کنم؟",
  },
  {
    authorId: "leader_1",
    authorName: "علی رضایی",
    authorAvatar: MOCK_MEMBERS[0].avatar,
    text: "سلام سارا. اگر قصد سفرهای بعدی هم داری خرید بهتره؛ وگرنه اجاره از همون بخش تجهیزات کوچ‌نشین راحت‌تره.",
  },
  {
    authorId: "hossein",
    authorName: "حسین موسوی",
    authorAvatar: MOCK_MEMBERS[2].avatar,
    text: "منم همون‌جا اجاره کردم، راحت بود.",
  },
  {
    authorId: "sara",
    authorName: "سارا کریمی",
    authorAvatar: MOCK_MEMBERS[1].avatar,
    text: "عالی، ممنون. پس فردا حرکت می‌کنیم؟",
  },
];

function seedRoom(booking: UserBooking): TripRoom {
  return {
    id: genId("room"),
    bookingId: booking.id,
    tourId: booking.tourId,
    tourTitle: booking.tourTitle,
    status: "pre_trip",
    members: MOCK_MEMBERS,
    messages: [
      {
        id: genId(),
        authorId: "leader_1",
        authorName: "علی رضایی",
        authorAvatar: MOCK_MEMBERS[0].avatar,
        text: `سلام به همه! به اتاق سفر «${booking.tourTitle}» خوش اومدید. اینجا می‌تونیم سوالات قبل از سفر رو مطرح کنیم و در حین سفر هم هماهنگ باشیم.`,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: genId(),
        authorId: "leader_1",
        authorName: "علی رضایی",
        authorAvatar: MOCK_MEMBERS[0].avatar,
        text: `توجه: محل حرکت ساعت ۵:۳۰ صبح از میدان آزادی، کنار درب شماره ۲. حتماً ۱۰ دقیقه زودتر برسید.`,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(),
        reactions: { "❤️": ["sara", "hossein"] },
        readBy: ["sara", "hossein", "me"],
        // v21.8: سنجاق واقعی توسط لیدر — در کاروسل بالا با بج «سنجاق‌شده»
        pinned: true,
        pinnedBy: "علی رضایی",
      },
      {
        id: genId(),
        authorId: "leader_1",
        authorName: "علی رضایی",
        authorAvatar: MOCK_MEMBERS[0].avatar,
        text: `یادت باشه کفش کوهنوردی و کاپشن ضدآب شخصی بیارید. بقیه تجهیزات را تیم تأمین می‌کنه.`,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        readBy: ["sara", "me"],
      },
      {
        id: genId(),
        authorId: "sara",
        authorName: "سارا کریمی",
        authorAvatar: MOCK_MEMBERS[1].avatar,
        text: `@شما نظرت درباره‌ی برنامه‌ی روز اول چی هست؟ صعود یا گشت اطراف؟`,
        createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        // عمداً خوانده‌نشده — نمایش خط «پیام‌های جدید» و فیلتر «منشن‌های من»
      },
      {
        id: genId(),
        authorId: "system",
        authorName: "سیستم",
        text: "سارا کریمی به سفر پیوست.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.8).toISOString(),
        isSystem: true,
      },
      {
        id: genId(),
        authorId: "system",
        authorName: "سیستم",
        text: "حسین موسوی به سفر پیوست.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        isSystem: true,
      },
      {
        id: genId(),
        authorId: ME.id,
        authorName: ME.name,
        authorAvatar: ME.avatar,
        text: `ممنون علی! یه سوال: آیا جای پارک برای ماشین شخصی نزدیک میدان آزادی هست؟`,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        readBy: ["leader_1"],
      },
    ],
    announcements: [
      {
        id: genId("an"),
        title: "محل حرکت و ساعت",
        body: "ساعت ۵:۳۰ صبح از میدان آزادی، کنار درب شماره ۲. لطفاً ۱۰ دقیقه زودتر باشید.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        pinned: true,
      },
      {
        id: genId("an"),
        title: "لیست تجهیزات ضروری",
        body: "کفش کوهنوردی، کاپشن ضدآب، فلاسک آب، عینک آفتابی، کرم ضدآفتاب. بقیه را تیم تأمین می‌کند.",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
    polls: [
      {
        id: genId("poll"),
        question: "حمل و نقل برگشت را ترجیح می‌دید گروهی باشد یا انفرادی؟",
        options: [
          { id: "o1", text: "گروهی با مینی‌بوس", voterIds: ["sara", "hossein", "me"] },
          { id: "o2", text: "انفرادی با ماشین شخصی", voterIds: [] },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
    checklist: DEFAULT_CHECKLIST,
  };
}

export const useTripRoom = create<TripRoomState>()(
  persist(
    (set, get) => ({
      rooms: {},
      activeBookingId: null,
      setActive: (bookingId) => set({ activeBookingId: bookingId }),
      ensureRoom: (booking) => {
        const existing = get().rooms[booking.id];
        if (existing) return existing;
        const room = seedRoom(booking);
        set((s) => ({ rooms: { ...s.rooms, [booking.id]: room } }));
        return room;
      },
      getRoom: (bookingId) => get().rooms[bookingId],
      sendMessage: (bookingId, msg) => {
        const room = get().rooms[bookingId];
        if (!room) return;
        const full: TripRoomMessage = {
          ...msg,
          id: genId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => {
          const cur = s.rooms[bookingId];
          if (!cur) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: { ...cur, messages: [...cur.messages, full] },
            },
          };
        });
        emitLive(bookingId, "msg:new", full);
      },
      deleteMessage: (bookingId, messageId) => {
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                messages: room.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, deleted: true, text: "این پیام حذف شد" }
                    : m,
                ),
              },
            },
          };
        });
        emitLive(bookingId, "msg:delete", { messageId });
      },
      toggleReaction: (bookingId, messageId, emoji, userId) => {
        // explicit `add` for the relay (idempotent on the remote side)
        const cur = get().rooms[bookingId];
        const target = cur?.messages.find((m) => m.id === messageId);
        const add = target
          ? !(target.reactions?.[emoji] ?? []).includes(userId)
          : false;
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                messages: room.messages.map((m) => {
                  if (m.id !== messageId) return m;
                  const prev = m.reactions ?? {};
                  const list = prev[emoji] ?? [];
                  const next = list.includes(userId)
                    ? list.filter((u) => u !== userId)
                    : [...list, userId];
                  const reactions = { ...prev, [emoji]: next };
                  if (next.length === 0) delete reactions[emoji];
                  return { ...m, reactions };
                }),
              },
            },
          };
        });
        if (target) emitLive(bookingId, "msg:react", { messageId, emoji, userId, add });
      },
      markMessagesRead: (bookingId, messageIds, userId) =>
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          const idSet = new Set(messageIds);
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                messages: room.messages.map((m) => {
                  if (!idSet.has(m.id)) return m;
                  // don't add author as reader of their own message
                  if (m.authorId === userId) return m;
                  const prev = m.readBy ?? [];
                  if (prev.includes(userId)) return m;
                  return { ...m, readBy: [...prev, userId] };
                }),
              },
            },
          };
        }),
      togglePinMessage: (bookingId, messageId, byName) => {
        const cur = get().rooms[bookingId];
        const target = cur?.messages.find((m) => m.id === messageId);
        const pinned = target ? !target.pinned : false;
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                messages: room.messages.map((m) =>
                  m.id === messageId
                    ? m.pinned
                      ? { ...m, pinned: false, pinnedBy: undefined }
                      : { ...m, pinned: true, pinnedBy: byName }
                    : m,
                ),
              },
            },
          };
        });
        if (target)
          emitLive(bookingId, "msg:pin", {
            messageId,
            pinned,
            byName: pinned ? byName : undefined,
          });
      },
      addAnnouncement: (bookingId, a) => {
        const full: TripRoomAnnouncement = {
          ...a,
          id: genId("an"),
          createdAt: new Date().toISOString(),
        };
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                announcements: [full, ...room.announcements],
              },
            },
          };
        });
        emitLive(bookingId, "ann:new", full);
      },
      togglePinAnnouncement: (bookingId, announcementId) => {
        const cur = get().rooms[bookingId];
        const target = cur?.announcements.find((a) => a.id === announcementId);
        const pinned = target ? !target.pinned : false;
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                announcements: room.announcements.map((a) =>
                  a.id === announcementId ? { ...a, pinned: !a.pinned } : a,
                ),
              },
            },
          };
        });
        if (target) emitLive(bookingId, "ann:pin", { announcementId, pinned });
      },
      toggleChecklist: (bookingId, itemId, userId, userName) => {
        const cur = get().rooms[bookingId];
        const target = cur?.checklist.find((c) => c.id === itemId);
        const done = target ? !target.done : false;
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                checklist: room.checklist.map((c) =>
                  c.id === itemId
                    ? { ...c, done: !c.done, doneBy: !c.done ? userName : undefined }
                    : c,
                ),
              },
            },
          };
        });
        if (target) emitLive(bookingId, "cl:toggle", { itemId, done, userId, userName });
      },
      addChecklistItem: (bookingId, label, userId, userName) => {
        const room = get().rooms[bookingId];
        const text = label.trim();
        if (!room || !text) return;
        const item: TripRoomChecklistItem = {
          id: genId("chk"),
          label: text.slice(0, 120),
          done: false,
          custom: true,
          byId: userId,
          byName: userName,
        };
        set((s) => {
          const cur = s.rooms[bookingId];
          if (!cur) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: { ...cur, checklist: [...cur.checklist, item] },
            },
          };
        });
        emitLive(bookingId, "cl:add", item);
      },
      removeChecklistItem: (bookingId, itemId) => {
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                checklist: room.checklist.filter((c) => c.id !== itemId),
              },
            },
          };
        });
        emitLive(bookingId, "cl:remove", { itemId });
      },
      votePoll: (bookingId, pollId, optionId, userId) => {
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                polls: room.polls.map((p) => {
                  if (p.id !== pollId) return p;
                  // remove from all options first (single-choice poll)
                  const options = p.options.map((o) => ({
                    ...o,
                    voterIds: o.voterIds.filter((u) => u !== userId),
                  }));
                  const target = options.find((o) => o.id === optionId);
                  if (target) target.voterIds.push(userId);
                  return { ...p, options };
                }),
              },
            },
          };
        });
        emitLive(bookingId, "poll:vote", { pollId, optionId, userId });
      },
      addPoll: (bookingId, question, options, authorId, authorName) => {
        const room = get().rooms[bookingId];
        if (!room) return;
        const poll: TripRoomPoll = {
          id: genId("poll"),
          question,
          options: options.map((text, i) => ({
            id: `o${Date.now()}_${i}`,
            text,
            voterIds: [],
          })),
          createdAt: new Date().toISOString(),
        };
        // also push a system message about the new poll
        const sysMsg: TripRoomMessage = {
          id: genId(),
          authorId: "system",
          authorName: "سیستم",
          text: `${authorName} یک نظرسنجی جدید ایجاد کرد: «${question}»`,
          createdAt: new Date().toISOString(),
          isSystem: true,
        };
        set((s) => {
          const cur = s.rooms[bookingId];
          if (!cur) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...cur,
                polls: [poll, ...cur.polls],
                messages: [...cur.messages, sysMsg],
              },
            },
          };
        });
        emitLive(bookingId, "poll:new", { poll, authorName });
      },
      closePoll: (bookingId, pollId) => {
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: {
                ...room,
                polls: room.polls.map((p) =>
                  p.id === pollId ? { ...p, closed: true } : p,
                ),
              },
            },
          };
        });
        emitLive(bookingId, "poll:close", { pollId });
      },
      tick: (bookingId) =>
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          // v22: a real remote conversation wins over the demo bot — stay
          // quiet for 45s after the last live message from another browser
          if (Date.now() - lastRemoteMsgAt < 45_000) return s;
          // pick the next mock message in rotation, but only if the last
          // message is older than ~30s (so we don't drown a quiet room)
          const last = room.messages[room.messages.length - 1];
          if (!last) return s;
          const ageMs = Date.now() - new Date(last.createdAt).getTime();
          if (ageMs < 1000 * 30) return s;
          // simple rotation index based on length
          const next =
            ROTATING_MESSAGES[room.messages.length % ROTATING_MESSAGES.length];
          const full: TripRoomMessage = {
            ...next,
            id: genId(),
            createdAt: new Date().toISOString(),
          };
          return {
            rooms: {
              ...s.rooms,
              [bookingId]: { ...room, messages: [...room.messages, full] },
            },
          };
        }),
      setStatus: (bookingId, status) =>
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          return {
            rooms: { ...s.rooms, [bookingId]: { ...room, status } },
          };
        }),

      /* ---------------- v22: remote application ---------------- */

      /**
       * Apply a relayed mutation from another browser. Every branch is
       * idempotent (explicit target state / upsert-by-id), so at-least-once
       * delivery from the relay is always safe.
       */
      applyRemote: (bookingId, kind, payload) => {
        const p = payload as Record<string, unknown>;
        switch (kind) {
          case "msg:new": {
            const msg = p as unknown as TripRoomMessage;
            if (!msg?.id) return;
            lastRemoteMsgAt = Date.now();
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              if (room.messages.some((m) => m.id === msg.id)) return s;
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: { ...room, messages: [...room.messages, msg] },
                },
              };
            });
            return;
          }
          case "msg:delete":
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    messages: room.messages.map((m) =>
                      m.id === p.messageId
                        ? { ...m, deleted: true, text: "این پیام حذف شد" }
                        : m,
                    ),
                  },
                },
              };
            });
            return;
          case "msg:react":
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              const emoji = String(p.emoji);
              const userId = String(p.userId);
              const add = Boolean(p.add);
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    messages: room.messages.map((m) => {
                      if (m.id !== p.messageId) return m;
                      const prev = m.reactions ?? {};
                      const list = prev[emoji] ?? [];
                      const next = add
                        ? list.includes(userId)
                          ? list
                          : [...list, userId]
                        : list.filter((u) => u !== userId);
                      const reactions = { ...prev, [emoji]: next };
                      if (next.length === 0) delete reactions[emoji];
                      return { ...m, reactions };
                    }),
                  },
                },
              };
            });
            return;
          case "msg:pin":
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    messages: room.messages.map((m) =>
                      m.id === p.messageId
                        ? p.pinned
                          ? { ...m, pinned: true, pinnedBy: p.byName as string | undefined }
                          : { ...m, pinned: false, pinnedBy: undefined }
                        : m,
                    ),
                  },
                },
              };
            });
            return;
          case "ann:new": {
            const ann = p as unknown as TripRoomAnnouncement;
            if (!ann?.id) return;
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              if (room.announcements.some((a) => a.id === ann.id)) return s;
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    announcements: [ann, ...room.announcements],
                  },
                },
              };
            });
            return;
          }
          case "ann:pin":
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    announcements: room.announcements.map((a) =>
                      a.id === p.announcementId
                        ? { ...a, pinned: Boolean(p.pinned) }
                        : a,
                    ),
                  },
                },
              };
            });
            return;
          case "cl:add": {
            const item = p as unknown as TripRoomChecklistItem;
            if (!item?.id) return;
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              if (room.checklist.some((c) => c.id === item.id)) return s;
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: { ...room, checklist: [...room.checklist, item] },
                },
              };
            });
            return;
          }
          case "cl:toggle":
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              const done = Boolean(p.done);
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    checklist: room.checklist.map((c) =>
                      c.id === p.itemId
                        ? { ...c, done, doneBy: done ? (p.userName as string) : undefined }
                        : c,
                    ),
                  },
                },
              };
            });
            return;
          case "cl:remove":
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    checklist: room.checklist.filter((c) => c.id !== p.itemId),
                  },
                },
              };
            });
            return;
          case "poll:new": {
            const { poll, authorName } = p as {
              poll: TripRoomPoll;
              authorName: string;
            };
            if (!poll?.id) return;
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              if (room.polls.some((x) => x.id === poll.id)) return s;
              const sysMsg: TripRoomMessage = {
                id: genId(),
                authorId: "system",
                authorName: "سیستم",
                text: `${authorName} یک نظرسنجی جدید ایجاد کرد: «${poll.question}»`,
                createdAt: new Date().toISOString(),
                isSystem: true,
              };
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    polls: [poll, ...room.polls],
                    messages: [...room.messages, sysMsg],
                  },
                },
              };
            });
            return;
          }
          case "poll:vote":
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              const userId = String(p.userId);
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    polls: room.polls.map((x) => {
                      if (x.id !== p.pollId) return x;
                      const options = x.options.map((o) => ({
                        ...o,
                        voterIds: o.voterIds.filter((u) => u !== userId),
                      }));
                      const target = options.find((o) => o.id === p.optionId);
                      if (target) target.voterIds.push(userId);
                      return { ...x, options };
                    }),
                  },
                },
              };
            });
            return;
          case "poll:close":
            set((s) => {
              const room = s.rooms[bookingId];
              if (!room) return s;
              return {
                rooms: {
                  ...s.rooms,
                  [bookingId]: {
                    ...room,
                    polls: room.polls.map((x) =>
                      x.id === p.pollId ? { ...x, closed: true } : x,
                    ),
                  },
                },
              };
            });
            return;
          default:
            // expenses kinds are handled by group-expenses-store.applyRemote
            return;
        }
      },

      /** Mirror the live presence roster onto the member list. */
      applyPresence: (bookingId, onlineIds) =>
        set((s) => {
          const room = s.rooms[bookingId];
          if (!room) return s;
          const ids = new Set(onlineIds);
          let changed = false;
          const members = room.members.map((m) => {
            const online = ids.has(m.userId);
            if (online === m.online) return m;
            changed = true;
            return { ...m, online };
          });
          if (!changed) return s;
          return {
            rooms: { ...s.rooms, [bookingId]: { ...room, members } },
          };
        }),
    }),
    {
      name: "koch-trip-room-v4", // v4: seed با سنجاق واقعی + منشن خوانده‌نشده (v21.8)
      // only persist rooms themselves, not the activeBookingId
      partialize: (s) => ({ rooms: s.rooms }),
    },
  ),
);

/* v21.9.2: پیام/سنجاق/چک‌لیست/نظرسنجی که در تب دیگر می‌نویسی همین‌جا زنده می‌شود */
enableCrossTabSync(useTripRoom, "koch-trip-room-v4");

/* ---------------- helpers (frontend-only UX gates) ---------------- */

/** سطح دسترسی کاربر فعلی برای یک اتاق — frontend gate only. */
export function resolveAccessLevel(room: TripRoom): TripRoomAccessLevel {
  // در نسخه واقعی، از auth-store + membership واقعی خوانده می‌شود.
  // فعلاً همیشه «اعضای عادی» برمی‌گردد تا دکمه‌های لیدر مخفی باشند،
  // مگر آنکه تست کنیم با کاربر «leader_1».
  const me = room.members.find((m) => m.userId === "me");
  if (!me) return "pending";
  if (me.role === "leader") return "leader";
  return "member";
}

export const ME_ID = ME.id;
export const ME_NAME = ME.name;
export const ME_AVATAR = ME.avatar;
