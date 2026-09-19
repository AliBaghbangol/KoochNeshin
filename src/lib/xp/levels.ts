import type { LucideIcon } from "lucide-react";
import {
  Sprout,
  Mountain,
  Compass,
  MountainSnow,
  Crown,
} from "lucide-react";
import { XP_PER_LEVEL } from "@/types/xp";

/**
 * سطوح کاروانی (ورژن ۲۴ — بخش ۳ سند بررسی).
 *
 * منطق واقعی XP پروژه در `src/store/xp-store.ts` ساده و خطی است:
 * هر `XP_PER_LEVEL` (۲۵۰) امتیاز = یک سطح (`xpSummary`). بنابراین آستانه‌ی
 * تجمعی هر نشانِ سطح برابر `(level − 1) × ۲۵۰` است — نه اعداد نمونه‌ی سند
 * (۲۰۰/۵۰۰/۱۰۰۰/۲۵۰۰)؛ طبق توصیه‌ی خود سند، اعداد با منطق واقعی هماهنگ شدند.
 */

export interface CaravanTier {
  /** شماره سطح (۱ تا ۵ — سطح ۵ و بالاتر = افسانه‌ای) */
  level: number;
  name: string;
  icon: LucideIcon;
  /** XP تجمعی لازم برای رسیدن به این سطح */
  xpNeeded: number;
  benefit: string;
}

export const CARAVAN_TIERS: CaravanTier[] = [
  {
    level: 1,
    name: "کاروانی نوآموز",
    icon: Sprout,
    xpNeeded: 0,
    benefit: "دسترسی پایه به همه‌ی فیچرهای کوچ‌نشین",
  },
  {
    level: 2,
    name: "کاروانی کوهنورد",
    icon: Mountain,
    xpNeeded: 1 * XP_PER_LEVEL,
    benefit: "تخفیف ۵٪ روی خرید تجهیزات",
  },
  {
    level: 3,
    name: "کاروانی مسیرشناس",
    icon: Compass,
    xpNeeded: 2 * XP_PER_LEVEL,
    benefit: "اولویت رزرو تورهای محدود",
  },
  {
    level: 4,
    name: "کاروانی پیشکسوت",
    icon: MountainSnow,
    xpNeeded: 3 * XP_PER_LEVEL,
    benefit: "نشان ویژه در پروفایل عمومی",
  },
  {
    level: 5,
    name: "کاروانی افسانه‌ای",
    icon: Crown,
    xpNeeded: 4 * XP_PER_LEVEL,
    benefit: "دعوت به تورهای اختصاصی کاروان",
  },
];

/** نشانِ متناظر با یک شماره سطح — سطوح بالاتر از ۵ همان «افسانه‌ای» می‌مانند. */
export function tierForLevel(level: number): CaravanTier {
  const idx = Math.min(Math.max(Math.floor(level), 1), CARAVAN_TIERS.length);
  return CARAVAN_TIERS[idx - 1];
}

/** سطح بعدی (اگر به آخرین نشان رسیده باشد null) */
export function nextTier(level: number): CaravanTier | null {
  return level < CARAVAN_TIERS.length ? CARAVAN_TIERS[level] : null;
}
