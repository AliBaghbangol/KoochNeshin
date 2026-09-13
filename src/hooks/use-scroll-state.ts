"use client";

import * as React from "react";

/**
 * Shared scroll-flag hook (v17 cleanup).
 *
 * Historically every navbar sub-component ran its own passive scroll
 * listener with the same threshold. This module replaces that with ONE
 * app-wide passive listener: consumers derive their own boolean from the
 * current scrollY, and `useSyncExternalStore` re-renders a consumer only
 * when its boolean actually flips (no setState on every scroll event).
 *
 * - single listener, passive, rAF-batched notifications
 * - listener attaches on first subscriber and detaches when idle
 * - SSR-safe (server snapshot = false, matching pre-hydration rendering)
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let attached = false;
let ticking = false;

function notify() {
  listeners.forEach((l) => l());
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  // Batch to one notification per frame — subscribers cheaply re-derive
  // their boolean and React ignores unchanged snapshots.
  requestAnimationFrame(() => {
    ticking = false;
    notify();
  });
}

function ensureAttached() {
  if (attached || typeof window === "undefined") return;
  window.addEventListener("scroll", onScroll, { passive: true });
  attached = true;
}

function detachIfIdle() {
  if (attached && listeners.size === 0) {
    window.removeEventListener("scroll", onScroll);
    attached = false;
  }
}

/**
 * Derive a boolean from the current window scroll position with a single
 * shared listener. Re-renders only when the derived value flips.
 */
export function useScrollFlag(compute: (scrollY: number) => boolean): boolean {
  // Latest-compute ref: assigned in a layout effect (never during render —
  // see react-hooks/refs). The closures used by all consumers are pure
  // scroll math, so the one-commit staleness window is a non-issue.
  const computeRef = React.useRef(compute);
  React.useLayoutEffect(() => {
    computeRef.current = compute;
  }, [compute]);

  const subscribe = React.useCallback((listener: Listener) => {
    listeners.add(listener);
    ensureAttached();
    return () => {
      listeners.delete(listener);
      detachIfIdle();
    };
  }, []);

  const getSnapshot = React.useCallback(
    () => computeRef.current(window.scrollY),
    []
  );
  const getServerSnapshot = React.useCallback(() => false, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * "Past the hero fold" flag shared by the navbar suite (theme toggle, cart,
 * wishlist, navbar itself). One threshold definition for all of them.
 */
export function useHeroScrolled(): boolean {
  return useScrollFlag((y) => y > window.innerHeight * 0.5);
}
