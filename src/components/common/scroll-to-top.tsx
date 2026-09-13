"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollFlag } from "@/hooks/use-scroll-state";

const R = 21;
const CIRC = 2 * Math.PI * R;

/**
 * Back-to-top button with a scroll-progress ring.
 * A solid gold ring (soft glow) fills clockwise as the user scrolls — at the
 * end of the page the arrow turns gold too (small reward moment).
 * Finish reward (user request): when the page bottom is reached a rotating
 * conic shimmer ring + a breathing gold halo light up around the button.
 * The old decorative gold corner dot was removed (user request).
 */
export function ScrollToTop() {
  const visible = useScrollFlag((y) => y > 600);
  // On mobile tour detail the sticky booking bar and on /checkout the sticky
  // payment summary bar sit above the bottom nav — lift the button above both
  // there (mobile only, desktop untouched).
  const pathname = usePathname() || "";
  const aboveStickyBar = /^\/tours\/[^/]+/.test(pathname) || /^\/checkout/.test(pathname);
  const ringRef = React.useRef<SVGCircleElement>(null);
  // Finish flourish: reaching the end of the page turns the arrow gold once.
  const [done, setDone] = React.useState(false);
  const doneRef = React.useRef(false);

  const paint = React.useCallback(() => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (ringRef.current) {
      ringRef.current.style.strokeDashoffset = String(CIRC * (1 - p));
    }
    const full = p >= 0.97;
    if (full !== doneRef.current) {
      doneRef.current = full;
      setDone(full);
    }
  }, []);

  // One passive rAF-batched scroll/resize listener — writes the dash offset
  // straight to the SVG node (zero re-renders while scrolling).
  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [paint]);

  // The button mounts/unmounts via AnimatePresence — repaint once on mount
  // so the ring starts at the correct progress instead of empty.
  React.useEffect(() => {
    if (visible) paint();
  }, [visible, paint]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollTop}
          aria-label={`بازگشت به بالا — ${Math.round(
            (() => {
              const doc = document.documentElement;
              const max = doc.scrollHeight - window.innerHeight;
              return max > 0 ? (window.scrollY / max) * 100 : 0;
            })(),
          )} درصد اسکرول شده`}
          className={cn(
            "fixed bottom-6 left-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition hover:bg-emerald-dark max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
            aboveStickyBar && "max-lg:bottom-[calc(8.75rem+env(safe-area-inset-bottom))]",
          )}
        >
          {/* ===== Finish reward: golden shine at page bottom ===== */}
          <AnimatePresence>
            {done && (
              <>
                {/* breathing halo */}
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.4 }}
                  className="absolute -inset-2 -z-10 rounded-full bg-gold/30 blur-md"
                  style={{ animation: "shimmer-halo 1.8s ease-in-out infinite" }}
                />
                {/* rotating conic shimmer ring */}
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: { duration: 0.35 },
                    rotate: { duration: 2.4, ease: "linear", repeat: Infinity },
                  }}
                  className="absolute -inset-[3px] rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0%, transparent 55%, rgba(217,169,78,0.15) 68%, #f3d489 82%, #ffffff 90%, #d9a94e 96%, transparent 100%)",
                    WebkitMask:
                      "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
                    filter: "drop-shadow(0 0 6px rgba(217,169,78,0.65))",
                  }}
                />
              </>
            )}
          </AnimatePresence>
          {/* Scroll-progress ring — fills with page scroll.
              Solid brand gold on a whisper-subtle track (the old gold→sunset
              gradient read muddy at this size — user asked for a new look). */}
          <svg
            viewBox="0 0 48 48"
            aria-hidden
            className="absolute inset-0 h-full w-full -rotate-90"
          >
            <circle
              cx="24"
              cy="24"
              r={R}
              fill="none"
              strokeWidth="2.5"
              className="stroke-foreground/15"
            />
            <circle
              ref={ringRef}
              cx="24"
              cy="24"
              r={R}
              fill="none"
              stroke="#d9a94e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC}
              style={{ filter: "drop-shadow(0 0 3px rgba(217,169,78,0.45))" }}
            />
          </svg>
          <ArrowUp
            className={cn(
              "relative h-5 w-5 transition-all duration-500",
              done && "scale-110 text-gold drop-shadow-[0_0_8px_rgba(217,169,78,0.8)]",
            )}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
