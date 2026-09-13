import type { Achievement, XpEvent, XpEventType } from "@/types/xp";

/**
 * قوانین دستاوردها — روی رویدادهای محلی موجود سوار می‌شوند (بخش ۸ سند v19).
 */

export const ACHIEVEMENT_RULES: Achievement[] = [
  {
    id: "first-booking",
    trigger: "booking:created",
    label: "اولین سفر",
    icon: "🎒",
    description: "اولین رزرو خود را ثبت کردی",
    xp: 0,
  },
  {
    id: "reviewer",
    trigger: "review:created",
    label: "نظردهنده",
    icon: "✍️",
    description: "اولین نظر خود را برای یک تور نوشتی",
    xp: 0,
  },
  {
    id: "explorer-3",
    trigger: "booking:created",
    threshold: 3,
    label: "کاوشگر",
    icon: "🧭",
    description: "سه سفر رزرو کردی — سفر برای تو یک زبان است",
    xp: 0,
  },
  {
    id: "dna-complete",
    trigger: "dna:completed",
    label: "شناخت خود",
    icon: "🧬",
    description: "DNA سفر خود را ساختی",
    xp: 0,
  },
  {
    id: "planner-first",
    trigger: "planner:first-use",
    label: "برنامه‌ریز کاروان",
    icon: "🗺️",
    description: "اولین برنامه سفر هوشمندت را ساختی",
    xp: 0,
  },
];

/**
 * ارزیابی دستاوردها بر اساس رویدادها — خالص و تست‌پذیر.
 * فقط دستاوردهایی که «تازه» باز شده‌اند (و در unlocked قبلی نبودند) برمی‌گردند.
 */
export function evaluateAchievements(
  events: XpEvent[],
  alreadyUnlocked: string[]
): Achievement[] {
  const counts = new Map<XpEventType, number>();
  for (const e of events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);

  return ACHIEVEMENT_RULES.filter((rule) => {
    if (alreadyUnlocked.includes(rule.id)) return false;
    const need = rule.threshold ?? 1;
    return (counts.get(rule.trigger) ?? 0) >= need;
  });
}
