"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Skeleton placeholder for a story card while stories are loading from
 * the (mock) data layer. Mimics the actual card shape so the layout
 * doesn't jump when real content arrives.
 */
export function StoryCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="break-inside-avoid overflow-hidden rounded-3xl border bg-card">
      {/* cover */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
        />
      </div>
      {/* body */}
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 w-3 animate-pulse rounded bg-muted" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 animate-pulse rounded bg-muted" />
            <div className="h-3 w-8 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full skeleton grid for the stories feed. */
export function StoryFeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {Array.from({ length: count }).map((_, i) => (
        <StoryCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

/** Hero skeleton for the story-of-week banner. */
export function StoryOfWeekSkeleton() {
  return (
    <div className="relative mb-8 overflow-hidden rounded-[2rem] border shadow-xl">
      <div className="relative grid min-h-[440px] place-items-center bg-gradient-to-br from-forest via-emerald-dark to-forest sm:min-h-[520px]">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 w-full max-w-md space-y-3 p-6">
          <div className="h-6 w-32 animate-pulse rounded-full bg-white/20" />
          <div className="h-10 w-full animate-pulse rounded bg-white/15" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="flex items-center gap-3 pt-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/15" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-white/15" />
              <div className="h-2 w-32 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
