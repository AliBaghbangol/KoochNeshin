"use client";

import { UserRound, Heart, Users, PartyPopper, MessageSquareText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { usePlanner } from "@/store/planner-store";
import { cn } from "@/lib/utils";

type SocialIcon = typeof UserRound;
const SOCIAL_CHIPS: { key: "solo" | "couple" | "friends" | "group"; label: string; icon: SocialIcon }[] = [
  { key: "solo", label: "تنها", icon: UserRound },
  { key: "couple", label: "دو نفره", icon: Heart },
  { key: "friends", label: "با دوستان", icon: Users },
  { key: "group", label: "گروه کاروان", icon: PartyPopper },
];

/** مرحله ۶ — گروه/تنهایی + توضیح آزاد (قابل رد شدن) */
export function PlannerStepSocial() {
  const socialMode = usePlanner((s) => s.socialMode);
  const setSocialMode = usePlanner((s) => s.setSocialMode);
  const text = usePlanner((s) => s.text);
  const setText = usePlanner((s) => s.setText);

  return (
    <div>
      <h3 className="text-lg font-extrabold">با چه کسی می‌روی؟</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        حال‌وهوای گروه سفر را مشخص کن.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {SOCIAL_CHIPS.map((c) => {
          const active = socialMode === c.key;
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setSocialMode(c.key)}
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
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <label
          htmlFor="planner-free-text"
          className="mb-2 flex items-center gap-1.5 text-xs font-bold"
        >
          <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
          توضیح آزاد (اختیاری)
        </label>
        <Textarea
          id="planner-free-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="مثلاً: دنبال یه تور بهاره با ستاره‌بازی شبانه هستم…"
          className="min-h-20 rounded-2xl"
        />
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          در فاز بعدی با هوش مصنوعی پردازش می‌شود؛ فعلاً در کنار فرم ذخیره می‌شود.
          اگر متن با انتخاب‌های فرم در تضاد باشد، انتخاب فرم اولویت دارد.
        </p>
      </div>
    </div>
  );
}
