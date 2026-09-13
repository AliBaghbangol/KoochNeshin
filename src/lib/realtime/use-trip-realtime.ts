"use client";

/**
 * useTripRealtime — mounts the trip-room socket session for one booking.
 *
 * Responsibilities:
 *  1. join the booking room on the trip-sync-service (re-joins on reconnect);
 *  2. apply relayed remote events (`tr`) to the two collaborative stores via
 *     their `applyRemote` actions (same-origin events are dropped inside the
 *     hook — see trip-socket.ts for the dedup model);
 *  3. keep presence (online roster) in the realtime store AND mirror it onto
 *     `room.members[].online` so the members tab + header reflect live state;
 *  4. track remote typers (auto-expiring) for the chat typing indicator.
 *
 * Mounted once per trip-room page (in TripRoomTabs). Emits stay at the store
 * action level, so components keep calling the same store APIs as before.
 */

import * as React from "react";
import { toast } from "sonner";
import { useMe } from "@/hooks/use-me";
import { useTripRoom, ME_ID } from "@/store/trip-room-store";
import { useGroupExpenses } from "@/store/group-expenses-store";
import { useRealtime, type OnlineUser } from "@/store/realtime-store";
import { getTripSocket, getClientId } from "./trip-socket";
import { track } from "@/lib/analytics/track";

let connectedTrackedThisSession = false;

/** cooldown map so a chatty peer can't spam toasts (per kind) */
const lastToastAt = new Map<string, number>();
const TOAST_COOLDOWN_MS = 8000;
function throttledToast(key: string, fn: () => void) {
  const now = Date.now();
  if (now - (lastToastAt.get(key) ?? 0) < TOAST_COOLDOWN_MS) return;
  lastToastAt.set(key, now);
  fn();
}

export function useTripRealtime(bookingId: string, tourTitle: string) {
  const me = useMe();

  React.useEffect(() => {
    const socket = getTripSocket();
    if (!socket) return;

    const join = () => {
      socket.emit("join", {
        bookingId,
        user: { id: ME_ID, name: me.name },
        clientId: getClientId(),
      });
      if (!connectedTrackedThisSession) {
        connectedTrackedThisSession = true;
        track("realtime_connected", { bookingId, tour: tourTitle });
      }
    };

    socket.on("connect", join);
    if (socket.connected) join();

    /* ---- relayed room events ---- */
    const onRelay = (env: {
      bookingId: string;
      kind: string;
      payload: unknown;
      origin: string;
    }) => {
      if (env.bookingId !== bookingId) return;
      if (env.origin === getClientId()) return; // same browser → storage sync owns it
      if (env.kind === "typing") {
        const p = env.payload as { userId?: string; name?: string; isTyping?: boolean };
        if (!p?.userId) return;
        if (p.isTyping) {
          useRealtime
            .getState()
            .pingTyping(bookingId, { userId: p.userId, name: p.name ?? "عضو" });
        } else {
          useRealtime.getState().stopTyping(bookingId, p.userId);
        }
        return;
      }
      // dispatch to the two collaborative stores (each guards its own kinds)
      useTripRoom.getState().applyRemote(bookingId, env.kind, env.payload);
      useGroupExpenses.getState().applyRemote(bookingId, env.kind, env.payload);

      /* v22: آگاهی زنده — وقتی هم‌سفری چیزی عوض می‌کند، یک توست ظریف بده
         (چت توست ندارد تا شلوغ نشود؛ آنجا شمارنده‌ی خوانده‌نشده هست) */
      const p = env.payload as Record<string, unknown>;
      switch (env.kind) {
        case "exp:upsert": {
          const title = (p as { title?: string }).title ?? "هزینه";
          throttledToast("exp:upsert", () =>
            toast("🧾 هزینه‌ای ثبت شد", {
              description: `${title} — توسط هم‌سفر در این اتاق`,
            }),
          );
          break;
        }
        case "exp:remove":
          throttledToast("exp:remove", () =>
            toast("🧾 هزینه‌ای حذف شد", { description: "توسط هم‌سفر" }),
          );
          break;
        case "settled:set":
          throttledToast("settled:set", () =>
            toast.success("🤝 تسویه‌ای ثبت/به‌روز شد", {
              description: "دفتر هزینه همگام شد.",
            }),
          );
          break;
        case "cl:add":
          throttledToast("cl:add", () =>
            toast("✅ آیتم چک‌لیست اضافه شد", { description: "توسط هم‌سفر" }),
          );
          break;
        case "poll:new":
          throttledToast("poll:new", () =>
            toast("📊 نظرسنجی جدید", {
              description: "یک هم‌سفر نظرسنجی ساخت — تب نظرسنجی را ببین.",
            }),
          );
          break;
        case "msg:pin":
          throttledToast("msg:pin", () =>
            toast.success("📌 پیامی سنجاق شد", {
              description: "بالای چت نمایش داده می‌شود.",
            }),
          );
          break;
      }
    };
    socket.on("tr", onRelay);

    /* ---- presence ---- */
    const onPresence = (p: {
      bookingId: string;
      online: OnlineUser[];
      count?: number;
    }) => {
      if (p.bookingId !== bookingId) return;
      useRealtime.getState().setOnline(bookingId, p.online ?? []);
      useTripRoom
        .getState()
        .applyPresence(bookingId, (p.online ?? []).map((o) => o.userId));
    };
    socket.on("presence", onPresence);

    /* ---- prune stale typers ---- */
    const pruneId = window.setInterval(() => {
      useRealtime.getState().pruneTyping(bookingId);
    }, 1500);

    return () => {
      socket.off("connect", join);
      socket.off("tr", onRelay);
      socket.off("presence", onPresence);
      window.clearInterval(pruneId);
      useRealtime.getState().setOnline(bookingId, []);
      // note: intentionally NOT disconnecting the singleton socket — it is
      // reused across route changes; switching rooms simply re-joins.
    };
  }, [bookingId, me.name, tourTitle]);
}
