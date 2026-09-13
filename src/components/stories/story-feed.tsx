"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { StoryCard } from "./story-card";
import { useStories } from "@/store/stories-store";

/** Masonry-ish 2-3 column feed. */
export function StoryFeed({ filter }: { filter?: string }) {
  const stories = useStories((s) => s.stories);
  const filtered = React.useMemo(() => {
    if (!filter) return stories;
    const f = filter.trim().toLowerCase();
    return stories.filter(
      (s) =>
        s.caption.toLowerCase().includes(f) ||
        s.location?.toLowerCase().includes(f) ||
        s.tourTitle?.toLowerCase().includes(f),
    );
  }, [stories, filter]);

  if (filtered.length === 0) {
    return (
      <div className="grid place-items-center rounded-3xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
        داستان سفرای مطابق جستجو پیدا نشد.
      </div>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {filtered.map((s, i) => (
        <StoryCard key={s.id} story={s} index={i} />
      ))}
    </div>
  );
}
