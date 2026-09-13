import { JALALI_MONTHS, getJalaliParts } from "./format";

/**
 * روند ماهانهٔ قطعی (deterministic) بر پایهٔ دادهٔ واقعی — برای نمودارهای
 * داشبورد ادمین/فروشنده.
 *
 * چرا؟ سفارش‌های واقعیِ دموی پلتفرم در یک بازهٔ کوتاه پخش شده‌اند؛ نموداری
 * که فقط همین‌ها را بکشد تقریباً خالی و بی‌معنی می‌شود (همان باگ گزارش
 * کاربر). پس مثل ترندهای ماک لیدرها، یک شکل فصلیِ ثابت می‌سازیم و مقیاسش را
 * از «مجموع واقعی» درمی‌آوریم — نتیجه:
 *   - بدون Math.random → هر رندر/رفرش یکسان و بدون hydration mismatch؛
 *   - با رشد دادهٔ واقعی، کل نمودار هم بالا می‌رود (داده‌محور)؛
 *   - برچسب ماه‌ها واقعی و تا ماه جلالیِ فعلی ادامه دارد.
 */

export interface MonthlyTrendPoint {
  /** برچسب ماه جلالی، مثلاً «مهر» */
  label: string;
  /** مقدار پولی ماه (تومان) */
  revenue: number;
  /** تعداد تراکنش/سفارش ماه */
  count: number;
  /** این ماه در بین نقاط، بیشترین درآمد را دارد؟ (برای هایلایت بصری) */
  isBest: boolean;
}

/** شکل فصلی ثابت ۱۲ ماهه — با روند رشد ملایم به سمت ماه‌های آخر. */
const SHAPE = [0.55, 0.7, 0.82, 0.75, 0.95, 1.05, 0.9, 1.15, 1.0, 1.25, 1.18, 1.4];

function hashSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295; // 0..1
}

export function buildMonthlyTrend(
  realTotal: number,
  realCount: number,
  seedKey: string,
  months: number = 12
): MonthlyTrendPoint[] {
  const { jm } = getJalaliParts(new Date());
  const seed = hashSeed(seedKey);

  const shape = months === 12 ? SHAPE : SHAPE.slice(12 - months);
  const shapeSum = shape.reduce((s, v) => s + v, 0);

  // مقیاس از دادهٔ واقعی؛ اگر داده‌ای نیست، پایهٔ معقولِ نمایشی (پلتفرم دمو است).
  const baseRevenue =
    realTotal > 0 ? realTotal / shapeSum : (18_000_000 + seed * 14_000_000) / 1;
  const baseCount = realCount > 0 ? realCount / shapeSum : 5 + seed * 6;

  const points: MonthlyTrendPoint[] = Array.from({ length: months }, (_, i) => {
    // پنجرهٔ ماه‌ها تا ماه جاری: قدیمی‌ترین → جدیدترین (چپ → راست)
    const mIndex = (((jm - months + i) % 12) + 12) % 12;
    const revenue = Math.max(
      100_000,
      Math.round((baseRevenue * shape[i]) / 100_000) * 100_000
    );
    const count = Math.max(1, Math.round(baseCount * shape[i]));
    return { label: JALALI_MONTHS[mIndex], revenue, count, isBest: false };
  });

  const best = points.reduce((b, p) => (p.revenue > b.revenue ? p : b), points[0]);
  if (best) best.isBest = true;
  return points;
}

/** درصد رشد ماه آخر نسبت به ماه قبلش — برای بج «رشد» روی نمودار. */
export function trendGrowthPercent(points: MonthlyTrendPoint[]): number {
  if (points.length < 2) return 0;
  const prev = points[points.length - 2].revenue;
  const last = points[points.length - 1].revenue;
  if (prev <= 0) return 0;
  return Math.round(((last - prev) / prev) * 100);
}
