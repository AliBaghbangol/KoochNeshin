"use client";

import * as React from "react";

/**
 * useMounted — true after the component has mounted on the client.
 *
 * Why it exists: pages stream inside Suspense boundaries, so a deferred
 * subtree can hydrate AFTER the app-shell's `persist.rehydrate()` effect
 * has already run. Any visual derived from a persisted store (wishlist
 * hearts, compare ticks, cart badges inside cards) would then differ from
 * the server HTML on its very first render → hydration mismatch.
 *
 * Gate such visuals with this hook:
 *   const mounted = useMounted();
 *   const isFav = mounted && hasWishlist(id);
 * The first render matches the server (both false); the hydrated state is
 * applied on the post-mount render, deterministically.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
