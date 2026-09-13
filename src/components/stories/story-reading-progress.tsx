"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Clock } from "lucide-react";
import { toFa } from "@/lib/format";

/**
 * Story Reading Progress — Stories enhancement (spec §6).
 *
 * Two parts:
 * 1. A reading time estimate badge ("⏱ N دقیقه مطالعه") shown near the
 *    caption. Calculated from the caption's word count at ~200 wpm (Persian).
 * 2. A thin progress bar fixed at the top of the viewport that fills as the
 *    user scrolls through the story detail page.
 */

export function ReadingTimeBadge({
  caption,
  photoCount = 0,
}: {
  caption: string;
  photoCount?: number;
}) {
  // Reading time = caption words at ~200 wpm + ~5 seconds per gallery photo
  const words = caption.trim().split(/\s+/).filter(Boolean).length;
  const textMinutes = words / 200;
  const photoMinutes = (photoCount * 5) / 60; // 5 sec per photo → minutes
  const totalMinutes = Math.max(1, Math.round(textMinutes + photoMinutes));

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
      <Clock className="h-3 w-3" />
      {toFa(totalMinutes)} دقیقه مطالعه
    </span>
  );
}

export function StoryReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-1 origin-right bg-gradient-to-l from-emerald via-emerald-dark to-emerald"
      style={{ scaleX }}
    />
  );
}
