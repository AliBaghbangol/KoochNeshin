import type { Tour } from "@/types";
import type { TripPlannerInput, PlannerMatch } from "@/types/planner";

/**
 * موتور رتبه‌بندی Planner — rule-based خالص، بدون LLM (بخش ۶ سند v19).
 * فرمول ضرایب طبق سند اصلی؛ جای اتصال AI با کامنت مشخص شده.
 */

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const finalPrice = (t: Tour) => t.discountPrice ?? t.price;

/** TODO(AI-backend): پردازش ورودی آزاد فارسی این‌جا انجام می‌شود (فاز LLM سمت سرور) */
function extractBudgetHint(text?: string): { min?: number; max?: number } {
  void text;
  return {};
}

export function scoreTourForPlanner(
  tour: Tour,
  input: TripPlannerInput
): number {
  // بودجه: فاصله قیمت تور از بازه انتخابی کاربر
  const price = finalPrice(tour);
  const min = input.budgetMin ?? 0;
  const max = input.budgetMax ?? Number.MAX_SAFE_INTEGER;
  let budgetFit = 100;
  if (price > max && max > 0) {
    budgetFit = clamp(100 - ((price - max) / Math.max(max, 1)) * 250);
  } else if (min > 0 && price < min) {
    // ارزان‌تر از حد انتخابی هم کمی امتیاز می‌آورد (کیفیت احتمالاً پایین‌تر)
    budgetFit = clamp(100 - ((min - price) / Math.max(min, 1)) * 120);
  }

  const difficultyFit = input.difficulty
    ? tour.difficulty === input.difficulty
      ? 100
      : 40
    : 70;
  const dateFit = 70; // MVP: فعلاً availability واقعی نداریم
  const categoryFit =
    input.categories.length === 0
      ? 70
      : input.categories.includes(tour.category)
        ? 100
        : 20;
  const durationFit = Math.max(
    0,
    100 - Math.abs(tour.duration - input.durationDays) * 20
  );
  const weatherFit = 70; // MVP: بعداً به weather-widget وصل شود
  const leaderQuality = Math.min(100, tour.leader.rating * 20);

  return Math.round(
    0.25 * budgetFit +
      0.2 * difficultyFit +
      0.15 * dateFit +
      0.15 * categoryFit +
      0.1 * durationFit +
      0.1 * weatherFit +
      0.05 * leaderQuality
  );
}

/** چرا این تور کاملاً مچ نیست؟ — برای نمایش «نزدیک‌ترین گزینه‌ها» */
function missReasons(tour: Tour, input: TripPlannerInput): string[] {
  const reasons: string[] = [];
  const price = finalPrice(tour);
  if (input.budgetMax && price > input.budgetMax) {
    reasons.push("بودجه کمی بالاتر از حد شماست");
  }
  if (input.difficulty && tour.difficulty !== input.difficulty) {
    reasons.push("سختی تور با انتخاب شما متفاوت است");
  }
  if (
    input.categories.length > 0 &&
    !input.categories.includes(tour.category)
  ) {
    reasons.push("دسته تور در سبک‌های انتخابی شما نیست");
  }
  if (Math.abs(tour.duration - input.durationDays) >= 2) {
    reasons.push("مدت تور با سفر دلخواه شما فاصله دارد");
  }
  return reasons.slice(0, 2);
}

export function rankTours(
  tours: Tour[],
  input: TripPlannerInput,
  limit = 5
): PlannerMatch[] {
  // تورهای پر به انتها می‌روند (اگر گزینه فعال بود، جایگزین نمایش داده می‌شود)
  const ranked = tours
    .map((tour) => ({
      tour,
      score:
        scoreTourForPlanner(tour, input) + (tour.status === "active" ? 0 : -1000),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit).map(({ tour, score }) => ({
    tourId: tour.id,
    score: clamp(score),
    missReasons: missReasons(tour, input),
  }));
}
