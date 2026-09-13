/**
 * Seasonality + storytelling extras per destination (brief §34).
 * Keyed by destination name (as defined in src/mocks/tours.ts).
 * - bestSeasons: فصل‌های پیشنهادی سفر
 * - bestMonthsLabel: بازه ماه‌های پیشنهادی (سازگار با فصل‌ها)
 * - tagline: جمله احساسی/storytelling برای کارت مقصد
 * - vibe: حس و حال کوتاه برای نشان روی تصویر
 */
export interface DestinationExtras {
  bestSeasons: string[];
  bestMonthsLabel: string;
  tagline: string;
  vibe: string;
}

export const destinationExtras: Record<string, DestinationExtras> = {
  "قله دماوند": {
    bestSeasons: ["تابستان"],
    bestMonthsLabel: "تیر تا شهریور",
    tagline: "بام ایران را با پاهای خودت فتح کن",
    vibe: "حماسی",
  },
  کندوان: {
    bestSeasons: ["بهار", "تابستان"],
    bestMonthsLabel: "اردیبهشت تا شهریور",
    tagline: "خانه‌هایی در دل سنگ، با هزاران سال قصه",
    vibe: "رازآلود",
  },
  "جنگل ابر": {
    bestSeasons: ["بهار", "تابستان"],
    bestMonthsLabel: "اردیبهشت تا شهریور",
    tagline: "روی ابرها قدم بزن، مه از کنارت می‌گذرد",
    vibe: "مه‌آلود",
  },
  "دشت لوت": {
    bestSeasons: ["زمستان", "بهار"],
    bestMonthsLabel: "دی تا اردیبهشت",
    tagline: "روشن‌ترین ستاره‌ها بر گرم‌ترین خاک زمین",
    vibe: "اسرارآمیز",
  },
  "جزیره قشم": {
    bestSeasons: ["پاییز", "زمستان"],
    bestMonthsLabel: "آبان تا اسفند",
    tagline: "جایی که جنگل بر آینه دریا شناور می‌شود",
    vibe: "گرمسیری",
  },
  "تخت جمشید": {
    bestSeasons: ["پاییز", "زمستان"],
    bestMonthsLabel: "آبان تا اسفند",
    tagline: "سنگ بر سنگ، شکوه هزاران سال قصه می‌گوید",
    vibe: "تاریخی",
  },
  ماسوله: {
    bestSeasons: ["بهار", "تابستان"],
    bestMonthsLabel: "اردیبهشت تا شهریور",
    tagline: "پله‌پله تا پشت‌بام‌ها، در آغوش مه",
    vibe: "کلاسیک",
  },
  "کویر مرنجاب": {
    bestSeasons: ["پاییز", "زمستان"],
    bestMonthsLabel: "مهر تا اسفند",
    tagline: "دشت طلایی که شب‌ها با ستاره‌ها می‌خوابد",
    vibe: "آرام",
  },
};

export function getDestinationExtras(
  name: string
): DestinationExtras | undefined {
  return destinationExtras[name];
}
