"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Leader profile flags — persisted to localStorage.
 *
 * Tracks per-leader "Pro plan" upgrade status, keyed by `leaderId`
 * so multiple leaders on the same browser keep their own upgrade state.
 *
 * v25: per-leader public-profile edits (نام/بیو/تخصص‌ها/زبان‌ها) — لیدر از
 * پروفایل عمومی خودش می‌تواند این‌ها را ویرایش کند؛ نمایش در پروفایل عمومی
 * روی دادهٔ پایه merge می‌شود.
 */

export interface LeaderProfileEdit {
  fullName?: string;
  bio?: string;
  /** جدا‌شده با ویرگول */
  specialties?: string[];
  languages?: string[];
}

interface LeaderProfileState {
  isProByLeader: Record<string, boolean>;
  profileEdits: Record<string, LeaderProfileEdit>;
  isPro: (leaderId: string) => boolean;
  setUpgradeToPro: (leaderId: string) => void;
  resetPro: (leaderId: string) => void;
  getEdit: (leaderId: string) => LeaderProfileEdit | undefined;
  setProfileEdit: (leaderId: string, edit: LeaderProfileEdit) => void;
}

export const useLeaderProfile = create<LeaderProfileState>()(
  persist(
    (set, get) => ({
      isProByLeader: {},
      profileEdits: {},
      isPro: (leaderId) => Boolean(get().isProByLeader[leaderId]),
      setUpgradeToPro: (leaderId) =>
        set((s) => ({
          isProByLeader: { ...s.isProByLeader, [leaderId]: true },
        })),
      resetPro: (leaderId) =>
        set((s) => {
          const next = { ...s.isProByLeader };
          delete next[leaderId];
          return { isProByLeader: next };
        }),
      getEdit: (leaderId) => get().profileEdits[leaderId],
      setProfileEdit: (leaderId, edit) =>
        set((s) => ({
          profileEdits: { ...s.profileEdits, [leaderId]: edit },
        })),
    }),
    { name: "kochneshin-leader-profile" }
  )
);
