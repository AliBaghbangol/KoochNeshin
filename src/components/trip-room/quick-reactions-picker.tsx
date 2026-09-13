"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Quick reactions emoji picker — Trip Room enhancement (spec §2).
 *
 * A small popover triggered from the composer area (or via a dedicated
 * emoji button) that lets users send a "quick reaction" — a single-emoji
 * "fast message" — without typing anything.
 *
 * The picker is grouped by category so the user can find the right emoji
 * fast. Selecting an emoji calls `onPick(emoji)` which the parent uses to
 * send a quick reaction message.
 */

interface EmojiGroup {
  label: string;
  emojis: string[];
}

const EMOJI_GROUPS: EmojiGroup[] = [
  {
    label: "احساس",
    emojis: ["👍", "❤️", "😂", "🔥", "🎉", "🙏", "😮", "😢", "👏", "💯"],
  },
  {
    label: "سفر",
    emojis: ["🏔️", "⛺", "🥾", "🧭", "🌅", "🌄", "🚐", "🎒", "🥪", "☕"],
  },
  {
    label: "هواشناسی",
    emojis: ["☀️", "🌤️", "🌧️", "❄️", "🌪️", "🌫️", "🌈", "⚡", "💧", "🌬️"],
  },
];

export function QuickReactionsPicker({
  onPick,
  align = "start",
}: {
  onPick: (emoji: string) => void;
  align?: "start" | "end";
}) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handlePick(emoji: string) {
    onPick(emoji);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-2xl border border-border/60 bg-card text-muted-foreground shadow-sm transition hover:bg-muted",
          open && "bg-emerald/10 text-emerald",
        )}
        aria-label="انتخاب ایموجی"
        aria-expanded={open}
      >
        <SmilePlus className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "absolute bottom-full mb-2 z-30 w-72 overflow-hidden rounded-2xl border bg-popover shadow-xl ring-1 ring-black/[0.03]",
              align === "end" ? "left-0" : "right-0",
            )}
            role="dialog"
            aria-label="انتخاب سریع ایموجی"
          >
            {/* tabs */}
            <div className="flex border-b border-border/60 bg-muted/40">
              {EMOJI_GROUPS.map((g, i) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={cn(
                    "flex-1 px-2 py-1.5 text-[11px] font-bold transition",
                    activeTab === i
                      ? "bg-popover text-emerald"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* emoji grid */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-5 gap-1 p-2"
            >
              {EMOJI_GROUPS[activeTab].emojis.map((emoji, i) => (
                <motion.button
                  key={emoji}
                  type="button"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, delay: i * 0.02 }}
                  whileHover={{ scale: 1.25, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePick(emoji)}
                  className="grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:bg-emerald/10"
                  aria-label={`ارسال ${emoji}`}
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>

            <div className="border-t border-border/60 bg-muted/30 px-3 py-1.5 text-center text-[10px] text-muted-foreground">
              برای ارسال سریع، یک ایموجی را انتخاب کن
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
