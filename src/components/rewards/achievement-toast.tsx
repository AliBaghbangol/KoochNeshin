"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { useXP } from "@/store/xp-store";
import { cn } from "@/lib/utils";

/**
 * شنونده دستاوردها (بخش ۸ سند v19) — pending های xp-store را می‌کشد و
 * یک کانفتی/توست سبک با framer-motion نشان می‌دهد. یک‌بار در AppShell نصب می‌شود.
 */
export function AchievementToast() {
  const pending = useXP((s) => s.pending);
  const consumePending = useXP((s) => s.consumePending);
  const [shown, setShown] = React.useState<(typeof pending)[number] | null>(null);

  React.useEffect(() => {
    if (shown || pending.length === 0) return;
    const next = pending[0];
    consumePending();
    setShown(next);
    const t = setTimeout(() => setShown(null), 4200);
    return () => clearTimeout(t);
  }, [pending, shown, consumePending]);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          role="status"
          className={cn(
            "fixed inset-x-4 bottom-24 z-[90] mx-auto flex max-w-sm items-center gap-3 overflow-hidden rounded-2xl border border-gold/40 bg-card p-4 shadow-2xl shadow-gold/20",
            "lg:inset-x-auto lg:bottom-8 lg:right-8 lg:mx-0"
          )}
        >
          {/* شاین تزئینی */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-l from-transparent via-gold/15 to-transparent"
            initial={{ x: "150%" }}
            animate={{ x: "-150%" }}
            transition={{ duration: 1.4, delay: 0.3 }}
          />
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-3xl">
            {shown.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[11px] font-bold text-gold">
              <Trophy className="h-3 w-3" aria-hidden />
              دستاورد جدید باز شد!
            </p>
            <p className="text-sm font-black">{shown.label}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {shown.description}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
