"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VerificationStatus } from "@/types";

/**
 * Leader Verification Overrides store — bugfix for باگ ۱۰.
 *
 * The admin dashboard's "Approve/Reject leader" buttons were calling
 * `useAuth.setLeaderVerification()` which is a global field on the current
 * user — not per-leader. This store provides a per-leaderId override map
 * that the admin dashboard uses instead.
 *
 * The `getStatus` method falls back to the leader's original
 * `verificationStatus` from the mock data when no override exists.
 *
 * TODO(backend): replace with `PATCH /api/admin/leaders/:id/verification`.
 */

interface LeaderVerificationState {
  overrides: Record<string, VerificationStatus>;
  setStatus: (leaderId: string, status: VerificationStatus) => void;
  getStatus: (
    leaderId: string,
    fallback: VerificationStatus,
  ) => VerificationStatus;
  resetAll: () => void;
}

export const useLeaderVerification = create<LeaderVerificationState>()(
  persist(
    (set, get) => ({
      overrides: {},
      setStatus: (leaderId, status) =>
        set((s) => ({
          overrides: { ...s.overrides, [leaderId]: status },
        })),
      getStatus: (leaderId, fallback) => {
        return get().overrides[leaderId] ?? fallback;
      },
      resetAll: () => set({ overrides: {} }),
    }),
    { name: "koch-leader-verification-v1" },
  ),
);
