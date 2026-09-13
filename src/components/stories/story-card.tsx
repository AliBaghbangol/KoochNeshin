"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, MapPin, Star, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TravelStory } from "@/types/story";
import { useStories } from "@/store/stories-store";
import { BookmarkButton } from "./story-bookmarks";
import { toFa, toPersianShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useGo } from "@/lib/use-go";

/**
 * Story card — spec §6 layout:
 *   🏔 دماوند
 *   ۱۲ تیر
 *   ۱۴ عکس · ۳ لوکیشن · ۸.۲ کیلومتر · ۱۹۴۰ متر ارتفاع
 *   ★★★★★
 */
export function StoryCard({ story, index = 0 }: { story: TravelStory; index?: number }) {
  const toggleLike = useStories((s) => s.toggleLike);
  const go = useGo();

  function handleReport(e: React.MouseEvent) {
    e.stopPropagation();
    // TODO(backend): POST /api/stories/:id/report
    toast.success("گزارش شما ثبت شد.");
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      onClick={() => go("story-detail", { id: story.id })}
      className="group cursor-pointer overflow-hidden rounded-3xl border bg-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={story.coverImageUrl}
          alt={story.caption}
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {story.tourTitle && (
          <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            {story.tourTitle}
          </span>
        )}

        <button
          type="button"
          onClick={handleReport}
          aria-label="گزارش استوری"
          className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>

        {/* bookmark button */}
        <div className="absolute left-3 top-12">
          <BookmarkButton storyId={story.id} />
        </div>

        <div className="absolute inset-x-3 bottom-3">
          <h3 className="text-sm font-black text-white">
            {story.location ?? story.tourTitle ?? "سفر بدون نام"}
          </h3>
          <p className="text-[10px] text-white/80">
            {toPersianShortDate(story.createdAt)}
          </p>
        </div>
      </div>

      <div className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={story.authorAvatar} alt={story.authorName} />
            <AvatarFallback>{story.authorName.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="text-[11px] font-bold">{story.authorName}</span>
          {story.location && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {story.location}
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">
          {story.caption}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
          {story.stats?.photosCount !== undefined && (
            <span>📷 {toFa(story.stats.photosCount)} عکس</span>
          )}
          {story.stats?.distanceKm !== undefined && (
            <span>🥾 {toFa(story.stats.distanceKm)} کیلومتر</span>
          )}
          {story.stats?.elevationM !== undefined && (
            <span>⛰️ {toFa(story.stats.elevationM)} متر</span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < (story.rating ?? 0)
                    ? "fill-gold text-gold"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(story.id);
              }}
              className={cn(
                "relative inline-flex items-center gap-1 transition",
                story.likedByMe
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500",
              )}
            >
              <motion.span
                key={story.likedByMe ? "liked" : "unliked"}
                initial={story.likedByMe ? { scale: [1, 1.4, 1] } : false}
                animate={{ scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileTap={{ scale: 0.85 }}
              >
                <Heart
                  className={cn("h-3.5 w-3.5", story.likedByMe && "fill-red-500")}
                />
              </motion.span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={story.likesCount}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 6, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {toFa(story.likesCount)}
                </motion.span>
              </AnimatePresence>
            </button>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {toFa(story.commentsCount)}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
