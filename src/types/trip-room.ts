// src/types/trip-room.ts
/**
 * Trip Room types — spec §2 of KOCHNESHIN-V19-FRONTEND-DEV-SPEC-PART2.md.
 *
 * One Trip Room per confirmed booking. The room holds a chat, announcements,
 * a member roster, a shared pre-trip checklist (shared with Safety Center §4)
 * and lightweight polls.
 *
 * NOTE: frontend permission gates here are for UX only — the backend MUST
 * re-check access on every request. See the comment at the top of
 * `trip-room-store.ts`.
 */

export type TripRoomAccessLevel = "pending" | "member" | "leader" | "admin";

export type TripRoomStatus = "pre_trip" | "active_trip" | "post_trip" | "archived";

export interface TripRoomMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string; // ISO
  replyToId?: string;
  /** emoji -> userIds */
  reactions?: Record<string, string[]>;
  /** پیام‌های سیستمی مثل «علی به سفر پیوست» — وسط‌چین خاکستری */
  isSystem?: boolean;
  /** فقط لیدر/ادمین می‌تواند حذف کند (frontend gate) */
  deleted?: boolean;
  /** userIds who have read this message (read receipts) */
  readBy?: string[];
  /**
   * سنجاق‌شده توسط لیدر/ادمین — در کاروسل «پیام‌های سنجاق‌شده» بالا می‌آید.
   * TODO(backend): `pinned` + `pinnedBy` + `pinnedAt` روی مدل Message.
   */
  pinned?: boolean;
  /** چه کسی سنجاق کرده (نمایش در تولتیپ بج) */
  pinnedBy?: string;
}

export interface TripRoomAnnouncement {
  id: string;
  title: string;
  body: string;
  createdAt: string; // ISO
  pinned?: boolean;
}

export interface TripRoomMember {
  userId: string;
  name: string;
  avatar?: string;
  role: "traveler" | "leader";
  joinedAt: string; // ISO
  /** وضعیت آنلاین/آفلاین — فعلاً mock */
  online?: boolean;
}

export interface TripRoomPollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface TripRoomPoll {
  id: string;
  question: string;
  options: TripRoomPollOption[];
  createdAt: string; // ISO
  closed?: boolean;
}

export interface TripRoomChecklistItem {
  id: string;
  label: string;
  done: boolean;
  /** فقط نمایش — چه کسی تیک زده */
  doneBy?: string;
  /** added by a member at runtime (v21.9) — seed items have no flag */
  custom?: boolean;
  /** who added the custom item (audit + delete gate) */
  byId?: string;
  byName?: string;
}

export interface TripRoom {
  id: string;
  bookingId: string;
  tourId: string;
  tourTitle: string;
  status: TripRoomStatus;
  members: TripRoomMember[];
  messages: TripRoomMessage[];
  announcements: TripRoomAnnouncement[];
  polls: TripRoomPoll[];
  /** چک‌لیست ایمنی مشترک با Safety Center §4 */
  checklist: TripRoomChecklistItem[];
}
