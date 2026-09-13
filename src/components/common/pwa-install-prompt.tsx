"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Tent,
  X,
  Wifi,
  ShieldCheck,
  BellRing,
  PlusSquare,
  MoreVertical,
  MonitorDown,
} from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/track";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// v2 key — the old 7-day lockout (koch-pwa-dismissed-at) made the nudge
// disappear forever after a single accidental dismiss (user report: «نوتیف نصب
// PWA نمیاد»). New key invalidates old dismissals; windows are short now.
const DISMISS_KEY = "koch-pwa-dismissed-v2";
// «فعلا نه» → quiet for 3 days, «متوجه شدم» → 1 day, installed → 30 days.
const NOT_NOW_DAYS = 3;
const GOT_IT_DAYS = 1;
const INSTALLED_DAYS = 30;
// Cookie banner owns the bottom-of-page area first (QA round 7: the two
// floating cards overlapped on mobile and blocked the consent buttons).
// …but never wait forever: if the banner stays unanswered, proceed anyway.
const CONSENT_KEY = "kochneshin-cookie-consent";
const CONSENT_CAP_MS = 12000;
// v21.9.2: minimum dwell time before the install nudge may appear at all.
// Fresh sessions used to see «کوکی» answered → PWA card a heartbeat later,
// which reads as popup spam. Now the earliest possible nudge is 15s after
// page load (real engagement, not reflex-answering).
const MIN_DWELL_MS = 15000;
// How long to wait for a beforeinstallprompt before falling back to the
// manual "how to install" nudge.
const MANUAL_FALLBACK_MS = 4500;

type Platform = "ios" | "android" | "desktop";

const MANUAL_STEPS: Record<Platform, { icon: React.ElementType; steps: string[] }> = {
  ios: {
    icon: PlusSquare,
    steps: [
      "روی دکمه‌ی اشتراک‌گذاری سافاری بزن (مربع با فلش رو به بالا)",
      "گزینه‌ی «افزودن به صفحه اصلی» رو انتخاب کن",
    ],
  },
  android: {
    icon: MoreVertical,
    steps: [
      "منوی سه‌نقطه‌ی مرورگر رو باز کن",
      "گزینه‌ی «نصب برنامه» یا «افزودن به صفحه اصلی» رو بزن",
    ],
  },
  desktop: {
    icon: MonitorDown,
    steps: [
      "آیکون نصب (＋) داخل نوار آدرس مرورگر رو بزن",
      "یا از منوی مرورگر گزینه‌ی «نصب کوچ‌نشین» رو انتخاب کن",
    ],
  },
};

/**
 * PWA install prompt (A2HS).
 * Purely additive floating card: mobile floats above the bottom nav,
 * desktop pins to the bottom-left corner.
 *
 * Two modes (user request: «اگه نصب نیست نوتیفش بیاد»):
 *  - native: the browser fired `beforeinstallprompt` → real install button.
 *  - manual: the browser never fired it (iOS Safari, some desktops…) but the
 *    app is NOT installed → after a grace period show platform-specific
 *    install steps so the nudge always arrives.
 */
