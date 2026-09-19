"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  Star,
  Camera,
  Users,
  MapPin,
  TrendingUp,
  Sparkles,
  Zap,
} from "lucide-react";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Live Activity Widget — Home page enhancement.
 *
 * Shows a faux real-time feed of "what's happening right now" on کوچ‌نشین:
 *   - "N نفر در حال مشاهده‌ی این تور هستند"
 *   - "Sara just booked «دماوند»"
 *   - "Hossein published a new story"
 *   - "Maryam left a 5-star review"
 *
 * Each entry cycles every ~5s with a slide-in/slide-out animation, creating
 * a sense of an active community. All names/tours are mock — TODO(backend):
 * wire to a real activity stream via WebSocket.
 *
 * Privacy: no real user PII is exposed in the demo (all names are from a
 * curated mock list). When backend exists, the activity stream should
 * respect each user's privacy settings before surfacing their name.
 */

type ActivityType =
  | "viewing"
  | "booked"
  | "story"
  | "review"
  | "joined";

interface Activity {
  type: ActivityType;
  text: string;
  detail?: string;
  emoji: string;
  tone: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    type: "viewing",
    text: "۱۲ نفر در حال مشاهده‌ی تور دماوند هستند",
    detail: "همین الان",
    emoji: "👁️",
    tone: "bg-emerald/10 text-emerald",
  },
  {
    type: "booked",
    text: "سارا تور «مرنجاب» را رزرو کرد",
    detail: "۳ دقیقه پیش",
    emoji: "✅",
    tone: "bg-emerald/10 text-emerald",
  },
  {
    type: "story",
    text: "حسین داستان جدیدی از کویر لوت منتشر کرد",
    detail: "۸ دقیقه پیش",
    emoji: "📸",
    tone: "bg-gold/10 text-gold",
  },
  {
    type: "review",
    text: "نگار به تور جنگل ابر امتیاز ۵ داد",
    detail: "۱۵ دقیقه پیش",
    emoji: "⭐",
    tone: "bg-sunset/10 text-sunset",
  },
  {
    type: "booked",
    text: "رضا ۲ بلیت برای تور تخت جمشید گرفت",
    detail: "۲۲ دقیقه پیش",
    emoji: "🎟️",
    tone: "bg-emerald/10 text-emerald",
  },
  {
    type: "joined",
    text: "مریم به جمع کوچ‌نشین پیوست — خوش آمدی! 🌿",
    detail: "۳۵ دقیقه پیش",
    emoji: "👋",
    tone: "bg-accent/10 text-accent",
  },
  {
    type: "viewing",
    text: "۹ نفر هم‌سفر جدید پیدا کردند این هفته",
    detail: "آمار هفته",
    emoji: "🤝",
    tone: "bg-emerald/10 text-emerald",
  },
  {
    type: "story",
    text: "۳ داستان سفر امروز منتشر شد",
    detail: "آمار امروز",
    emoji: "📚",
    tone: "bg-gold/10 text-gold",
  },
];

export function LiveActivityWidget() {
  const [idx, setIdx] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  // cycle every 5s — slide out, swap content, slide in
  React.useEffect(() => {
    const swapTimer = window.setInterval(() => {
      setVisible(false);
      // wait 300ms (slide-out duration) then swap + slide in
      window.setTimeout(() => {
        setIdx((i) => (i + 1) % MOCK_ACTIVITIES.length);
        setVisible(true);
      }, 350);
    }, 5000);
    return () => window.clearInterval(swapTimer);
  }, []);

  const current = MOCK_ACTIVITIES[idx];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="mx-auto mb-10 w-full max-w-6xl px-4 md:px-6"
    >
      <div className="relative overflow-hidden rounded-3xl border border-emerald/30 bg-gradient-to-l from-emerald/10 via-emerald/5 to-transparent p-4 shadow-sm">
        {/* decorative pulsing dot */}
        <span className="pointer-events-none absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-emerald text-white shadow-md">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Zap className="h-3.5 w-3.5 fill-white" />
          </motion.span>
        </span>

        <div className="flex items-center gap-3 pr-7">
          {/* live indicator */}
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
            </span>
            <span className="text-[10px] font-bold text-emerald">زنده</span>
          </div>

          {/* animated activity text */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {visible && (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm",
                      current.tone,
                    )}
                    aria-hidden
                  >
                    {current.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-foreground/90">
                      {current.text}
                    </p>
                    {current.detail && (
                      <p className="text-[10px] text-muted-foreground">
                        {current.detail}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* dots indicator */}
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {MOCK_ACTIVITIES.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all",
                  (idx + i * 0) % 5 === i || idx % 5 === i
                    ? "w-3 bg-emerald"
                    : "w-1 bg-emerald/30",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
