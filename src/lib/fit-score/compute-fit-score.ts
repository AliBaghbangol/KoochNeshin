import type { Tour, TourCategory } from "@/types";
import type { TravelDNA, TravelDNAScores } from "@/types/dna";
import type { FitScoreBreakdown, TourFitScore } from "@/types/fit-score";

/**
 * محاسبه Fit Score — امتیاز شخصی‌سازی‌شده هر تور برای کاربر فعلی
 * (بخش ۴ سند v19). خالص فرانت، بدون AI.
 *
 * ضرایب نهایی (جایگزین نسخه placeholder سند که بودجه را دو بار می‌شمرد):
 *   preference .30 | difficulty .25 | budget .20 | weather .15 | leader .10
 * ساختار خروجی (breakdown پنج‌فیلدی) دقیقاً طبق قرارداد است و تغییر نکرده.
 */

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const pct = (v: number) => Math.round(((v - 1) / 4) * 100); // 1-5 → 0-100
const avg = (a: number, b: number) => (a + b) / 2;

/** بازه قیمت تورها در داده فعلی — TODO(backend): از پروفایل بودجه واقعی کاربر خوانده شود */
const PRICE_MIN = 1_200_000;
const PRICE_MAX = 4_500_000;

/**
 * نگاشت دسته تور به ویژگی‌های DNA — «این دسته برای چه آدمی جذاب است».
 * برخلاف draft سند از answers مستقیم استفاده می‌کنیم تا سیگنال دقیق‌تر باشد.
 */
function categoryAffinity(
  category: TourCategory,
  dna: TravelDNA
): number {
  const a = dna.answers;
  switch (category) {
    case "mountain":
      return pct(avg(a.adventure, a.campingVsHotel));
    case "desert":
      return pct(a.adventure);
    case "forest":
      return pct(a.campingVsHotel);
    case "coastal":
      return pct(avg(a.soloVsGroup, a.earlyMorning));
    case "historical":
      return pct(a.viewVsHistory);
    default:
      return 70;
  }
}

/** نگاشت سختی تور به میزان ماجراجویی موردنیاز (easy≈۳۳٪ … hard≈۱۰۰٪) */
const DIFFICULTY_TARGET: Record<string, number> = {
  easy: 33,
  medium: 66,
  hard: 100,
};

export function computeFitScore(
  tour: Tour,
  dna: TravelDNA | null
): TourFitScore {
  const leaderFit = Math.min(100, Math.round(tour.leader.rating * 20));
  const finalPrice = tour.discountPrice ?? tour.price;

  if (!dna) {
    // بدون DNA فقط سیگنال‌های عمومی تور — نه صفرِ خام که گمراه‌کننده است
    return {
      tourId: tour.id,
      score: 70,
      breakdown: {
        budget: 70,
        difficulty: 70,
        weather: 70,
        leader: leaderFit,
        preference: 70,
      },
    };
  }

  const s: TravelDNAScores = dna.scores;

  // سختی: فاصله ماجراجویی کاربر از سختیِ موردنیاز تور
  const target = DIFFICULTY_TARGET[tour.difficulty] ?? 66;
  const difficultyFit = clamp(100 - Math.abs(target - s.adventurer));

  // علایق: نگاشت دسته تور به پاسخ‌های DNA
  const preferenceFit = categoryAffinity(tour.category, dna);

  // بودجه: ارزان‌تر = امتیاز پایه بالاتر؛ حساسیت بودجه کاربر ضریب نهایی را می‌کشد
  const priceScore = Math.round(
    100 - clamp(((finalPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100)
  );
  const budgetFit = clamp(
    priceScore + (3 - dna.answers.budgetSensitivity) * 8
  );

  // هوا: MVP فعلاً ثابت — TODO(backend): به داده هوای تاریخ حرکت وصل شود
  const weatherFit = 75;

  const breakdown: FitScoreBreakdown = {
    budget: Math.round(budgetFit),
    difficulty: Math.round(difficultyFit),
    weather: weatherFit,
    leader: leaderFit,
    preference: Math.round(preferenceFit),
  };

  const score = Math.round(
    0.3 * breakdown.preference +
      0.25 * breakdown.difficulty +
      0.2 * breakdown.budget +
      0.15 * breakdown.weather +
      0.1 * breakdown.leader
  );

  return { tourId: tour.id, score: clamp(score), breakdown };
}
