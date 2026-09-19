"use client";

import { Dna } from "lucide-react";
import { Card } from "@/components/ui/card";
import { XpBar } from "./xp-bar";
import { AchievementGrid } from "./achievement-grid";
import { XP_AMOUNTS } from "@/types/xp";
import { toFa } from "@/lib/format";

/**
 * کارت کامل «سطح کاروانی و اچیومنت‌ها» (ورژن ۲۴ — بخش ۳ سند بررسی).
 * در تب «فیچرهای من» داشبورد رندر می‌شود؛ نسخه‌ی خلاصه‌ی همان، همان XpBar
 * است که در تب نمای کلی (کنار هدر خوش‌آمدگویی) دیده می‌شود.
 */
export function LevelProgressCard() {
  const earnList = [
    { label: "رزرو یک تور جدید", xp: XP_AMOUNTS["booking:created"] },
    { label: "ثبت نظر برای یک تور", xp: XP_AMOUNTS["review:created"] },
    { label: "ساخت DNA سفر", xp: XP_AMOUNTS["dna:completed"] },
    { label: "کار اولیه با برنامه‌ریز هوشمند", xp: XP_AMOUNTS["planner:first-use"] },
  ];

  return (
    <Card className="space-y-5 rounded-3xl border-border/60 bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-gold">
          <Dna className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-extrabold">سطح کاروانی و نشان‌ها</h3>
          <p className="text-[11px] text-muted-foreground">
            با فعالیت واقعی در کوچ‌نشین سطح بگیر و مزیت‌ها را باز کن
          </p>
        </div>
      </div>

      <XpBar className="border-gold/20" />

      {/* چطور امتیاز جمع می‌کنم؟ — مقادیر واقعی از XP_AMOUNTS */}
      <div>
        <p className="mb-2 text-xs font-bold text-foreground/85">
          امتیاز تجربه از کجا می‌آید؟
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {earnList.map((e) => (
            <div
              key={e.label}
              className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2"
            >
              <span className="text-xs text-foreground/85">{e.label}</span>
              <span className="shrink-0 rounded-full bg-emerald/10 px-2 py-0.5 text-[11px] font-black text-emerald tabular-nums">
                +{toFa(e.xp)} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      <AchievementGrid />
    </Card>
  );
}
