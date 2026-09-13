"use client";

import { usePlanner } from "@/store/planner-store";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

const DURATION_CHIPS = [
  { label: "۱ روز", value: 1 },
  { label: "۲-۳ روز", value: 3 },
  { label: "۴-۷ روز", value: 5 },
  { label: "بیشتر", value: 8 },
];

/** مرحله ۲ — مدت سفر — اجباری طبق سند */
export function PlannerStepDuration() {
  const durationDays = usePlanner((s) => s.durationDays);
  const setDurationDays = usePlanner((s) => s.setDurationDays);

  return (
    <div>
      <h3 className="text-lg font-extrabold">چند روز می‌خواهی بروی؟</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        مدت سفر روی انتخاب مکان و برنامه اثر مستقیم دارد.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {DURATION_CHIPS.map((chip) => {
          const active = durationDays === chip.value;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => setDurationDays(chip.value)}
              aria-pressed={active}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border p-3 transition-all",
                active
                  ? "border-emerald bg-emerald/10 shadow-sm"
                  : "border-border bg-card hover:border-emerald/40"
              )}
            >
              <span className={cn("text-base font-black", active && "text-emerald")}>
                {chip.label}
              </span>
              {chip.value > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  حدود {toFa(chip.value)} روز
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
