"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Bell } from "lucide-react";
import { useGo } from "@/lib/use-go";

interface DiscountToast {
  id: string;
  text: string;
  cta: string;
  view: string;
  storageKey: string;
}

const DISCOUNT_TOASTS: DiscountToast[] = [
  {
    id: "summer-sale",
    text: "🎉 فصل سفر فرا رسید! تا ۲۵٪ تخفیف روی تورهای منتخب تابستانه.",
    cta: "مشاهده تخفیف‌ها",
    view: "tours",
    storageKey: "kochneshin-toast-summer-sale-dismissed",
  },
  {
    id: "damavand-special",
    text: "🔥 صعود به دماوند با ۱۵٪ تخفیف ویژه — فقط ۳ ظرفیت باقی‌مانده!",
    cta: "رزرو کنید",
    view: "tours",
    storageKey: "kochneshin-toast-damavand-special-dismissed",
  },
];

// Simple notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // ignore — sound not critical
  }
}

export function AnnouncementBanner() {
  const go = useGo();
  const [visible, setVisible] = React.useState(false);
  const [toast, setToast] = React.useState<DiscountToast | null>(null);

  const dismiss = React.useCallback(() => {
    setToast((current) => {
      if (current) {
        try {
          localStorage.setItem(current.storageKey, "1");
        } catch {
          // ignore
        }
      }
      return current;
    });
    setVisible(false);
  }, []);

  React.useEffect(() => {
    const active = DISCOUNT_TOASTS.find((b) => {
      try {
        return !localStorage.getItem(b.storageKey);
      } catch {
        return true;
      }
    });
    if (active) {
      setToast(active);
      const t = setTimeout(() => {
        setVisible(true);
        playNotificationSound();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, []);

  // Auto-dismiss after 5 seconds
  React.useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(t);
  }, [visible, dismiss]);

  if (!toast) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-x-0 top-20 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl border-2 border-gold/40 bg-card px-4 py-3 shadow-2xl md:max-w-lg max-sm:inset-x-3 max-sm:px-3"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
            <Bell className="h-5 w-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-6">{toast.text}</p>
            <button
              onClick={() => {
                dismiss();
                go(toast.view, {});
              }}
              className="mt-1 flex items-center gap-1 text-xs font-bold text-primary transition hover:underline"
            >
              {toast.cta}
              <ArrowLeft className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={dismiss}
            aria-label="بستن"
            className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Auto-dismiss progress bar */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="absolute bottom-0 left-0 h-1 rounded-full bg-gold"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
