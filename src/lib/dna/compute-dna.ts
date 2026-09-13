import type {
  TravelDNAAnswers,
  TravelDNA,
  TravelDNAScores,
} from "@/types/dna";

/**
 * محاسبه Travel DNA — خالص فرانت، بدون AI (بخش ۳ سند v19).
 *
 * ⚠️ فرمول MVP است و بعداً با داده واقعی tune می‌شود؛
 * مهم این است که ساختار خروجی (scores) ثابت بماند چون
 * Fit Score و Planner به آن وابسته‌اند.
 *
 * نکته: فرمول draft سند برای natureLover غیر یکنوا بود
 * (به هتل‌پسندها امتیاز طبیعت‌دوستی بالاتر می‌داد)؛ این‌جا با
 * نگاشت صحیح (کمپ‌پسندی + ماجراجویی) جایگزین شده — ساختار خروجی دست‌نخورده.
 */

function pct(value: number) {
  return Math.round(((value - 1) / 4) * 100); // 1-5 → 0-100
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function computeTravelDNA(
  userId: string,
  answers: TravelDNAAnswers
): TravelDNA {
  return {
    userId,
    answers,
    scores: {
      explorer: clamp(
        pct((answers.viewVsHistory + answers.adventure) / 2)
      ),
      adventurer: pct(answers.adventure),
      social: pct(answers.soloVsGroup),
      natureLover: clamp(
        pct((answers.campingVsHotel + answers.adventure) / 2)
      ),
    },
    computedAt: new Date().toISOString(),
  };
}

/** برچسب فارسی بالاترین ویژگی — برای badge و کارت */
export function dominantTrait(scores: TravelDNAScores): {
  key: keyof TravelDNAScores;
  label: string;
  emoji: string;
  value: number;
} {
  const entries = Object.entries(scores) as [keyof TravelDNAScores, number][];
  const [key, value] = entries.sort((a, b) => b[1] - a[1])[0];
  const map: Record<
    keyof TravelDNAScores,
    { label: string; emoji: string }
  > = {
    explorer: { label: "کاوشگر", emoji: "🧭" },
    adventurer: { label: "ماجراجو", emoji: "🧗" },
    social: { label: "اجتماعی", emoji: "🤝" },
    natureLover: { label: "طبیعت‌دوست", emoji: "🌿" },
  };
  return { key, label: map[key].label, emoji: map[key].emoji, value };
}
