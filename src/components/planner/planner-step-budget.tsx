"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Wallet, Backpack, Sparkles, Globe2, Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { usePlanner, BUDGET_FLOOR, BUDGET_CEIL } from "@/store/planner-store";
import { Slider } from "@/components/ui/slider";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

/** مرحله ۱ — بودجه (اسلایدر دو-دستگیره + میان‌بُرهای سریع) — اجباری طبق سند */

/** میان‌بُرهای بودجه — پرکردن فضای خالی مرحله با یک تصمیمِ یک‌کلیکی.
 *  هر پیش‌فرض دقیقاً یک بازه‌ی اسلایدر را ست می‌کند؛ چیپ فعال با تطابق
 *  دقیق [min,max] تشخیص داده می‌شود.
 *  طبقه‌بندی (درخواست کاربر): اقتصادی «زیر ۱۰ میلیون»، استاندارد «۱۰ تا
 *  ۳۰ میلیون»، لاکچری «۳۰ میلیون به بالا» — سقف اسلایدر ۱۰۰ میلیون است. */
const PRESETS = [
  {
    key: "economy",
    label: "اقتصادی",
    hint: "زیر ۱۰ میلیون تومان",
    icon: Wallet,
    min: BUDGET_FLOOR,
    max: 10_000_000,
  },
  {
    key: "standard",
    label: "استاندارد",
    hint: "از ۱۰ تا ۳۰ میلیون تومان",
    icon: Backpack,
    min: 10_000_000,
    max: 30_000_000,
  },
  {
    key: "luxury",
    label: "لاکچری",
    hint: "از ۳۰ میلیون تومان به بالا",
    icon: Sparkles,
    min: 30_000_000,
    max: BUDGET_CEIL,
  },
  {
    key: "any",
    label: "مهم نیست",
    hint: "کل بازه را بگرد",
    icon: Globe2,
    min: BUDGET_FLOOR,
    max: BUDGET_CEIL,
  },
] as const;

export function PlannerStepBudget() {
  const budgetMin = usePlanner((s) => s.budgetMin);
  const budgetMax = usePlanner((s) => s.budgetMax);
  const setBudget = usePlanner((s) => s.setBudget);

  const activePreset = React.useMemo(
    () => PRESETS.find((p) => p.min === budgetMin && p.max === budgetMax)?.key,
    [budgetMin, budgetMax],
  );

  return (
    <div>
      <h3 className="text-lg font-extrabold">بودجه‌ات چقدر است؟</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        بازه هزینه به ازای هر نفر — با اسلایدر تنظیم کن یا یکی از میان‌بُرها را
        انتخاب کن.
      </p>

      <div className="mt-6 rounded-2xl border bg-background p-5">
        <div className="mb-6 flex items-center justify-center gap-2 text-center">
          <span className="rounded-xl bg-emerald/10 px-3 py-1.5 text-sm font-black text-emerald tabular-nums">
            {formatCurrency(budgetMin)}
          </span>
          <span className="text-muted-foreground">تا</span>
          <span className="rounded-xl bg-gold/10 px-3 py-1.5 text-sm font-black text-gold tabular-nums">
            {formatCurrency(budgetMax)}
          </span>
        </div>
        <Slider
          min={BUDGET_FLOOR}
          max={BUDGET_CEIL}
          step={100_000}
          value={[budgetMin, budgetMax]}
          onValueChange={([a, b]) => setBudget(Math.min(a, b), Math.max(a, b))}
          minStepsBetweenThumbs={3}
          aria-label="بازه بودجه"
          className="mb-2"
        />
        <p className="text-center text-[11px] text-muted-foreground">
          از {formatCurrency(BUDGET_FLOOR)} تا {formatCurrency(BUDGET_CEIL)}
        </p>
      </div>

      {/* میان‌بُرهای سریع — یک تصمیمِ یک‌کلیکی برای پرکاربردترین بازه‌ها */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {PRESETS.map((p) => {
          const active = activePreset === p.key;
          const Icon = p.icon;
          return (
            <motion.button
              key={p.key}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setBudget(p.min, p.max);
                track("planner_budget_preset", { preset: p.key });
              }}
              aria-pressed={active}
              className={cn(
                "group relative flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-start transition-colors",
                active
                  ? "border-emerald bg-emerald/[0.07] ring-1 ring-emerald/40"
                  : "border-border bg-background hover:border-emerald/40 hover:bg-emerald/[0.04]",
              )}
            >
              <span className="flex w-full items-center justify-between">
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition-transform group-hover:scale-110",
                    active ? "bg-emerald text-white" : "bg-emerald/10 text-emerald",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {active && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-sm font-extrabold leading-none",
                  active ? "text-emerald" : "text-foreground",
                )}
              >
                {p.label}
              </span>
              <span className="text-[10px] leading-4 text-muted-foreground">
                {p.hint}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
