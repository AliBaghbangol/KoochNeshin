"use client";

/**
 * Cross-tab real-time sync for persisted zustand stores (v21.9.2).
 *
 * The trip room, group expenses and notifications are collaborative surfaces
 * — but until a real WebSocket backend lands (TODO(backend)), two tabs of the
 * same browser behaved like two isolated worlds: send a message in tab A and
 * tab B only found out after a full reload.
 *
 * This helper closes that gap with the platform primitive that already
 * exists: when any tab writes a persisted store to localStorage, every OTHER
 * tab receives a `storage` event for that key and simply rehydrates the
 * store. Last-write-wins, zero new state shapes, zero backend.
 *
 * Deliberately scoped to the collaborative stores — syncing auth or carts
 * across tabs was not asked for and would surprise more than delight.
 *
 * Usage (module scope of the store file, right after the store is created):
 *   enableCrossTabSync(useTripRoom, "koch-trip-room-v4");
 *
 * Returns a disposer (mainly for tests); in production the listener lives
 * for the page lifetime.
 */

interface SyncableStore {
  persist: { rehydrate: () => void | Promise<void> };
}

export function enableCrossTabSync(
  store: SyncableStore,
  storageKey: string,
): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    // `e.key === null` means another tab called clear() — ignore that, it is
    // never something our stores do themselves.
    if (e.key !== storageKey) return;
    try {
      void store.persist.rehydrate();
    } catch {
      // a corrupt payload from a half-written tab must never crash the app
    }
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
