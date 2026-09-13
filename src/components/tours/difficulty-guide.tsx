"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Mountain,
  CheckCircle2,
  Circle,
  Backpack,
  Thermometer,
  Footprints,
  HardHat,
  Bell,
  ChevronDown,
  Info,
} from "lucide-react";
import type { Tour } from "@/types";
import { DIFFICULTY_LABELS, toFa } from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { cn } from "@/lib/utils";

interface PackingItem {
  name: string;
  essential: boolean;
  icon: typeof Mountain;
}

const PACKING_LISTS: Record<Tour["difficulty"], PackingItem[]> = {
  easy: [
    { name: "کفش راحت پیاده‌روی", essential: true, icon: Footprints },
    { name: "کلاه و ضدآفتاب", essential: true, icon: Mountain },
    { name: "بطری آب (۱.۵ لیتر)", essential: true, icon: Bell },
    { name: "عینک آفتابی", essential: false, icon: Mountain },
    { name: "بارانی سبک", essential: false, icon: Thermometer },
    { name: "کرم ضدآفتاب", essential: true, icon: Mountain },
    { name: "تنقلات", essential: false, icon: Bell },
    { name: "کوله روزانه ۲۰ لیتر", essential: false, icon: Backpack },
  ],
  medium: [
    { name: "کفش کوهنوردی ضدآب", essential: true, icon: Footprints },
    { name: "کوله ۳۰-۴۰ لیتر", essential: true, icon: Backpack },
    { name: "لباس لایه‌ای (۳ لایه)", essential: true, icon: Thermometer },
    { name: "کیسه خواب سبک", essential: true, icon: Thermometer },
    { name: "کلاه و ضدآفتاب", essential: true, icon: Mountain },
    { name: "بطری آب (۲ لیتر)", essential: true, icon: Bell },
    { name: "چراغ پیشانی", essential: false, icon: Bell },
    { name: "کرم ضدآفتاب", essential: true, icon: Mountain },
    { name: "کمپوست اولیه", essential: true, icon: HardHat },
    { name: "نیم‌بوت گرم", essential: false, icon: Footprints },
  ],
  hard: [
    { name: "کفش کوهنوردی حرفه‌ای + کرامپن", essential: true, icon: Footprints },
    { name: "کوله ۵۰-۶۵ لیتر", essential: true, icon: Backpack },
    { name: "لباس لایه‌ای فنی (۴ لایه)", essential: true, icon: Thermometer },
    { name: "کیسه خواب تحمل ۲۰- درجه", essential: true, icon: Thermometer },
    { name: "تجهیزات صعود (بند، کارabiner)", essential: true, icon: HardHat },
    { name: "چادر کوهنوردی مقاوم", essential: true, icon: Mountain },
    { name: "چراغ پیشانی + باتری یدکی", essential: true, icon: Bell },
    { name: "اختراع فلاسک آب گرم", essential: true, icon: Bell },
    { name: "قیمت‌سنج (GPS)", essential: true, icon: Bell },
    { name: "کلاه کاسک", essential: true, icon: HardHat },
    { name: "عینک برفی", essential: true, icon: Mountain },
    { name: "کرم ضدآفتاب SPF 50+", essential: true, icon: Mountain },
  ],
};

const DIFFICULTY_INFO: Record<
  Tour["difficulty"],
  {
    title: string;
    description: string;
    color: string;
    bgColor: string;
    fitnessLevel: string;
    experience: string;
    duration: string;
  }
> = {
  easy: {
    title: "آسان",
    description:
      "مناسب برای مبتدی‌ها و خانواده‌ها. نیاز به آمادگی جسمانی متوسط دارد.",
    color: "text-emerald",
    bgColor: "bg-emerald/10",
    fitnessLevel: "متوسط",
    experience: "بدون نیاز به تجربه قبلی",
    duration: "۱-۳ روز",
  },
  medium: {
    title: "متوسط",
    description:
      "نیاز به آمادگی جسمانی خوب و تجربه قبلی در فعالیت‌های مشابه.",
    color: "text-sunset",
    bgColor: "bg-sunset/10",
    fitnessLevel: "خوب",
    experience: "حداقل ۲ تور آسان",
    duration: "۲-۵ روز",
  },
  hard: {
    title: "سخت",
    description:
      "برای افراد با تجربه و آمادگی جسمانی بالا. تجهیزات تخصصی ضروری است.",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    fitnessLevel: "بالا",
    experience: "حداقل ۳ تور متوسط",
    duration: "۳-۷ روز",
  },
};

export function DifficultyGuide({ tour }: { tour: Tour }) {
  const [checkedItems, setCheckedItems] = React.useState<Set<string>>(new Set());
  const [showAll, setShowAll] = React.useState(false);

  const info = DIFFICULTY_INFO[tour.difficulty];
  const packingList = PACKING_LISTS[tour.difficulty];
  const essentialCount = packingList.filter((p) => p.essential).length;
  const checkedCount = checkedItems.size;
  const progress = Math.round((checkedCount / packingList.length) * 100);

  const toggle = (name: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <section className="mt-12">
      <ScrollReveal>
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sunset/10 text-sunset">
            <Mountain className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-extrabold md:text-2xl">
              راهنمای سختی و تجهیزات
            </h3>
            <p className="text-xs text-muted-foreground">
              سطح سختی تور و لیست کامل تجهیزات مورد نیاز
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Difficulty info card */}
      <ScrollReveal delay={0.1}>
        <div className={cn("mb-6 rounded-2xl border-2 p-5", info.bgColor, "border-current/20")}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className={cn("text-2xl font-extrabold", info.color)}>
                  سطح {info.title}
                </span>
                <span className="rounded-full bg-background/60 px-2 py-0.5 text-xs font-bold text-foreground">
                  {DIFFICULTY_LABELS[tour.difficulty]}
                </span>
              </div>
              <p className="text-sm leading-7 text-foreground/80">
                {info.description}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "آمادگی جسمانی", value: info.fitnessLevel },
              { label: "تجربه لازم", value: info.experience },
              { label: "مدت معمول", value: info.duration },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-background/60 p-3 text-center"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-xs font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Packing list */}
      <ScrollReveal delay={0.2}>
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Backpack className="h-5 w-5 text-primary" />
              <h4 className="font-bold">لیست تجهیزات</h4>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {packingList.length} مورد
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {toFa(checkedCount)} از {toFa(packingList.length)} مورد
                </p>
                <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      "h-full rounded-full",
                      progress === 100 ? "bg-emerald" : "bg-primary"
                    )}
                  />
                </div>
              </div>
              {progress === 100 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 rounded-full bg-emerald/15 px-2 py-1 text-[10px] font-bold text-emerald"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  آماده!
                </motion.span>
              )}
            </div>
          </div>

          {/* Essential badge */}
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-gold/5 p-2 text-xs text-gold">
            <Info className="h-3.5 w-3.5" />
            {toFa(essentialCount)} مورد ضروری (با علامت ستاره)
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(showAll ? packingList : packingList.slice(0, 6)).map((item) => {
              const checked = checkedItems.has(item.name);
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.name}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggle(item.name)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-right transition",
                    checked
                      ? "border-emerald/40 bg-emerald/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  {checked ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                  )}
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      checked && "text-muted-foreground line-through"
                    )}
                  >
                    {item.name}
                  </span>
                  {item.essential && (
                    <span className="shrink-0 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold">
                      ضروری
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {packingList.length > 6 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5"
            >
              {showAll ? "نمایش کمتر" : `نمایش ${toFa(packingList.length - 6)} مورد دیگر`}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition",
                  showAll && "rotate-180"
                )}
              />
            </button>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}
