"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  max?: number;
  scale?: number;
}

export function TiltCard({
  children,
  className,
  max = 10,
  scale = 1.02,
}: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const s = useMotionValue(1);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20 });
  const ss = useSpring(s, { stiffness: 200, damping: 20 });
  const transform = useTransform(
    [srx, sry, ss],
    ([ax, ay, as]) =>
      `perspective(1000px) rotateX(${ax}deg) rotateY(${ay}deg) scale(${as})`
  );

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rx.set((0.5 - py) * max);
    ry.set((px - 0.5) * max);
  };

  const reset = () => {
    rx.set(0);
    ry.set(0);
    s.set(1);
  };

  return (
    <motion.div
      ref={ref}
      style={{ transform }}
      onMouseMove={handleMove}
      onMouseEnter={() => s.set(scale)}
      onMouseLeave={reset}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
