"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Wishlist heart micro-interaction (brief §35 — «Heart → scale + subtle burst»).
 *
 * Purely additive overlay: the wrapped icon keeps its own classes/size and the
 * host button is untouched. When `active` flips to true the icon pulses and a
 * short 6-particle burst radiates from the centre (gold/sunset). Honors
 * prefers-reduced-motion (no burst, no pulse — state colour change remains).
 */
export function HeartBurst({
  active,
  children,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const burstOn = active && !reduced;

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <motion.span
        className="inline-flex items-center justify-center"
        animate={burstOn ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {children}
      </motion.span>

      <AnimatePresence>
        {burstOn && (
          <span
            key="burst"
            aria-hidden
            className="pointer-events-none absolute inset-0"
          >
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              const dist = 15;
              return (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                  style={{
                    background: i % 2 === 0 ? "var(--gold)" : "var(--sunset)",
                    marginLeft: -3,
                    marginTop: -3,
                  }}
                  initial={{ x: 0, y: 0, opacity: 0.9, scale: 0.4 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    scale: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              );
            })}
          </span>
        )}
      </AnimatePresence>
    </span>
  );
}
