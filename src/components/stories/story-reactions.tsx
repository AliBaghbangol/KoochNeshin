"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus } from "lucide-react";
import type { TravelStory } from "@/types/story";
import { useStories } from "@/store/stories-store";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Story Reactions — Stories enhancement (spec §6).
 *
 * Beyond a simple like, lets users react with emojis (🔥 ❤️ 😂 👏 🌟).
 * Shows existing reactions as count chips and an "add reaction" picker.
 *
 * The picker is a small popover with the 5 supported emojis; the user
 * can pick one to toggle it (picking the same emoji again removes it).
 */

const REACTION_EMOJIS = ["🔥", "❤️", "😂", "👏", "🌟"];

export function StoryReactions({ story }: { story: TravelStory }) {
  const toggleReaction = useStories((s) => s.toggleReaction);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const reactions = story.reactions ?? {};
  const entries = Object.entries(reactions).filter(([_, v]) => v.count > 0);
  const totalReactions = entries.reduce((sum, [_, v]) => sum + v.count, 0);

  // Close on outside click
  React.useEffect(() => {
    if (!pickerOpen) return;
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  function pick(emoji: string) {
    toggleReaction(story.id, emoji);
    setPickerOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap items-center gap-1.5"
    >
      {/* existing reactions as chips */}
      <AnimatePresence mode="popLayout">
        {entries.map(([emoji, info]) => (
          <motion.button
            key={emoji}
            layout
            initial={{ opacity: 0, scale: 0.5, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -4 }}
            transition={{ duration: 0.2 }}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => pick(emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition",
              info.reactedByMe
                ? "border-emerald/40 bg-emerald/15 text-emerald"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
            aria-pressed={info.reactedByMe}
          >
            <span aria-hidden>{emoji}</span>
            <span>{toFa(info.count)}</span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* add reaction button */}
      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className={cn(
          "grid h-6 w-6 place-items-center rounded-full border text-xs transition",
          pickerOpen
            ? "border-emerald/40 bg-emerald/10 text-emerald"
            : "border-border bg-background text-muted-foreground hover:bg-muted",
        )}
        aria-label="افزودن ری‌اکشن"
        aria-expanded={pickerOpen}
      >
        <SmilePlus className="h-3.5 w-3.5" />
      </button>

      {/* picker popover */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 z-20 mb-2 flex items-center gap-1 rounded-2xl border bg-popover p-1.5 shadow-lg ring-1 ring-black/[0.03]"
          >
            {REACTION_EMOJIS.map((emoji, i) => {
              const has = reactions[emoji]?.reactedByMe;
              return (
                <motion.button
                  key={emoji}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.3, y: -2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => pick(emoji)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl text-lg transition hover:bg-emerald/10",
                    has && "bg-emerald/10 ring-1 ring-emerald/40",
                  )}
                  aria-label={`ری‌اکشن ${emoji}`}
                >
                  {emoji}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {totalReactions === 0 && !pickerOpen && (
        <span className="text-[9px] text-muted-foreground">
          اولین نفری که واکنش نشان می‌ده
        </span>
      )}
    </div>
  );
}
