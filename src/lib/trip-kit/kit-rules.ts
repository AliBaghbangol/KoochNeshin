import type { Tour, EquipmentProduct } from "@/types";
import type { TripKit, TripKitItem } from "@/types/trip-kit";

/**
 * Rule engine ساده Trip Kit — خالص TypeScript، نه AI (بخش ۵ سند v19).
 *
 * نکته مهم تطبیق با داده واقعی: محصولات تجهیزات در این پروژه «tags» ندارند؛
 * فیلد واقعی `category` (۴ مقدار ثابت) + `title` فارسی است. بنابراین مچ‌کردن
 * با کلیدواژه روی title انجام می‌شود و category فقط fallback است.
 * TODO(backend): وقتی محصولات tag/attribute سمت Django گرفتند، کلیدواژه‌ها با tag جایگزین شوند.
 */

interface KitRule {
  condition: (tour: Tour) => boolean;
  /** کلیدواژه‌های جست‌وجو در title محصول (حداقل یکی) */
  keywords: string[];
  /** دسته‌های fallback اگر هیچ کلیدواژه‌ای نخورد */
  fallbackCategories: EquipmentProduct["category"][];
  required: boolean;
  reason: string;
}

export const KIT_RULES: KitRule[] = [
  {
    condition: (t) => t.difficulty === "hard" || t.category === "mountain",
    keywords: ["کفش"],
    fallbackCategories: ["mountaineering"],
    required: true,
    reason: "سختی بالا نیاز به کفش مخصوص کوه دارد",
  },
  {
    condition: (t) => t.duration >= 2, // شب‌مانی محتمل
    keywords: ["چادر"],
    fallbackCategories: ["camping"],
    required: true,
    reason: "این تور بیش از یک روز طول می‌کشد",
  },
  {
    condition: (t) => t.duration >= 2,
    keywords: ["کیسه خواب"],
    fallbackCategories: ["camping"],
    required: true,
    reason: "برای شب‌مانی، کیسه‌خواب مناسب دمای مقصد لازم است",
  },
  {
    condition: (t) => t.duration >= 2,
    keywords: ["کوله"],
    fallbackCategories: ["mountaineering"],
    required: true,
    reason: "برای حمل وسایل در مسیر چندروزه",
  },
  {
    condition: (t) => t.category === "mountain" || t.category === "forest",
    keywords: ["چراغ"],
    fallbackCategories: ["travel-gear"],
    required: false,
    reason: "برای مسیرهای کم‌نور توصیه می‌شود",
  },
  {
    condition: (t) => t.category === "desert",
    keywords: ["ضدآفتاب", "کلاه", "عینک"],
    fallbackCategories: ["clothing"],
    required: false,
    reason: "شرایط آب‌وهوایی کویر",
  },
  {
    condition: (t) => t.category === "coastal" || t.category === "forest",
    keywords: ["بارانی", "سافت‌شل"],
    fallbackCategories: ["clothing"],
    required: false,
    reason: "احتمال بارش/رطوبت در این مقصد بالاست",
  },
];

/** درصد تخفیف باندل «افزودن همه به سبد» */
export const KIT_BUNDLE_DISCOUNT = 0.1;

export function getTripKit(tour: Tour, allProducts: EquipmentProduct[]): TripKit {
  const picked = new Map<string, TripKitItem>();

  for (const rule of KIT_RULES) {
    if (!rule.condition(tour)) continue;

    // ۱) مچ با کلیدواژه روی title
    let matched = allProducts.filter((p) =>
      rule.keywords.some((kw) => p.title.includes(kw))
    );

    // ۲) fallback با دسته — فقط اگر هیچ کلیدواژه‌ای محصولی پیدا نکرد
    if (matched.length === 0) {
      matched = allProducts.filter((p) =>
        rule.fallbackCategories.includes(p.category)
      );
    }

    // از هر قانون فقط بهترین مچ (بالاترین امتیاز) را بردار تا لیست شلوغ نشود
    matched
      .sort((a, b) => b.rating - a.rating)
      .slice(0, rule.required ? 1 : 1)
      .forEach((p) => {
        if (!picked.has(p.id)) {
          picked.set(p.id, { product: p, required: rule.required, reason: rule.reason });
        }
      });
  }

  const items = [...picked.values()].sort((a, b) =>
    a.required === b.required ? 0 : a.required ? -1 : 1
  );

  const rentDays = Math.max(1, tour.duration);
  const buyables = items.filter((i) => i.product.availableForSale && i.product.stock > 0);
  const rentables = items.filter(
    (i) => i.product.availableForRent && (i.product.rentStock ?? i.product.stock) > 0
  );

  return {
    tourId: tour.id,
    items,
    hasBuyable: buyables.length > 0,
    hasRentable: rentables.length > 0,
    buyTotal: buyables.reduce((sum, i) => sum + i.product.price, 0),
    rentTotal: rentables.reduce(
      (sum, i) => sum + (i.product.rentPricePerDay ?? 0) * rentDays,
      0
    ),
    rentDays,
  };
}
