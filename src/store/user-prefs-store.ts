"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationPrefs {
  tourReminders: boolean;
  discounts: boolean;
  newsletter: boolean;
  sms: boolean;
  bookingConfirmations: boolean;
  reviewReplies: boolean;
}

interface PrefsState {
  notifs: NotificationPrefs;
  setNotifs: (prefs: Partial<NotificationPrefs>) => void;
  reset: () => void;
}

const DEFAULT_PREFS: NotificationPrefs = {
  tourReminders: true,
  discounts: true,
  newsletter: false,
  sms: true,
  bookingConfirmations: true,
  reviewReplies: true,
};

export const useUserPrefs = create<PrefsState>()(
  persist(
    (set) => ({
      notifs: DEFAULT_PREFS,
      setNotifs: (prefs) =>
        set((s) => ({ notifs: { ...s.notifs, ...prefs } })),
      reset: () => set({ notifs: DEFAULT_PREFS }),
    }),
    { name: "kochneshin-user-prefs" }
  )
);
