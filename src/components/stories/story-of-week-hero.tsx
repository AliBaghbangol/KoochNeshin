"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Star, ArrowLeft, Camera, MapPin, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStories } from "@/store/stories-store";
import { useGo } from "@/lib/use-go";
import { toFa, toPersianDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Story of the Week — featured hero banner for the Stories page.
 *
 * Picks the highest-rated story with the most likes from the store and
 * renders it as a large parallax hero. Falls back gracefully when no
 * stories exist.
 *
 * Visual: full-bleed cover image, gradient overlay, large title,
 * author chip, stats row, two CTAs (read + create your own).
 */
export function StoryOfWeekHero() {
  const stories = useStories((s) => s.stories);
  const go = useGo();
  const ref = React.useRef<HTMLDivElement>(null);

  // parallax on scroll
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 0.85, 0.95]);

  const featured = React.useMemo(() => {
    if (stories.length === 0) return null;
    return stories
      .slice()
      .sort((a, b) => {
        const scoreA = (a.rating ?? 0) * 20 + a.likesCount;
        const scoreB = (b.rating ?? 0) * 20 + b.likesCount;
        return scoreB - scoreA;
      })[0];
  }, [stories]);

  if (!featured) return null;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mb-8 isolate overflow-hidden rounded-[2rem] bg-forest shadow-xl ring-1 ring-black/[0.03]"
    >
      {/* `isolate` above is CRITICAL: without a stacking context on the
          section, the -z-10 background layers below escape and paint behind
          the page's opaque background once the entrance animation settles at
          opacity: 1 (hero looked "washed-out cream" after load). */}
      {/* parallax background image */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 -z-10 scale-110 bg-gradient-to-br from-forest via-emerald-dark to-forest"
        aria-hidden
      >
        <img
          src={featured.coverImageUrl}
          alt=""
          className="size-full object-cover"
          loading="eager"
          onError={(e) => {
            /* photo unreachable → keep the forest-gradient scene */
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </motion.div>

      {/* gradient overlay (animated opacity on scroll) */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/50 to-black/30"
        aria-hidden
      />

      {/* badge */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/95 px-3 py-1 text-[11px] font-black text-forest shadow-lg backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          داستان هفته
        </span>
      </div>

      {/* content */}
      <div className="relative flex min-h-[440px] flex-col justify-end gap-4 p-6 sm:p-8 md:min-h-[520px]">
        <div>
          {featured.tourTitle && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
              <Camera className="h-3 w-3" />
              {featured.tourTitle}
            </span>
          )}
          <h1 className="text-2xl font-black leading-tight text-white drop-shadow-md sm:text-3xl md:text-4xl">
            {featured.location ?? featured.tourTitle ?? "سفر بدون نام"}
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-white/85 drop-shadow line-clamp-2 sm:text-sm">
            {featured.caption}
          </p>
        </div>

        {/* author + stats */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-10 w-10 ring-2 ring-white/40">
              <AvatarImage src={featured.authorAvatar} alt={featured.authorName} />
              <AvatarFallback>{featured.authorName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="text-white">
              <p className="text-sm font-bold drop-shadow">{featured.authorName}</p>
              <p className="text-[10px] text-white/75 drop-shadow">
                {toPersianDate(featured.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-white drop-shadow">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              {toFa(featured.rating ?? 0)} از ۵
            </span>
            {featured.stats?.photosCount !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Camera className="h-3.5 w-3.5" />
                {toFa(featured.stats.photosCount)} عکس
              </span>
            )}
            {featured.stats?.distanceKm !== undefined && (
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                {toFa(featured.stats.distanceKm)} کیلومتر
              </span>
            )}
            {featured.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {featured.location}
              </span>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-1 flex flex-wrap gap-2">
          <Button
            size="lg"
            onClick={() => go("story-detail", { id: featured.id })}
            className="bg-white text-forest hover:bg-white/90"
          >
            خواندن داستان
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
