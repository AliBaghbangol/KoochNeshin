"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useXP, xpSummary } from "@/store/xp-store";
import { toFa } from "@/lib/format";

/**
 * نوار XP در داشبورد (بخش ۸ سند v19) — سطح فعلی + پیشرفت تا سطح بعد.
 * کاملاً محلی/localStorage — TODO(backend): sync با سرور.
 */
export function XpBar({ className }: { className?: string }) {
  const events = useXP((s) => s.events);
  const { total, level, into, needed, progress } = xpSummary(events);

  return (
    <div
      className={`rounded-2xl border border-gold/25 bg-gradient-to-l from-gold/10 via-card to-card p-4 ${className ?? ""}`}
      aria-label={`سطح ${toFa(level)} — ${toFa(total)} امتیاز`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold">
            <Sparkles className="h-5 w-5" aria-hidden />
            <span className="absolute -bottom-1.5 -left-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-black text-forest">
              {toFa(level)}
            </span>
          </span>
          <div>
            <p className="text-sm font-extrabold">
              سطح {toFa(level)} کاروانی
            </p>
            <p className="text-[11px] text-muted-foreground">
              {toFa(total)} امتیاز تجربه · {toFa(needed - into)} تا سطح بعد
            </p>
          </div>
        </div>
        <span className="rounded-full bg-gold/10 px-2.5 py-1 text-[10px] font-bold text-gold">
          {toFa(into)}/{toFa(needed)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-to-l from-gold to-gold-light"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
