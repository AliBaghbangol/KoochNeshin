"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudOff } from "lucide-react";
import { toast } from "sonner";
import { NotFoundView } from "@/components/views/not-found-view";

/**
 * Offline experience — now page-shaped, not game-shaped (user: «وقتی نت قطع
 * میشه میخام بازی نیاد به جاش یه صفحه 404 خیلی جذاب و انیمیشنی بیاد»).
 *
 * When the connection drops, the SAME animated night-desert 404 scene takes
 * over the full screen (stars, caravan trail, glowing tent, smoke). It
 * auto-opens ~1.4s after going offline (brief hiccups don't flash it), can be
 * dismissed to a small floating pill (Esc works too), and auto-closes with a
 * toast the moment the connection returns.
 *
 * Reconnect toast is RESERVED for real episodes: mounting/refreshing while
 * online stays completely silent (user: «هر سری صفحه رفرش میشه نوتیف اتصال
 * برقرار شد میاد — فقط وقتی که نتت پرید باید بیاد»).
 */

const SHOW_DELAY_MS = 1400;

export function OfflineIndicator() {
  const [offline, setOffline] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const dismissedRef = React.useRef(false);
  // Only a REAL offline episode may produce the «اتصال برقرار شد» toast.
  const wasOfflineRef = React.useRef(false);

  React.useEffect(() => {
    let timer: number | undefined;

    const goOffline = () => {
      wasOfflineRef.current = true;
      setOffline(true);
      dismissedRef.current = false;
      timer = window.setTimeout(() => {
        if (!dismissedRef.current) setOpen(true);
      }, SHOW_DELAY_MS);
    };
    const goOnline = () => {
      setOffline(false);
      setOpen(false);
      window.clearTimeout(timer);
      if (!wasOfflineRef.current) return; // initial mount / refresh — stay silent
      wasOfflineRef.current = false;
      toast.success("اتصال برقرار شد — به کاروان خوش برگشتی 🌿", {
        description: "داده‌ها دوباره همگام می‌شن.",
      });
    };

    const sync = () => {
      // Defensive double-check: some browsers (and agent-browser sessions
      // with cleared storage) report `navigator.onLine === false` for a
      // brief moment after a hard reload before firing the `online` event.
      // We re-check 200ms later to avoid getting stuck in "offline" mode
      // when the connection is actually up.
      if (typeof navigator === "undefined") return;
      if (navigator.onLine) {
        goOnline();
        return;
      }
      // schedule a re-check — if the browser recovers in 200ms, stay silent
      const recheckId = window.setTimeout(() => {
        if (navigator.onLine) goOnline();
        else goOffline();
      }, 200);
      // also store on the timer so cleanup cancels it
      timer = recheckId;
    };

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissedRef.current = true;
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const dismiss = () => {
    dismissedRef.current = true;
    setOpen(false);
  };

  return (
    <>
      {/* Full-screen animated 404-style offline page */}
      <AnimatePresence>
        {open && offline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            role="alertdialog"
            aria-label="حالت آفلاین کوچ‌نشین — صفحه ۴۰۴"
            className="fixed inset-0 z-[80] overflow-y-auto"
          >
            <NotFoundView offline onRetry={() => window.location.reload()} onDismiss={dismiss} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dismissed pill — small floating reminder while still offline */}
      <AnimatePresence>
        {offline && !open && (
          <motion.button
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={() => {
              dismissedRef.current = false;
              setOpen(true);
            }}
            role="status"
            aria-live="polite"
            aria-label="آفلاین — باز کردن دوباره صفحه ۴۰۴"
            className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[46] mx-auto flex w-fit items-center gap-2 rounded-full border border-sunset/30 bg-forest/95 py-2 pl-4 pr-3 text-cream shadow-[0_16px_40px_-16px_rgba(11,31,26,0.7)] backdrop-blur-xl lg:bottom-6"
          >
            <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sunset/20">
              <CloudOff className="h-4 w-4 text-sunset" />
              <span className="absolute inset-0 animate-ping rounded-full bg-sunset/25" />
            </span>
            <span className="text-xs font-bold leading-none">
              اتصال قطع است — نمایش دوباره
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
