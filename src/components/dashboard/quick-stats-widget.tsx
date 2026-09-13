"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Bookmark,
  Phone,
  Users,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useBookings } from "@/store/bookings-store";
import { MOCK_BOOKINGS } from "@/lib/bookings/mock-bookings";
import { useStories } from "@/store/stories-store";
import { useStoryBookmarks } from "@/store/story-bookmarks-store";
import { useEmergencyContacts } from "@/store/emergency-contacts-store";
import { useTravelBuddy } from "@/store/travel-buddy-store";
import { toFa } from "@/lib/format";
import { useGo } from "@/lib/use-go";
import { cn } from "@/lib/utils";

/**
 * Quick Stats widget — Dashboard enhancement.
 *
 * Shows a compact 2x3 grid of quick stat cards:
 *   1. Confirmed trips count
 *   2. Completed trips count
 *   3. Stories published
 *   4. Bookmarked stories
 *   5. Emergency contacts
 *   6. Buddy matches
 *
 * Each card is clickable and navigates to the relevant feature page.
 * Uses animated number reveal on mount.
 */

interface Stat {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  tone: string;
  view?: string;
}

export function QuickStatsWidget() {
  const userBookings = useBookings((s) => s.bookings);
  const go = useGo();

  const allBookings = [...userBookings, ...MOCK_BOOKINGS];
  const confirmed = allBookings.filter((b) => b.status === "confirmed").length;
  const completed = allBookings.filter((b) => b.completedAt).length;

  const stories = useStories((s) => s.stories);
  const userStories = stories.filter((s) => s.authorId === "me");
  const bookmarkedIds = useStoryBookmarks((s) => s.bookmarkedIds);

  const emergencyContacts = useEmergencyContacts((s) => s.contacts);
  const buddyCandidates = useTravelBuddy((s) => s.candidates);
  const buddyMatches = buddyCandidates.filter(
    (c) => c.requestStatus === "matched",
  ).length;

  const stats: Stat[] = [
    {
      icon: CalendarCheck,
      label: "تورهای تأییدشده",
      value: confirmed,
      tone: "text-emerald bg-emerald/10",
      view: "user-dashboard",
    },
    {
      icon: TrendingUp,
      label: "سفرهای تکمیل‌شده",
      value: completed,
      tone: "text-gold bg-gold/10",
      view: "user-dashboard",
    },
    {
      icon: Bookmark,
      label: "داستان‌های منتشرشده",
      value: userStories.length,
      tone: "text-emerald-light bg-emerald-light/10",
      view: "stories",
    },
    {
      icon: Bookmark,
      label: "داستان‌های ذخیره‌شده",
      value: bookmarkedIds.length,
      tone: "text-gold bg-gold/10",
      view: "stories",
    },
    {
      icon: Phone,
      label: "مخاطبان اضطراری",
      value: emergencyContacts.length,
      suffix: " / ۵",
      tone: "text-red-500 bg-red-500/10",
      view: "safety-center",
    },
    {
      icon: Users,
      label: "تطابق‌های هم‌سفر",
      value: buddyMatches,
      tone: "text-accent bg-accent/10",
      view: "buddies",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]"
    >
      <div className="mb-3 flex items-center gap-2 border-b border-border/40 pb-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald/10 text-emerald">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-sm font-bold">خلاصه‌ی فعالیت‌ها</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.label}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => s.view && go(s.view as never)}
              className="flex flex-col items-center gap-1 rounded-2xl bg-background/40 p-3 text-center transition hover:bg-muted/40 hover:shadow-sm"
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl",
                  s.tone,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <motion.div
                key={s.value}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-lg font-black"
              >
                {toFa(s.value)}
                {s.suffix && (
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {s.suffix}
                  </span>
                )}
              </motion.div>
              <div className="text-[9px] font-semibold text-muted-foreground leading-tight">
                {s.label}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
