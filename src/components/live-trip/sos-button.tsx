"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { track } from "@/lib/analytics/track";
import type { LiveLocation } from "@/types/live-trip";
import { cn } from "@/lib/utils";

const HOLD_MS = 3000; // long-press threshold
const UNDO_MS = 7000; // cancellation window after triggering

/**
 * SOS Button — spec §3.
 *
 * ⚠️ NEVER fire a real SOS on a single click. The flow is:
 *   1. Long-press (3s) with a progress ring around the button.
 *   2. Confirm dialog with explicit warning text.
 *   3. 7-second "Undo" window before the alert is actually dispatched.
 *   4. On dispatch: store last known location + push to notifications-store
 *      locally (TODO(backend): real push to leader + emergency contact).
 *   5. Show local emergency numbers (115 / 110).
 *
 * The legal/UX note (spec §4 mandatory rule) is shown both under the button
 * and inside the confirm dialog: "در شرایط اضطراری واقعی، حتماً با اورژانس
 * (۱۱۵) نیز تماس بگیرید."
 */
export function SosButton({
  onTrigger,
  location,
}: {
  onTrigger?: (loc?: LiveLocation) => void;
  location?: LiveLocation;
}) {
  const [holding, setHolding] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [undoOpen, setUndoOpen] = React.useState(false);
  const [undoLeft, setUndoLeft] = React.useState(UNDO_MS / 1000);

  const holdTimer = React.useRef<number | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number>(0);

  // ---- long-press handler ----
  function startHold() {
    if (confirmOpen || undoOpen) return;
    setHolding(true);
    startRef.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const p = Math.min(1, elapsed / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        setHolding(false);
        setProgress(0);
        setConfirmOpen(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }
  function cancelHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHolding(false);
    setProgress(0);
  }

  React.useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ---- confirm dialog → open undo window ----
  function confirmSos() {
    setConfirmOpen(false);
    setUndoOpen(true);
    setUndoLeft(UNDO_MS / 1000);
  }

  function dispatchSos() {
    setUndoOpen(false);
    // Analytics payload only accepts primitives — flatten the LiveLocation
    // into lat/lng numbers (undefined when location sharing is off).
    track("sos_triggered", {
      lat: location?.lat,
      lng: location?.lng,
    });
    onTrigger?.(location);
    toast.success("هشدار اضطراری به لیدر و مخاطب اضطراری شما ارسال شد.", {
      description: "شماره‌های اضطراری محلی آماده‌ی تماس هستند.",
      duration: 8000,
    });
  }

  // ---- undo countdown ----
  React.useEffect(() => {
    if (!undoOpen) return;
    const id = window.setInterval(() => {
      setUndoLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          dispatchSos();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [undoOpen]);

  function cancelSos() {
    setUndoOpen(false);
    toast.info("ارسال هشدار اضطراری لغو شد.");
  }

  const r = 28;
  const c = 2 * Math.PI * r;

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          aria-label="دکمه SOS — برای فعال‌سازی ۳ ثانیه نگه دارید"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          className={cn(
            "relative grid h-20 w-20 select-none place-items-center rounded-full text-white shadow-lg transition",
            holding
              ? "scale-105 bg-red-700"
              : "bg-red-500 hover:bg-red-600 active:scale-95",
          )}
        >
          <svg
            viewBox="0 0 64 64"
            className="absolute inset-0 -rotate-90"
            aria-hidden
          >
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
            <motion.circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={c}
              animate={{ strokeDashoffset: c * (1 - progress) }}
              transition={{ duration: 0.05 }}
            />
          </svg>
          <div className="flex flex-col items-center">
            <AlertOctagon className="h-6 w-6" />
            <span className="mt-0.5 text-[10px] font-black tracking-wider">SOS</span>
          </div>
        </button>
        <p className="text-center text-[10px] leading-4 text-muted-foreground">
          برای فعال‌سازی ۳ ثانیه نگه دارید
          <br />
          <span className="text-[9px]">
            در اضطرار واقعی، حتماً با اورژانس (۱۱۵) نیز تماس بگیرید.
          </span>
        </p>
      </div>

      {/* confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertOctagon className="h-5 w-5" />
              ارسال هشدار اضطراری
            </DialogTitle>
            <DialogDescription className="text-foreground/80">
              مطمئنی؟ این پیام اضطراری به لیدر و مخاطب اضطراری شما ارسال می‌شود
              و موقعیت فعلی تو را ثبت می‌کند.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-red-500/10 p-3 text-[11px] text-red-700 dark:text-red-300">
            در شرایط اضطراری واقعی، حتماً با اورژانس (۱۱۵) نیز تماس بگیرید.
            این دکمه جایگزین تماس با اورژانس نیست.
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              لغو
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={confirmSos}
            >
              <AlertOctagon className="h-4 w-4" />
              بله، ارسال کن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* undo window */}
      <AnimatePresence>
        {undoOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-24 z-[90] mx-auto max-w-md rounded-2xl border border-red-500/40 bg-card p-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-600">
                <AlertOctagon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold">
                  در حال ارسال هشدار... ({undoLeft}s)
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  اگر اشتباه بود همین الان لغو کن.
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelSos}
                    className="flex-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    لغو
                  </Button>
                  <a href="tel:115" className="flex-1">
                    <Button
                      size="sm"
                      className="w-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      اورژانس ۱۱۵
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
