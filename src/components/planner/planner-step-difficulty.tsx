"use client";

import { Footprints, Activity, MountainSnow } from "lucide-react";
import { usePlanner } from "@/store/planner-store";
import { DIFFICULTY_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types";

const DIFF_ICON: Record<Difficulty, typeof Footprints> = {
  easy: Footprints,
  medium: Activity,
  hard: MountainSnow,
};

const DIFF_DESC: Record<Difficulty, string> = {
  easy: "بدون نیاز به تجربه فنی",
  medium: "کمی آمادگی جسمانی لازم است",
  hard: "برای باتجربه‌ها و آمادگی بالا",
};

/** مرحله ۴ — سختی (یک انتخاب، قابل رد شدن) */
export function PlannerStepDifficulty() {
  const difficulty = usePlanner((s) => s.difficulty);
  const setDifficulty = usePlanner((s) => s.setDifficulty);

  return (
    <div>
      <h3 className="text-lg font-extrabold">سطح سختی دلخواهت؟</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        مطابق آمادگی جسمانی‌ات انتخاب کن — یا رد شو تا همه سطح‌ها بیاید.
      </p>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => {
          const active = difficulty === d;
          const Icon = DIFF_ICON[d];
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(active ? undefined : d)}
              aria-pressed={active}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 transition-all",
                active
                  ? "border-emerald bg-emerald/10 shadow-sm"
                  : "border-border bg-card hover:border-emerald/40"
              )}
            >
              <span
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-2xl transition-colors",
                  active ? "bg-emerald text-white" : "bg-emerald/10 text-emerald"
                )}
                aria-hidden
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className={cn("text-sm font-black", active && "text-emerald")}>
                {DIFFICULTY_LABELS[d]}
              </span>
              <span className="text-center text-[10px] leading-4 text-muted-foreground">
                {DIFF_DESC[d]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
