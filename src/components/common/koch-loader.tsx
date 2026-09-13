"use client";

import * as React from "react";
import { motion } from "framer-motion";

/**
 * KochLoader — the themed route-loading scene (user request: «یه لودینگ جذاب
 * که به تم سایتمون بخوره»).
 *
 * A nomad camp being raised while the caravan moves: a tent with pulsing
 * door-glow and rising smoke, a dashed migration trail with travelling
 * lantern dots, the KochNeshin wordmark and a «در حال کوچ…» status.
 * Pure CSS/Framer loops — no assets, works everywhere.
 */

const TRAIL_DOTS = [
  { delay: 0, dur: 2.6 },
  { delay: 0.9, dur: 2.6 },
  { delay: 1.8, dur: 2.6 },
];

export function KochLoader({ label = "در حال کوچ به مقصد…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="grid min-h-[62vh] w-full place-items-center px-4"
    >
      <div className="flex flex-col items-center gap-5">
        {/* ---- scene ---- */}
        <svg
          viewBox="0 0 300 170"
          className="w-64 md:w-72"
          aria-hidden
        >
          <defs>
            <linearGradient id="kl-tent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d8f6f" />
              <stop offset="100%" stopColor="#0f6b4a" />
            </linearGradient>
          </defs>

          {/* moon glow */}
          <circle cx="252" cy="34" r="22" fill="rgba(217,169,78,0.14)" />
          <circle cx="252" cy="34" r="12" fill="#d9a94e" opacity="0.85" />
          <circle cx="247" cy="30" r="10" fill="#f7f3ec" opacity="0.12" />

          {/* ground */}
          <path
            d="M0 138 C 60 126, 130 146, 190 134 S 270 122, 300 130 V170 H0 Z"
            fill="rgba(15,107,74,0.08)"
          />
          {/* migration trail */}
          <path
            d="M14 150 C 80 136, 150 158, 286 140"
            fill="none"
            stroke="#0f6b4a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 10"
            opacity="0.45"
          />
          {/* travelling lantern dots (the caravan) */}
          {TRAIL_DOTS.map((d, i) => (
            <circle key={i} r="3.4" fill="#d9a94e" className="koch-traveller" style={{ animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }} />
          ))}

          {/* tent glow + tent */}
          <circle cx="86" cy="104" r="30" fill="rgba(217,169,78,0.13)" className="koch-tent-glow" />
          <path d="M86 64 L120 122 H52 Z" fill="url(#kl-tent)" />
          <path d="M86 82 L102 122 H70 Z" fill="#d9a94e" className="koch-tent-glow" />
          <path d="M86 64 V50 h11 v6 h-11" fill="none" stroke="#d9a94e" strokeWidth="2.5" strokeLinecap="round" />

          {/* smoke */}
          <circle cx="80" cy="44" r="3.4" fill="rgba(247,243,236,0.5)" className="koch-smoke" />
          <circle cx="90" cy="38" r="2.6" fill="rgba(247,243,236,0.4)" className="koch-smoke [animation-delay:0.9s]" />
          <circle cx="84" cy="32" r="2.1" fill="rgba(247,243,236,0.3)" className="koch-smoke [animation-delay:1.8s]" />
        </svg>

        {/* ---- wordmark + status ---- */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex flex-col items-center gap-1.5"
        >
          <p className="text-lg font-extrabold tracking-tight text-foreground">
            کوچ‌نشین
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground" aria-hidden>
            {label}
            <span className="inline-flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 rounded-full bg-gold"
                  style={{
                    animation: `koch-dot-bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
                  }}
                />
              ))}
            </span>
          </p>
          {/* shimmer progress bar */}
          <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-secondary">
            <div className="koch-progress h-full w-1/2 rounded-full bg-gradient-to-l from-transparent via-gold to-transparent" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
