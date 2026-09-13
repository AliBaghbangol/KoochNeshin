"use client";

import * as React from "react";
import { useAuth } from "@/store/auth-store";
import { ME_ID, ME_NAME, ME_AVATAR } from "@/store/trip-room-store";

/**
 * useMe — the current user's trip-room identity, reactively connected to
 * the auth store.
 *
 * - `id` stays the canonical mock roster id ("me") so persisted rooms
 *   (localStorage `koch-trip-room-v3`) keep matching; membership checks,
 *   balances and access levels are id-based.
 * - `name` / `avatar` come from the logged-in user when available, so
 *   messages, polls and checklist actions show the REAL identity instead
 *   of the generic «شما» placeholder.
 *
 * TODO(backend): once a real session exists, `id` becomes the server user id
 * and the room roster carries real ids too.
 */
export function useMe() {
  const fullName = useAuth((s) => s.user?.fullName);
  const avatar = useAuth((s) => s.user?.avatar);

  return React.useMemo(
    () => ({
      id: ME_ID,
      name: fullName?.trim() ? fullName : ME_NAME,
      avatar: avatar || ME_AVATAR,
    }),
    [fullName, avatar],
  );
}