export function PwaInstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = React.useState(false);
  const [manualPlatform, setManualPlatform] = React.useState<Platform | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed (standalone display) → never show.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) return;

    // Respect recent dismissal (stored as an absolute expiry timestamp).
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (until && Date.now() < until) return;
    } catch {
      /* storage unavailable — continue */
    }

    const ua = navigator.userAgent;
    const platform: Platform =
      /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && "ontouchend" in document)
        ? "ios"
        : /Android/i.test(ua)
          ? "android"
          : "desktop";

    let deferredEvent: BeforeInstallPromptEvent | null = null;
    let manualTimer: number | undefined;
    let visibleTimer: number | undefined;
    let opened = false;
    const t0 = Date.now();

    /** earliest show-time gate: never before MIN_DWELL_MS after page load */
    const whenEngaged = (cb: () => void) => {
      if (visibleTimer !== undefined) window.clearTimeout(visibleTimer);
      visibleTimer = window.setTimeout(
        cb,
        Math.max(0, MIN_DWELL_MS - (Date.now() - t0)),
      );
    };

    // Both modes wait for the cookie banner to be answered first — reacting
    // to the banner's event instantly, but capped: an unanswered banner must
    // not hide the nudge forever.
    const whenConsented = (cb: () => void) => {
      const start = Date.now();
      let fired = false;
      const poll = window.setInterval(() => {
        let consented = true;
        try {
          consented = !!localStorage.getItem(CONSENT_KEY);
        } catch {
          consented = true; // storage unavailable → don't wait forever
        }
        if (consented || Date.now() - start > CONSENT_CAP_MS) finish();
      }, 800);
      const finish = () => {
        if (fired) return;
        fired = true;
        window.clearInterval(poll);
        window.removeEventListener("koch-consent-answered", finish);
        cb();
      };
      window.addEventListener("koch-consent-answered", finish);
    };

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredEvent = e as BeforeInstallPromptEvent;
      setDeferred(deferredEvent);
      setManualPlatform(null);
      if (manualTimer !== undefined) window.clearTimeout(manualTimer);
      whenConsented(() => {
        if (opened) return;
        opened = true;
        whenEngaged(() => {
          setVisible(true);
          track("pwa_nudge_shown", { mode: "native" });
        });
      });
    };

    const armManual = () => {
      manualTimer = window.setTimeout(() => {
        if (deferredEvent || opened) return; // native path won
        opened = true;
        setManualPlatform(platform);
        setVisible(true);
        track("pwa_nudge_shown", { mode: "manual", platform });
      }, MANUAL_FALLBACK_MS);
    };

    whenConsented(armManual);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      setManualPlatform(null);
      toast.success("کوچ‌نشین نصب شد! از صفحه اصلی گوشی استفاده کنید 🏕️");
      try {
        localStorage.setItem(
          DISMISS_KEY,
          String(Date.now() + INSTALLED_DAYS * 24 * 60 * 60 * 1000),
        );
      } catch {
        /* noop */
      }
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      if (manualTimer !== undefined) window.clearTimeout(manualTimer);
      if (visibleTimer !== undefined) window.clearTimeout(visibleTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = (days: number) => {
    setVisible(false);
    setManualPlatform(null);
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + days * 24 * 60 * 60 * 1000),
      );
    } catch {
      /* noop */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      toast.success("در حال نصب…");
    }
    setDeferred(null);
    setVisible(false);
  };

  const ManualIcon = manualPlatform ? MANUAL_STEPS[manualPlatform].icon : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          role="dialog"
          aria-label="نصب اپلیکیشن کوچ‌نشین"
          className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[46] mx-auto max-w-sm lg:inset-x-auto lg:right-6 lg:bottom-6 lg:mx-0"
        >
          <div className="overflow-hidden rounded-3xl border border-emerald/15 bg-background/95 shadow-[0_24px_60px_-20px_rgba(11,31,26,0.45)] backdrop-blur-xl">
            <div className="flex items-start gap-3 p-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald to-forest shadow-lg shadow-emerald/25">
                <Tent className="h-6 w-6 text-cream" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold leading-6">
                  کوچ‌نشین را نصب کن
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {deferred
                    ? "دسترسی سریع‌تر، تجربه اپلیکیشنی"
                    : "چند قدم ساده تا نصب — تو هر مرورگری جواب می‌ده:"}
                </p>
              </div>
              <button
                onClick={() => dismiss(NOT_NOW_DAYS)}
                aria-label="بستن پیشنهاد نصب"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {deferred ? (
              <div className="flex items-center gap-3 px-4 pb-3 text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Wifi className="h-3.5 w-3.5 text-emerald" />
                  ورود سریع
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
                  امن
                </span>
                <span className="flex items-center gap-1">
                  <BellRing className="h-3.5 w-3.5 text-emerald" />
                  اطلاع‌رسانی تورها
                </span>
              </div>
            ) : (
              ManualIcon && (
                <ol className="mx-4 mb-3 space-y-2 rounded-2xl bg-secondary/60 p-3 text-xs leading-6 text-foreground/80">
                  {MANUAL_STEPS[manualPlatform!].steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-extrabold text-primary">
                        {["۱", "۲"][i]}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ManualIcon className="h-4 w-4 shrink-0 text-gold" />
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              )
            )}

            <div className="grid grid-cols-2 gap-2 p-4 pt-0">
              <button
                onClick={() => dismiss(NOT_NOW_DAYS)}
                className="h-11 rounded-2xl border text-xs font-bold text-muted-foreground transition hover:bg-secondary"
              >
                فعلا نه
              </button>
              {deferred ? (
                <button
                  onClick={install}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary text-xs font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-emerald-dark"
                >
                  <Download className="h-4 w-4" />
                  نصب رایگان
                </button>
              ) : (
                <button
                  onClick={() => dismiss(GOT_IT_DAYS)}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary text-xs font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-emerald-dark"
                >
                  <PlusSquare className="h-4 w-4" />
                  متوجه شدم
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
