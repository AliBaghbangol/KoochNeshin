"use client";

import * as React from "react";
import { Check, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CARAVAN_TIERS } from "@/lib/xp/levels";
import { formatNumber, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * «سطح‌ها و مزایا چیست؟» (ورژن ۲۴ — بخش ۳ سند بررسی):
 * جدول کامل نشان‌های کاروانی با XP تجمعی واقعی (هر ۲۵۰ XP یک سطح، مطابق
 * `xpSummary` در `src/store/xp-store.ts`) و مزیت هر نشان.
 */
export function LevelsDialog({
  currentLevel,
  trigger,
  triggerClassName,
}: {
  currentLevel: number;
  trigger?: React.ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5 text-[11px] font-bold text-gold transition hover:bg-gold/15",
              triggerClassName,
            )}
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
            سطح‌ها و مزایا چیست؟
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-start">نشان‌های کاروانی</DialogTitle>
          <DialogDescription className="text-start">
            با هر فعالیت در کوچ‌نشین امتیاز تجربه (XP) جمع می‌کنی؛ هر{" "}
            {formatNumber(250)} XP یک نشانِ سطح بالاتر. سطوح به تو مزایای واقعی
            می‌دهند:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {CARAVAN_TIERS.map((tier) => {
            const Icon = tier.icon;
            const reached = currentLevel >= tier.level;
            const isCurrent = currentLevel === tier.level;
            return (
              <div
                key={tier.level}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3 transition-colors",
                  isCurrent
                    ? "border-gold/50 bg-gold/10"
                    : reached
                      ? "border-emerald/25 bg-emerald/5"
                      : "border-border bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                    reached
                      ? "bg-gradient-to-br from-gold/25 to-gold/10 text-gold"
                      : "bg-muted text-muted-foreground/60",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-extrabold">{tier.name}</p>
                    <span className="rounded-full bg-secondary px-1.5 py-px text-[10px] font-bold text-secondary-foreground">
                      سطح {toFa(tier.level)}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-gold px-1.5 py-px text-[10px] font-black text-forest">
                        نشان فعلی تو
                      </span>
                    )}
                    {reached && !isCurrent && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald/15 px-1.5 py-px text-[10px] font-bold text-emerald">
                        <Check className="h-2.5 w-2.5" aria-hidden />
                        گرفتی
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    از {formatNumber(tier.xpNeeded)} امتیاز تجربه
                  </p>
                  <p className="mt-1 text-xs font-bold text-foreground/85">
                    {tier.benefit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="rounded-2xl bg-muted/50 p-3 text-[11px] leading-5 text-muted-foreground">
          امتیاز تجربه از فعالیت‌های واقعی می‌آید: رزرو تور، ثبت نظر، ساخت DNA
          سفر و کار با برنامه‌ریز هوشمند. جزئیات هر مورد در کارت «سطح کاروانی»
          آمده است.
        </p>
      </DialogContent>
    </Dialog>
  );
}
