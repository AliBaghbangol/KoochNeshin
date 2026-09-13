"use client";

import { Tent, Mountain, Sun, Palmtree, Landmark, TreePine, Snowflake, CloudSun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { usePlanner } from "@/store/planner-store";
import { CATEGORY_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TourCategory } from "@/types";

const CATEGORY_ICONS: Record<TourCategory, typeof Mountain> = {
  mountain: Mountain,
  desert: Sun,
  coastal: Palmtree,
  historical: Landmark,
  forest: TreePine,
};

const WEATHER_CHIPS: { key: "cool" | "warm" | "any"; label: string; icon: typeof Snowflake }[] = [
  { key: "cool", label: "خنک", icon: Snowflake },
  { key: "warm", label: "گرم", icon: Sun },
  { key: "any", label: "فرقی ندارد", icon: CloudSun },
];

/** مرحله ۳ — سبک سفر (چندانتخابی + کمپ + هوا) — قابل رد شدن */
export function PlannerStepStyle() {
  const categories = usePlanner((s) => s.categories);
  const toggleCategory = usePlanner((s) => s.toggleCategory);
  const camping = usePlanner((s) => s.camping);
  const setCamping = usePlanner((s) => s.setCamping);
  const weatherPreference = usePlanner((s) => s.weatherPreference);
  const setWeatherPreference = usePlanner((s) => s.setWeatherPreference);

  return (
    <div>
      <h3 className="text-lg font-extrabold">چه سبکی می‌پسندی؟</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        چند دسته را می‌توانی انتخاب کنی — یا رد کن تا همه سبک‌ها در نظر گرفته شود.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {(Object.keys(CATEGORY_LABELS) as TourCategory[]).map((cat) => {
          const active = categories.includes(cat);
          const Icon = CATEGORY_ICONS[cat];
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              aria-pressed={active}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all",
                active
                  ? "border-emerald bg-emerald/10 shadow-sm"
                  : "border-border bg-card hover:border-emerald/40"
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl transition-colors",
                  active ? "bg-emerald text-white" : "bg-emerald/10 text-emerald"
                )}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className={cn("text-xs font-bold", active && "text-emerald")}>
                {CATEGORY_LABELS[cat]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl border bg-background p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-gold">
            <Tent className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold">چادر و کمپ</p>
            <p className="text-[11px] text-muted-foreground">
              فقط تورهای با اقامت کمپینگ بهم پیشنهاد شود
            </p>
          </div>
        </div>
        <Switch
          checked={camping}
          onCheckedChange={setCamping}
          aria-label="اقامت کمپینگ"
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold">آب‌وهوای ترجیحی</p>
        <div className="flex flex-wrap gap-2">
          {WEATHER_CHIPS.map((w) => {
            const active = weatherPreference === w.key;
            const Icon = w.icon;
            return (
              <button
                key={w.key}
                type="button"
                onClick={() => setWeatherPreference(w.key)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-bold transition-colors",
                  active
                    ? "border-emerald bg-emerald/10 text-emerald"
                    : "border-border bg-card text-muted-foreground hover:border-emerald/40"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {w.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
