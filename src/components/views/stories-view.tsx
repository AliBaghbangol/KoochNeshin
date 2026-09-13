"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, Plus, Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StoryFeed } from "@/components/stories/story-feed";
import { StoryComposer } from "@/components/stories/story-composer";
import { StoryOfWeekHero } from "@/components/stories/story-of-week-hero";
import { StoryOfWeekSkeleton, StoryFeedSkeleton } from "@/components/stories/story-skeletons";
import { StoryOfMonthArchive } from "@/components/stories/story-of-month-archive";
import { BookmarkedStories } from "@/components/stories/story-bookmarks";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { useBookings } from "@/store/bookings-store";
import { MOCK_BOOKINGS } from "@/lib/bookings/mock-bookings";
import { flagOn } from "@/lib/feature-flags";
import { toFa } from "@/lib/format";
import { useGo } from "@/lib/use-go";

/**
 * Stories view — spec §6.
 * URL: /stories
 *
 * Top: banner "📸 خاطرات سفرت آماده‌ی انتشار است" for any booking with
 * `completedAt` (spec §6 trigger).
 */
export function StoriesView() {
  const [filter, setFilter] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const userBookings = useBookings((s) => s.bookings);
  const completed = [...userBookings, ...MOCK_BOOKINGS].filter((b) => b.completedAt);
  const go = useGo();

  if (!flagOn("travelStories")) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center p-6 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-muted text-muted-foreground">
            <Camera className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold">داستان‌های سفر فعلاً غیرفعال است</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <ScrollReveal>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black">داستان‌های سفر</h1>
            <p className="mt-1 text-[12px] text-muted-foreground">
              خاطرات مسافران کوچ‌نشین از زیباترین نقاط ایران
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            ساخت داستان جدید
          </Button>
        </div>

        {completed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex flex-col gap-2 rounded-3xl border border-gold/40 bg-gradient-to-l from-gold/10 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/15 text-gold">
                <Camera className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">
                  📸 خاطرات {toFa(completed.length)} سفرت آماده‌ی انتشار است!
                </p>
                <p className="text-[11px] text-muted-foreground">
                  عکس‌ها و تجربه‌هایت را با جامعه‌ی کوچ‌نشین به اشتراک بگذار.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              شروع کن
            </Button>
          </motion.div>
        )}

        {/* داستان هفته — hero با پارالاکس */}
        <StoryOfWeekHero />

        {/* داستان‌های ذخیره‌شده توسط کاربر */}
        <BookmarkedStories />

        {/* آرشیو داستان‌های برتر ماهانه */}
        <StoryOfMonthArchive />

        <div className="mb-5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="جستجو در داستان‌ها (مقصد، تور، متن)..."
              className="pr-9"
            />
          </div>
        </div>

        <StoryFeed filter={filter} />
      </ScrollReveal>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald" />
              ساخت داستان سفر
            </DialogTitle>
          </DialogHeader>
          <StoryComposer onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
