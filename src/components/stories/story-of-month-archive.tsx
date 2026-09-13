"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ArrowLeft, Star, Award, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStories } from "@/store/stories-store";
import { useGo } from "@/lib/use-go";
import { toFa, toPersianShortDate, toPersianDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** گروه‌بندی داستان‌ها بر اساس ماه شمسی (به‌صورت ساده بر اساس YYYY-MM میلادی) */
function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

/** عنوان فارسی ماه */
function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const fa = [
    "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
    "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
  ];
  return `${fa[(m - 1) % 12]} ${toFa(y)}`;
}

/**
 * Story of the Month archive — filterable by month. Shows the top stories
 * (by rating × 20 + likes) grouped by month with a small month picker at
 * the top.
 */
export function StoryOfMonthArchive() {
  const stories = useStories((s) => s.stories);
  const go = useGo();

  // Compute available months from stories
  const months = React.useMemo(() => {
    const set = new Set(stories.map((s) => monthKey(s.createdAt)));
    return Array.from(set).sort().reverse();
  }, [stories]);

  const [selectedMonth, setSelectedMonth] = React.useState<string>("all");

  // Sort + filter
  const archive = React.useMemo(() => {
    const filtered =
      selectedMonth === "all"
        ? stories
        : stories.filter((s) => monthKey(s.createdAt) === selectedMonth);
    return filtered
      .slice()
      .sort((a, b) => {
        const scoreA = (a.rating ?? 0) * 20 + a.likesCount;
        const scoreB = (b.rating ?? 0) * 20 + b.likesCount;
        return scoreB - scoreA;
      })
      .slice(0, 8);
  }, [stories, selectedMonth]);

  if (stories.length < 2) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gold/10 text-gold">
            <Award className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-extrabold">آرشیو داستان‌های برتر</h2>
            <p className="text-[10px] text-muted-foreground">
              بهترین خاطرات سفر از دیدگاه جامعه‌ی کوچ‌نشین
            </p>
          </div>
        </div>

        {/* month filter */}
        {months.length > 1 && (
          <div className="flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-8 w-[150px] text-[11px] font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه ماه‌ها</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {monthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {archive.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed bg-card/40 p-8 text-center text-[12px] text-muted-foreground">
          هیچ داستانی در این ماه وجود ندارد.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="popLayout">
            {archive.map((s, i) => (
              <motion.button
                key={s.id}
                type="button"
                layout
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                onClick={() => go("story-detail", { id: s.id })}
                className="group relative w-60 shrink-0 overflow-hidden rounded-2xl border bg-card text-right shadow-sm ring-1 ring-black/[0.02] transition hover:shadow-md"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={s.coverImageUrl}
                    alt={s.caption}
                    loading="lazy"
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur">
                    <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                    {toFa(s.rating ?? 0)}
                  </span>
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur">
                    <Calendar className="h-2.5 w-2.5" />
                    {toPersianShortDate(s.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5">
                  <Avatar className="h-6 w-6 ring-1 ring-background">
                    <AvatarImage src={s.authorAvatar} alt={s.authorName} />
                    <AvatarFallback>{s.authorName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <p className="flex-1 truncate text-[11px] font-bold">{s.authorName}</p>
                  <span className="text-[9px] text-muted-foreground">
                    ❤️ {toFa(s.likesCount)}
                  </span>
                </div>
                <p className="line-clamp-1 px-2.5 pb-2.5 text-[10px] text-muted-foreground">
                  {s.caption}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
          <div className="grid w-32 shrink-0 place-items-center rounded-2xl border border-dashed bg-card/40 text-center text-[10px] text-muted-foreground">
            <span>داستان‌های بیشتر به‌زودی...</span>
          </div>
        </div>
      )}
    </motion.section>
  );
}

