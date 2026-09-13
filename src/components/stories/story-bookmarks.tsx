"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkCheck, X } from "lucide-react";
import { useStoryBookmarks } from "@/store/story-bookmarks-store";
import { useStories } from "@/store/stories-store";
import { useGo } from "@/lib/use-go";
import { toFa } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Story Bookmarks — Stories enhancement (spec §6).
 *
 * Two parts:
 * 1. A toggle button (rendered on each story card / detail page).
 * 2. A "Bookmarked Stories" section in the stories feed showing only
 *    bookmarked stories as a horizontal scroll row.
 *
 * The toggle is a bookmark icon that animates between outline (not saved)
 * and filled (saved). Clicking it toggles the bookmark state.
 */

export function BookmarkButton({
  storyId,
  className,
  size = "sm",
}: {
  storyId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const isBookmarked = useStoryBookmarks((s) => s.bookmarkedIds.includes(storyId));
  const toggle = useStoryBookmarks((s) => s.toggleBookmark);
  const sizeCls = size === "sm" ? "h-6 w-6" : "h-8 w-8";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(storyId);
        if (isBookmarked) {
          toast.info("از ذخیره‌شده‌ها حذف شد.");
        } else {
          toast.success("داستان ذخیره شد! ✨");
        }
      }}
      className={cn(
        "grid place-items-center rounded-full transition",
        sizeCls,
        isBookmarked
          ? "bg-gold/15 text-gold"
          : "bg-white/15 text-white backdrop-blur hover:bg-white/25",
        className,
      )}
      aria-label={isBookmarked ? "حذف از ذخیره‌شده‌ها" : "ذخیره داستان"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isBookmarked ? (
          <motion.span
            key="bookmarked"
            initial={{ scale: 0.5, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 30 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <BookmarkCheck className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", "fill-gold")} />
          </motion.span>
        ) : (
          <motion.span
            key="not-bookmarked"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Bookmark className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Bookmarked Stories section — horizontal scroll row of bookmarked stories.
 * Renders only when the user has 1+ bookmarks.
 */
export function BookmarkedStories() {
  const bookmarkedIds = useStoryBookmarks((s) => s.bookmarkedIds);
  const stories = useStories((s) => s.stories);
  const clearAll = useStoryBookmarks((s) => s.clearAll);
  const go = useGo();

  const bookmarked = React.useMemo(
    () => stories.filter((s) => bookmarkedIds.includes(s.id)),
    [stories, bookmarkedIds],
  );

  if (bookmarked.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gold/10 text-gold">
            <BookmarkCheck className="h-4 w-4 fill-gold" />
          </span>
          <div>
            <h2 className="text-base font-extrabold">ذخیره‌شده‌ها</h2>
            <p className="text-[10px] text-muted-foreground">
              {toFa(bookmarked.length)} داستان برای بعد
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-muted-foreground transition hover:bg-muted"
        >
          <X className="h-3 w-3" />
          پاک کردن همه
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <AnimatePresence mode="popLayout">
          {bookmarked.map((s, i) => (
            <motion.button
              key={s.id}
              type="button"
              layout
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              onClick={() => go("story-detail", { id: s.id })}
              className="group relative w-48 shrink-0 overflow-hidden rounded-2xl border bg-card text-right shadow-sm ring-1 ring-black/[0.02] transition hover:shadow-md"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={s.coverImageUrl}
                  alt={s.caption}
                  loading="lazy"
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute right-2 top-2">
                  <BookmarkCheck className="h-4 w-4 fill-gold text-gold drop-shadow" />
                </span>
              </div>
              <div className="p-2">
                <p className="line-clamp-1 text-[11px] font-bold">{s.location ?? s.tourTitle}</p>
                <p className="line-clamp-1 text-[9px] text-muted-foreground">{s.authorName}</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
