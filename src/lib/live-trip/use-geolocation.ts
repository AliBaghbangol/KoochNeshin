"use client";

import { useEffect, useState } from "react";

/**
 * useGeolocation — spec §3.
 *
 * Watch the user's real geolocation in their own browser. This is a
 * frontend-only simulation of "live" — the position is NOT synced to other
 * group members because that needs a real WebSocket backend.
 *
 * TODO(backend): when the realtime service is ready, push these updates to
 * the server and broadcast to other members of the trip room.
 */
export function useGeolocation(enabled: boolean) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // defer to avoid calling setState synchronously inside the effect body
      const id = window.setTimeout(
        () => setError("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند."),
        0,
      );
      return () => window.clearTimeout(id);
    }
    const watchId = navigator.geolocation.watchPosition(
      setPosition,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("دسترسی به موقعیت رد شد. می‌توانید بعداً از تنظیمات فعال کنید.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("موقعیت در دسترس نیست.");
        } else if (err.code === err.TIMEOUT) {
          setError("دریافت موقعیت طول کشید. دوباره تلاش کنید.");
        } else {
          setError(err.message);
        }
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error };
}
