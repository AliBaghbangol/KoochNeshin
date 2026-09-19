import type { LucideIcon } from "lucide-react";
import { Compass, Flame, Leaf, Mountain, Sparkles, Users } from "lucide-react";

/**
 * نقشه‌ی مشترک آیکون lucide برای ویژگی‌های Travel DNA (بخش ۴ سند بررسی
 * «ورژن ۲۴»: ایموجی داخل رشته‌های رندرشونده ممنوع — در صورت نیاز به نشانه‌ی
 * بصری، آیکون lucide رندر می‌شود).
 *
 * کلیدها همان کلیدهای `TravelDNAScores` در `src/types/dna.ts` هستند.
 * فیلد `emoji` در داده‌ها (مثلاً `compute-dna.ts`) دست‌نخورده می‌ماند تا
 * ساختار داده/ذخیره‌سازی تغییر نکند — فقط دیگر رندر نمی‌شود؛ کامپوننت‌ها
 * به‌جای آن از همین نقشه آیکون می‌خوانند.
 */
export const PERSONA_ICONS: Record<string, LucideIcon> = {
  explorer: Compass,
  adventurer: Mountain,
  social: Users,
  natureLover: Leaf,
};

/** آیکون پیش‌فرض برای کلید ناشناخته */
export const PERSONA_FALLBACK_ICON: LucideIcon = Sparkles;

/** آیکون lucide متناظر با کلید ویژگی (با fallback ایمن) */
export function getPersonaIcon(key: string): LucideIcon {
  return PERSONA_ICONS[key] ?? PERSONA_FALLBACK_ICON;
}

/**
 * برچسب‌های «برجسته‌ها» که `dnaHighlights` (compute-match-score.ts) تولید
 * می‌کند — اکنون بدون ایموجی؛ این نقشه برای رندر آیکون کنار برچسب است.
 */
export const HIGHLIGHT_LABEL_ICONS: Record<string, LucideIcon> = {
  "کوه‌نوردی": Mountain,
  "ماجراجویی": Flame,
  "طبیعت": Leaf,
  "اجتماعی": Users,
};

/** آیکون متناظر با برچسب برجسته (بدون ایموجی، fallback = Sparkles) */
export function getHighlightLabelIcon(label: string): LucideIcon {
  return HIGHLIGHT_LABEL_ICONS[label] ?? PERSONA_FALLBACK_ICON;
}
