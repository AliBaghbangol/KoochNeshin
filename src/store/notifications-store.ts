"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { enableCrossTabSync } from "@/lib/cross-tab";

export type NotificationType =
  | "booking"
  | "discount"
  | "review"
  | "system"
  | "social";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string; // ISO
  read: boolean;
  actionLabel?: string;
  actionView?: string;
}

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: () => number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  // `id` is optional here on purpose: callers without one get a generated id
  // inside `add` (n.id ?? genId()). Note: `Omit<AppNotification, "time" | "read">`
  // alone was NOT enough — intersecting the required `id: string` with
  // `{ id?: string }` re-narrowed it back to a required property.
  add: (n: Omit<AppNotification, "time" | "read" | "id"> & { id?: string }) => void;
}

function genId() {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "seed_1",
    type: "discount",
    title: "تخفیف ویژه تابستانه!",
    body: "۲۵٪ تخفیف روی تورهای کویر لوت و مرنجاب — فقط تا پایان هفته.",
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    actionLabel: "مشاهده تورها",
    actionView: "tours",
  },
  {
    id: "seed_2",
    type: "booking",
    title: "رزرو شما تأیید شد",
    body: "رزرو تور «صعود فصلی قله دماوند» با موفقیت تأیید شد.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
    actionLabel: "مشاهده در داشبورد",
    actionView: "user-dashboard",
  },
  {
    id: "seed_3",
    type: "review",
    title: "نظر شما ثبت شد",
    body: "ممنون از اشتراک‌گذاری تجربه‌ت! نظر شما پس از تأیید نمایش داده می‌شود.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
  },
  {
    id: "seed_4",
    type: "social",
    title: "مسافر جدیدی به تور شما پیوست",
    body: "علی ر. به تور «جنگل ابر — شب مه‌آلود» اضافه شد.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: false,
    actionLabel: "مشاهده تور",
    actionView: "tour-detail",
  },
  {
    id: "seed_5",
    type: "system",
    title: "به کوچ‌نشین خوش آمدید!",
    body: "پلتفرم تور و تجهیزات گردشگری ایران. اولین سفرت رو شروع کن!",
    time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
    actionLabel: "کاوش تورها",
    actionView: "tours",
  },
];

export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: SEED_NOTIFICATIONS,
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      remove: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
      add: (n) =>
        set((s) => {
          // Realtime payloads carry a server id — skip if already received
          // (e.g. after reconnection replays or duplicate broadcasts).
          if (n.id && s.notifications.some((x) => x.id === n.id)) return s;
          return {
            notifications: [
              {
                ...n,
                id: n.id ?? genId(),
                time: new Date().toISOString(),
                read: false,
              },
              ...s.notifications,
            ],
          };
        }),
    }),
    {
      name: "kochneshin-notifications",
      // Only persist read state + custom notifications, not seed data
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);

/* v21.9.2: read-state و نوتیف‌های جدید در تب دیگر هم فوراً دیده شود */
enableCrossTabSync(useNotifications, "kochneshin-notifications");
