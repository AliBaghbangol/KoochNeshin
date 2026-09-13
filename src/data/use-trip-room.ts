"use client";

/**
 * Trip Room data hooks — spec §2.
 *
 * Polling fallback (TODO(backend): WebSocket subscription). The 4-second
 * interval is a deliberate trade-off: short enough to feel alive in a demo,
 * long enough to not hammer the localStorage store.
 */

import { useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTripRoom } from "@/store/trip-room-store";
import { useMe } from "@/hooks/use-me";
import type { TripRoom, TripRoomMember } from "@/types/trip-room";
import type { UserBooking } from "@/store/bookings-store";
import { track } from "@/lib/analytics/track";

/** اطمینان از وجود اتاق برای یک booking و بازگرداندن آن. */
export function useTripRoomFor(booking: UserBooking | null) {
  const ensureRoom = useTripRoom((s) => s.ensureRoom);
  const room = useTripRoom((s) => (booking ? s.rooms[booking.id] : undefined));
  useEffect(() => {
    if (booking && !room) ensureRoom(booking);
  }, [booking, room, ensureRoom]);
  return booking ? room ?? null : null;
}

/**
 * لیست اعضا با هویت واقعی «من» — نام و آواتار از auth-store.
 * The roster's mock entry (`userId: "me"` / «شما») is replaced with the
 * logged-in user's real name and avatar everywhere it is DISPLAYED.
 * Persisted rosters stay untouched, so storage remains compatible.
 */
export function useNamedMembers(room: TripRoom | null): TripRoomMember[] {
  const me = useMe();
  return useMemo(() => {
    if (!room) return [];
    return room.members.map((m) =>
      m.userId === me.id ? { ...m, name: me.name, avatar: me.avatar } : m,
    );
  }, [room, me]);
}

/** پیام‌های یک اتاق را با polling برمی‌گرداند — فیک realtime. */
export function useTripRoomMessages(bookingId: string | null) {
  const tick = useTripRoom((s) => s.tick);
  return useQuery({
    queryKey: ["trip-room-tick", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      // simulate network latency for realism
      await new Promise((r) => setTimeout(r, 120));
      tick(bookingId);
      return true;
    },
    enabled: !!bookingId,
    refetchInterval: 4000, // TODO(backend): replace with WebSocket
    refetchOnWindowFocus: false,
  });
}

/**
 * ثبت یک پیام جدید — Rate limit ساده ۱ ثانیه.
 * `replyToId` (v21.5): وقتی پاس داده شود، پیام به‌عنوان پاسخ به آن پیام
 * ذخیره می‌شود (قبلاً UI پیش‌نمایش پاسخ داشت ولی id هرگز persist نمی‌شد — باگ).
 */
export function useSendTripMessage(bookingId: string) {
  const sendMessage = useTripRoom((s) => s.sendMessage);
  const me = useMe();
  const lastSentRef = useRef(0);
  return (text: string, replyToId?: string) => {
    const now = Date.now();
    if (now - lastSentRef.current < 1000) {
      return { ok: false, reason: "rate-limit" as const };
    }
    lastSentRef.current = now;
    sendMessage(bookingId, {
      authorId: me.id,
      authorName: me.name,
      authorAvatar: me.avatar,
      text,
      ...(replyToId ? { replyToId } : {}),
    });
    if (replyToId) {
      track("message_replied", { bookingId, parentId: replyToId });
    } else {
      track("message_sent", { bookingId, length: text.length });
    }
    return { ok: true };
  };
}

/** فایر یک `trip_room_opened` وقتی کاربر اتاق را باز می‌کند. */
export function useTrackTripRoomOpened(bookingId: string | null) {
  useEffect(() => {
    if (bookingId) track("trip_room_opened", { bookingId });
  }, [bookingId]);
}
