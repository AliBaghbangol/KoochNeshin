"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useXP } from "@/store/xp-store";
import { ACHIEVEMENT_RULES } from "@/lib/xp/achievement-rules";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * گرید نشان‌ها (بخش ۸ سند v19) — قفل: خاکستری/محو؛ باز: رنگی با انیمیشن.
 * در داشبورد کاربر (تب overview) رندر می‌شود.
 */
export function AchievementGrid() {
  const unlocked = useXP((s) => s.unlocked);

  return (
    <Card className="rounded-3xl border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-extrabold">نشان‌های تو</h3>
        <span className="text-[11px] text-muted-foreground">
          {toFa(unlocked.length)} از {toFa(ACHIEVEMENT_RULES.length)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {ACHIEVEMENT_RULES.map((rule, i) => {
          const isUnlocked = unlocked.includes(rule.id);
          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition-colors",
                isUnlocked
                  ? "border-gold/40 bg-gold/5"
                  : "border-border bg-muted/40 opacity-60"
              )}
              title={rule.description}
            >
              <span
                className={cn(
                  "text-3xl transition-transform",
                  isUnlocked ? "" : "grayscale",
                  isUnlocked && rule.id === "explorer-3" && "animate-pulse"
                )}
                aria-hidden
              >
                {isUnlocked ? rule.icon : "🔒"}
              </span>
              <p
                className={cn(
                  "text-xs font-black",
                  isUnlocked ? "text-gold" : "text-muted-foreground"
                )}
              >
                {rule.label}
              </p>
              <p className="text-[10px] leading-4 text-muted-foreground">
                {isUnlocked ? rule.description : (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" aria-hidden />
                    قفل
                  </span>
                )}
              </p>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
