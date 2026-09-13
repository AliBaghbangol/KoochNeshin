"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Home as HomeIcon,
  Search,
  Compass,
  Tent,
  Backpack,
  BookOpen,
  RotateCw,
  WifiOff,
} from "lucide-react";
import { useGo } from "@/lib/use-go";
import { MagneticButton } from "@/components/animations/magnetic-button";
import { cn } from "@/lib/utils";

/* Deterministic star field (same on server & client — no hydration drift).
   Formula-seeded pseudo-random positions in a 100×100 grid. */
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: ((i * 37.7) % 100 + ((i * i * 13) % 17) / 17) % 100,
  y: ((i * 53.3) % 62) + ((i * 7) % 13) / 4,
  s: 1 + ((i * 11) % 3) * 0.6,
  d: ((i * 29) % 40) / 10,
  o: 0.35 + ((i * 17) % 50) / 100,
}));

const ease = [0.22, 1, 0.36, 1] as const;

export interface NotFoundViewProps {
  /**
   * offline variant — the SAME night-desert scene is reused as the full-page
   * offline experience (user: «وقتی نت قطع میشه میخام بازی نیاد به جاش یه
   * صفحه 404 خیلی جذاب و انیمیشنی بیاد»). CTAs become retry / keep browsing
   * and the quick-trails row becomes a live “waiting for connection” chip.
   */
  offline?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * 404 — «مسیر گم شد» (and the offline page, which is the same scene)
 * A calm night-desert scene in the KochNeshin palette: moonlit sky, twinkling
 * stars, and a dashed caravan trail that ends at a glowing tent with rising
 * smoke. Chic, clean, simple — and unmistakably ours.
 */
export function NotFoundView({
  offline = false,
  onRetry,
  onDismiss,
}: NotFoundViewProps = {}) {
  const go = useGo();

  const retry = React.useCallback(() => {
    if (onRetry) onRetry();
    else window.location.reload();
  }, [onRetry]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#081411] px-4 py-16 text-cream">
      {/* Sky glow (moon) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,169,78,0.22),transparent_65%)]"
      />
      {/* Stars */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {STARS.map((st, i) => (
          <span
            key={i}
            className="koch-star absolute rounded-full bg-cream"
            style={{
              left: `${st.x}%`,
              top: `${st.y}%`,
              width: st.s,
              height: st.s,
              opacity: st.o,
              animationDelay: `${st.d}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="relative z-10 flex max-w-lg flex-col items-center text-center"
      >
        {/* Scene: caravan trail → glowing tent */}
        <svg
          viewBox="0 0 320 150"
          className="mb-2 w-full max-w-[340px]"
          role="img"
          aria-label="مسیر کاروان که به چادری روشن ختم می‌شود"
        >
          {/* winding caravan trail — marching dashes */}
          <path
            d="M8 132 C 70 112, 118 140, 176 118 S 252 96, 292 102"
            fill="none"
            stroke="#d9a94e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 9"
            opacity="0.75"
            className="koch-dash"
          />

          {/* tent glow */}
          <circle cx="288" cy="96" r="26" fill="rgba(217,169,78,0.12)" className="koch-tent-glow" />
          {/* tent */}
          <path d="M288 62 L316 108 H260 Z" fill="#123b2c" stroke="#1f5a41" strokeWidth="1.5" />
          <path d="M288 76 L301 108 H275 Z" fill="#d9a94e" className="koch-tent-glow" />
          {/* flag */}
          <path d="M288 62 V50 h10 v6 h-10" fill="none" stroke="#d9a94e" strokeWidth="2" strokeLinecap="round" />

          {/* smoke puffs */}
          <circle cx="284" cy="46" r="3" fill="rgba(247,243,236,0.5)" className="koch-smoke" />
          <circle cx="292" cy="42" r="2.4" fill="rgba(247,243,236,0.4)" className="koch-smoke [animation-delay:0.9s]" />
          <circle cx="287" cy="38" r="2" fill="rgba(247,243,236,0.3)" className="koch-smoke [animation-delay:1.7s]" />

          {/* lost compass marker mid-trail */}
          <g className="koch-float" opacity="0.9">
            <circle cx="150" cy="94" r="11" fill="#0b241c" stroke="#2d8f6f" strokeWidth="1.5" />
            <path d="M150 87 l3.2 7.4 -3.2 6.6 -3.2 -6.6 Z" fill="#d9a94e" />
          </g>
        </svg>

        <h1 className="bg-gradient-to-b from-cream via-cream to-gold/80 bg-clip-text text-[5.5rem] font-black leading-none text-transparent md:text-[7rem]">
          ۴۰۴
        </h1>
        <p className="mt-3 flex items-center gap-2 text-xl font-extrabold">
          {offline ? (
            <WifiOff className="h-5 w-5 text-gold" />
          ) : (
            <Compass className="h-5 w-5 text-gold" />
          )}
          {offline ? "اتصال قطع شد!" : "مسیر گم شد!"}
        </p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-cream/60">
          {offline
            ? "این‌بار مقصر ستاره‌ها نیستن — اینترنت رسیدن به اردوگاه قطعه. تا وصل شدن دوباره، چادر و آتیش همین‌جا منتظرتن."
            : "این صفحه تو نقشه‌ی کوچ‌نشین پیدا نمی‌شه؛ حتی ستاره‌ها هم مطمئن نیستن کجا بود. بیا برگردیم سراغ جاده‌ی اصلی."}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3 max-sm:flex-col max-sm:items-stretch">
          {offline ? (
            <>
              <MagneticButton
                onClick={retry}
                className="h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/30 max-sm:w-full"
              >
                <RotateCw className="h-5 w-5" />
                تلاش دوباره
              </MagneticButton>
              <MagneticButton
                onClick={onDismiss}
                className="h-12 items-center justify-center gap-2 rounded-full border-2 border-cream/25 px-6 font-bold text-cream transition hover:border-gold/60 hover:text-gold max-sm:w-full"
              >
                <Compass className="h-5 w-5" />
                ادامه مرور آفلاین
              </MagneticButton>
            </>
          ) : (
            <>
              <MagneticButton
                onClick={() => go("home")}
                className="h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/30 max-sm:w-full"
              >
                <HomeIcon className="h-5 w-5" />
                بازگشت به خانه
              </MagneticButton>
              <MagneticButton
                onClick={() => go("tours")}
                className="h-12 items-center justify-center gap-2 rounded-full border-2 border-cream/25 px-6 font-bold text-cream transition hover:border-gold/60 hover:text-gold max-sm:w-full"
              >
                <Search className="h-5 w-5" />
                کاوش تورها
              </MagneticButton>
            </>
          )}
        </div>

        {offline ? (
          /* live waiting-for-connection chip (auto-close on reconnect) */
          <div className="mt-8 flex items-center justify-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-2.5 text-xs font-bold text-cream/70 max-sm:mx-auto">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            منتظر برگشت اتصال… وقتی وصل شدی خودکار برمی‌گردیم
          </div>
        ) : (
          <>
            {/* quick trails */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-cream/55">
              {[
                { label: "مقاصد", icon: Compass, view: "destinations" },
                { label: "تجهیزات", icon: Backpack, view: "equipment" },
                { label: "مجله", icon: BookOpen, view: "blog" },
              ].map(({ label, icon: Icon, view }) => (
                <button
                  key={view}
                  onClick={() => go(view as never)}
                  className={cn(
                    "flex min-h-9 items-center gap-1.5 rounded-full border border-cream/15 bg-cream/5 px-3.5 font-semibold text-cream/70 transition",
                    "hover:border-gold/40 hover:bg-gold/10 hover:text-gold",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
              <span className="flex items-center gap-1.5 text-cream/35">
                <Tent className="h-3.5 w-3.5" />
                چادر همین‌جا برپاست — از دوباره شروع نترس!
              </span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
