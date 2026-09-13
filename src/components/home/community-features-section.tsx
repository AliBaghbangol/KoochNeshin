"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Radio,
  ShieldCheck,
  Camera,
  Users,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useGo } from "@/lib/use-go";
import { flagOn, type FeatureFlagKey } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

interface Feature {
  icon: typeof MessageSquare;
  title: string;
  body: string;
  cta: string;
  tone: string;
  view: "trip-room" | "live-trip" | "safety-center" | "stories" | "buddies" | "tours";
  flag: FeatureFlagKey;
  /** icon-badge gradient + accent text color */
  badge: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: MessageSquare,
    title: "اتاق سفر",
    body: "برای هر رزرو تأییدشده یک فضای مشترک با لیدر و هم‌مسافران — قبل، حین و بعد سفر. چت، اعلامیه، چک‌لیست و نظرسنجی.",
    cta: "کاوش اتاق سفر",
    tone: "from-emerald/15 to-emerald/5",
    view: "trip-room",
    flag: "tripRoom",
    badge: "from-emerald to-emerald-dark text-cream shadow-emerald/30",
    accent: "text-emerald",
  },
  {
    icon: Radio,
    title: "حالت زنده سفر",
    body: "موقعیت‌یابی واقعی، آمار لحظه‌ای، فاصله تا نقطه بعدی و دکمه SOS با نگه‌داشتن طولانی + پنجره لغو.",
    cta: "تجربه حالت زنده",
    tone: "from-sunset/15 to-sunset/5",
    view: "live-trip",
    flag: "liveTrip",
    badge: "from-sunset to-sunset-dark text-white shadow-sunset/30",
    accent: "text-sunset",
  },
  {
    icon: ShieldCheck,
    title: "مرکز ایمنی سفر",
    body: "امتیاز ایمنی شفاف از ۶ بُعد، چک‌لیست قبل از سفر، تایم‌لاین رویدادها و فرم گزارش حادثه.",
    cta: "مرکز ایمنی",
    tone: "from-gold/15 to-gold/5",
    view: "safety-center",
    flag: "safetyCenter",
    badge: "from-gold to-gold-light text-forest shadow-gold/30",
    accent: "text-gold",
  },
  {
    icon: Camera,
    title: "داستان‌های سفر",
    body: "خاطرات مسافران کوچ‌نشین را ببین و تجربه‌هایت را با جامعه به اشتراک بگذار. آپلود عکس، کپشن و امتیاز ستاره‌ای.",
    cta: "داستان‌ها را ببین",
    tone: "from-emerald-light/15 to-emerald-light/5",
    view: "stories",
    flag: "travelStories",
    badge: "from-emerald-light to-emerald text-cream shadow-emerald-light/30",
    accent: "text-emerald-light",
  },
  {
    icon: Users,
    title: "هم‌سفریابی",
    body: "مسافران سازگار با Travel DNA خودت را پیدا کن. امتیاز تطابق هوشمند + حریم خصوصی متقابل.",
    cta: "هم‌سفر پیدا کن",
    tone: "from-accent/15 to-accent/5",
    view: "buddies",
    flag: "travelBuddy",
    badge: "from-accent to-sunset-dark text-white shadow-accent/30",
    accent: "text-accent",
  },
  {
    icon: Sparkles,
    title: "Fit Score قابل‌توضیح",
    body: "نمی‌دانستی چرا یک تور به تو می‌آید؟ حالا هر تور دلیل صریح دارد — نه فقط عدد، جمله‌ی قابل‌فهم.",
    cta: "امتحان کن",
    tone: "from-cream/15 to-cream/5",
    view: "tours",
    flag: "fitScoreExplainability",
    badge: "from-forest to-emerald-dark text-gold shadow-forest/30",
    accent: "text-gold",
  },
];

/**
 * Community Features section for the home page — surfaces all Part 2
 * features (§8 Killer Loop) right on the landing so users can discover them
 * without going through the dashboard.
 *
 * Design notes (user request):
 *  - No emoji anywhere — icon-driven cards with animated gradient badges.
 *  - On lg the grid is 6 tracks wide; every card spans 2 tracks (3 per row)
 *    and an incomplete last row is CENTERED (col-start computed per row),
 *    so 2 leftover cards sit balanced in the middle instead of hugging the
 *    right edge.
 */
export function CommunityFeaturesSection() {
  const go = useGo();
  const visible = FEATURES.filter((f) => f.flag === "fitScoreExplainability" || flagOn(f.flag));

  // Centering math for the last row on lg (6-track grid, card = 2 tracks):
  // lastRowCount 3 → starts at track 1 · 2 → track 2 · 1 → track 3.
  const lastRowCount = visible.length % 3 === 0 ? 3 : visible.length % 3;
  const lastRowStart = visible.length - lastRowCount;
  const colStartClass =
    lastRowCount === 2 ? "lg:col-start-2" : lastRowCount === 1 ? "lg:col-start-3" : "";
  // v27 — sm last-card full-width ONLY when the count is odd (a true single
  // leftover). With 6 cards it forced «Fit Score قابل‌توضیح» to span both
  // columns on tablets while «هم‌سفریابی» sat alone — user wants them
  // side by side (کنار هم) at sm/md.
  const smSpanLastClass = visible.length % 2 === 1 ? "sm:last:col-span-2" : "";
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
      {/* heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-[11px] font-bold text-emerald">
          <Sparkles className="h-3.5 w-3.5" />
          امکانات ویژه کوچ‌نشین
        </span>
        <h2 className="mt-3 text-2xl font-black md:text-4xl">
          سفر، حالا تجربه‌ای اجتماعی‌تر
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          از اتاق گفت‌وگوی هر سفر تا حالت زنده، از مرکز ایمنی تا هم‌سفریابی —
          همه برای سفرهای امن‌تر و خاطره‌انگیزتر.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {visible.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.button
              key={f.title}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() =>
                go(f.view, f.view === "trip-room" || f.view === "live-trip" ? { bookingId: "ub1" } : undefined)
              }
              className={cn(
                "group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 text-right transition-shadow hover:shadow-xl lg:col-span-2",
                f.tone,
                // sm/md: full-width only for a single leftover card
                smSpanLastClass,
                // lg: 3 cards per row; center the incomplete last row
                i === lastRowStart && colStartClass,
              )}
            >
              {/* sheen sweep on hover — dynamic, no emoji needed */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
              {/* decorative glow */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl opacity-60 transition group-hover:opacity-100" />

              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  {/* animated gradient icon badge — pulses on hover */}
                  <span className="relative">
                    {/* halo ring that blooms on hover */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -inset-1.5 rounded-2xl bg-gradient-to-br opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-40",
                        f.badge,
                      )}
                    />
                    <span
                      className={cn(
                        "relative grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6",
                        f.badge,
                      )}
                    >
                      <Icon className="h-6 w-6 transition-transform duration-500 group-hover:scale-110" />
                    </span>
                  </span>
                  <span className={cn("h-px flex-1 bg-gradient-to-l from-transparent via-current opacity-20", f.accent)} />
                </div>

                <h3 className="text-base font-extrabold">{f.title}</h3>
                <p className="mt-2 text-[12px] leading-6 text-muted-foreground">
                  {f.body}
                </p>

                {/* CTA pill — border deepens on hover, arrow nudges left */}
                <span
                  className={cn(
                    "mt-4 inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/50 px-3.5 py-1.5 text-[12px] font-bold transition-all duration-300 group-hover:border-foreground/25 group-hover:bg-background/80 group-hover:shadow-sm",
                    f.accent,
                  )}
                >
                  {f.cta}
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
