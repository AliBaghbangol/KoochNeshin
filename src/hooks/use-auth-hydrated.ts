"use client";

import * as React from "react";
import { useAuth } from "@/store/auth-store";

/**
 * useAuthHydrated — reactively tracks zustand-persist rehydration of the
 * auth store.
 *
 * Why it exists: `isAuthenticated` is `false` on the very first client
 * render because `persist` rehydrates from localStorage asynchronously.
 * Components that auto-open the auth modal for guests (e.g. GuestRedirect
 * in trip-room / live-trip) MUST wait for hydration first, otherwise the
 * modal spuriously opens for logged-in users and stays open forever.
 *
 * Usage:
 *   const hydrated = useAuthHydrated();
 *   if (!hydrated) return <Skeleton …/>;   // wait instead of guessing
 */
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState<boolean>(() =>
    typeof window !== "undefined" ? useAuth.persist.hasHydrated() : false,
  );

  React.useEffect(() => {
    const unsub = useAuth.persist.onFinishHydration(() => setHydrated(true));
    // Cover the race where hydration finished between render and effect.
    if (useAuth.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}
