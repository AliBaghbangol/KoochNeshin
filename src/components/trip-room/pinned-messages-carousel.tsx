"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, ChevronLeft, ChevronRight, MessageSquareQuote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TripRoom, TripRoomMessage } from "@/types/trip-room";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/** تبدیل ISO به ساعت فارسی HH:MM */
function timeOnly(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return toFa(`${hh}:${mm}`);
  } catch {
    return "";
  }
}

/**
 * Pinned Messages Carousel — Trip Room enhancement (spec §2).
 *
 * Surfaces important messages that the leader has pinned so members can
 * quickly catch up without scrolling the whole chat. Renders as a compact
 * horizontal carousel above the chat panel.
 *
 * v21.8: real `pinned` flag on `TripRoomMessage` (leader/admin can pin from
 * the chat action row). For older persisted rooms that have no real pins yet
 * we fall back to the legacy client-side heuristic (leader keywords + ❤️
 * reactions) so the carousel keeps working — TODO(backend): real `pinned`
 * flag on `TripRoomMessage` (schema field already mirrored in TS).
 */

const PIN_KEYWORDS = ["توجه", "مهم", "یادت", "حتماً", "ساعت", "محل حرکت"];

export function PinnedMessagesCarousel({
  room,
  onJumpTo,
}: {
  room: TripRoom;
  onJumpTo?: (messageId: string) => void;
}) {
  // Real pins first; if none exist yet, fall back to the legacy heuristic.
  const pinned = React.useMemo(() => {
    const live = room.messages.filter((m) => !m.isSystem && !m.deleted && m.pinned);
    const legacy = room.messages
      .filter((m) => !m.isSystem && !m.deleted)
      .filter((m) => {
        if (m.authorId === "leader_1") {
          return PIN_KEYWORDS.some((k) => m.text.includes(k));
        }
        return m.reactions && Object.keys(m.reactions).includes("❤️");
      });
    return (live.length > 0 ? live : legacy).slice(0, 6);
  }, [room.messages]);

  const [idx, setIdx] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Reset to 0 if pinned changes and idx is out of bounds
  React.useEffect(() => {
    if (idx > pinned.length - 1) setIdx(0);
  }, [pinned.length, idx]);

  // Keyboard navigation: ←/→ when the carousel container is focused.
  // RTL-aware: ArrowRight goes to previous (visually right = back), ArrowLeft to next.
  React.useEffect(() => {
    if (pinned.length <= 1) return;
    const el = containerRef.current;
    if (!el) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIdx((i) => Math.min(pinned.length - 1, i + 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const current = pinned[idx];
        if (current) onJumpTo?.(current.id);
      }
    }
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [pinned, idx, onJumpTo]);

  if (pinned.length === 0) return null;

  const current = pinned[idx];
  const canPrev = idx > 0;
  const canNext = idx < pinned.length - 1;

  function go(dir: -1 | 1) {
    setIdx((i) => Math.max(0, Math.min(pinned.length - 1, i + dir)));
  }

  return (
    <motion.div
      ref={containerRef}
      tabIndex={pinned.length > 1 ? 0 : -1}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border-2 border-gold/30 bg-gradient-to-l from-gold/10 via-gold/5 to-transparent p-3 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-gold/40 dark:border-gold/40 dark:from-gold/15 dark:via-gold/8"
      aria-label="پیام‌های سنجاق‌شده — با کلیدهای جهت‌نما حرکت کن"
    >
      {/* decorative pin icon in corner */}
      <span className="pointer-events-none absolute -left-2 -top-2 grid h-7 w-7 rotate-12 place-items-center rounded-full bg-gold text-white shadow-md">
        <Pin className="h-3.5 w-3.5" />
      </span>

      <div className="mb-2 flex items-center justify-between pr-7">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-gold">
          <MessageSquareQuote className="h-3.5 w-3.5" />
          پیام‌های سنجاق‌شده
        </h3>
        <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold">
          {toFa(idx + 1)} / {toFa(pinned.length)}
        </span>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.button
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={() => onJumpTo?.(current.id)}
            className="flex w-full items-start gap-2.5 rounded-xl bg-card p-2.5 text-right shadow-sm transition hover:shadow-md dark:bg-card/80"
          >
            <Avatar className="h-7 w-7 shrink-0 ring-1 ring-background">
              <AvatarImage src={current.authorAvatar} alt={current.authorName} />
              <AvatarFallback className="text-[10px]">
                {current.authorName.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-1.5">
                <span className="text-[11px] font-bold">{current.authorName}</span>
                <span className="text-[9px] text-muted-foreground">
                  {timeOnly(current.createdAt)}
                </span>
              </div>
              <p className="line-clamp-2 text-[12px] leading-5 text-foreground/90">
                {current.text}
              </p>
            </div>
          </motion.button>
        </AnimatePresence>
      </div>

      {/* nav controls */}
      {pinned.length > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => go(-1)}
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full transition",
              canPrev
                ? "bg-gold/15 text-gold hover:bg-gold/25"
                : "bg-muted text-muted-foreground/40",
            )}
            aria-label="پیام قبلی"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* dots */}
          <div className="flex items-center gap-1">
            {pinned.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === idx ? "w-4 bg-gold" : "w-1.5 bg-gold/40 hover:bg-gold/60",
                )}
                aria-label={`رفتن به پیام ${toFa(i + 1)}`}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={!canNext}
            onClick={() => go(1)}
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full transition",
              canNext
                ? "bg-gold/15 text-gold hover:bg-gold/25"
                : "bg-muted text-muted-foreground/40",
            )}
            aria-label="پیام بعدی"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
