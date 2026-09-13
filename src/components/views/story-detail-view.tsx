"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Heart, MessageCircle, MapPin, Star, Share2, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useStories } from "@/store/stories-store";
import { StoryReactions } from "@/components/stories/story-reactions";
import { StoryShareDialog } from "@/components/stories/story-share-dialog";
import { BookmarkButton } from "@/components/stories/story-bookmarks";
import { ReadingTimeBadge, StoryReadingProgress } from "@/components/stories/story-reading-progress";
import { StoryComments } from "@/components/stories/story-comments";
import { toFa, toPersianDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function StoryDetailView() {
  const params = useParams<{ id: string }>();
  const story = useStories((s) => s.stories.find((x) => x.id === params?.id));
  const toggleLike = useStories((s) => s.toggleLike);
  const [shareOpen, setShareOpen] = React.useState(false);

  if (!story) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center p-6 text-center">
        <div>
          <h2 className="text-lg font-extrabold">داستان پیدا نشد</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ممکن است حذف شده باشد.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <StoryReadingProgress />
      <button
        onClick={() => window.history.back()}
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        بازگشت
      </button>

      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="relative aspect-[16/9] sm:aspect-[2/1]">
            <img
              src={story.coverImageUrl}
              alt={story.caption}
              className="size-full object-cover"
            />
            {story.tourTitle && (
              <span className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                {story.tourTitle}
              </span>
            )}
          </div>
          <div className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={story.authorAvatar} alt={story.authorName} />
                <AvatarFallback>{story.authorName.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-bold">{story.authorName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {toPersianDate(story.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
                  <Share2 className="h-3.5 w-3.5" />
                  اشتراک
                </Button>
                <BookmarkButton storyId={story.id} size="md" className="border bg-card text-muted-foreground hover:bg-muted" />
              </div>
            </div>

            <h1 className="text-xl font-black">
              {story.location ?? story.tourTitle ?? "سفر بدون نام"}
            </h1>
            {story.location && (
              <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {story.location}
              </p>
            )}

            <p className="mt-3 whitespace-pre-line text-[14px] leading-7 text-foreground/90">
              {story.caption}
            </p>

            {/* reading time estimate */}
            <div className="mt-2">
              <ReadingTimeBadge caption={story.caption} photoCount={story.gallery.length} />
            </div>

            {story.stats && (
              <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                {story.stats.photosCount !== undefined && (
                  <span>📷 {toFa(story.stats.photosCount)} عکس</span>
                )}
                {story.stats.distanceKm !== undefined && (
                  <span>🥾 {toFa(story.stats.distanceKm)} کیلومتر پیمایش</span>
                )}
                {story.stats.elevationM !== undefined && (
                  <span>⛰️ {toFa(story.stats.elevationM)} متر ارتفاع</span>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleLike(story.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm transition",
                    story.likedByMe ? "text-red-500" : "text-muted-foreground hover:text-red-500",
                  )}
                >
                  <Heart className={cn("h-5 w-5", story.likedByMe && "fill-red-500")} />
                  {toFa(story.likesCount)}
                </button>
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageCircle className="h-5 w-5" />
                  {toFa(story.commentsCount)}
                </span>
                {/* emoji reactions */}
                <StoryReactions story={story} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < (story.rating ?? 0)
                          ? "fill-gold text-gold"
                          : "text-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => toast.success("گزارش ثبت شد.")}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  aria-label="گزارش داستان"
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {story.gallery.length > 1 && (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-bold">گالری عکس‌ها</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {story.gallery.map((url, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square overflow-hidden rounded-2xl"
                >
                  <img src={url} alt="" className="size-full object-cover" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.article>

      {/* comments section */}
      <StoryComments storyId={story.id} />

      {/* share dialog */}
      <StoryShareDialog
        story={story}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </div>
  );
}
