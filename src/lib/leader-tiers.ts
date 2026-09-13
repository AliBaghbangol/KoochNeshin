/**
 * سطح‌بندی لیدرها (v25) — امتیاز ترکیبی از تعداد تور، امتیاز، تجربه و رضایت
 * مسافران؛ پنج سطح: تازه‌کار → فعال → حرفه‌ای → طلایی → افسانه‌ای.
 *
 * خالص و deterministic — هیچ state یا random در کار نیست تا در سرور و کلاینت
 * یکسان محاسبه شود (بدون hydration mismatch).
 */

export interface LeaderTierInput {
  toursCount: number;
  rating: number;
  experienceYears: number;
  satisfaction: number;
}

export interface LeaderTier {
  /** ۱ تا ۵ */
  level: number;
  label: string;
  icon: string;
  /** کلاس‌های tailwind برای بج (پس‌زمینه/متن/حاشیه) */
  badgeClass: string;
  /** توضیح کوتاه سطح برای تولتیپ */
  description: string;
  /** پیشرفت تا سطح بعد (۰ تا ۱۰۰) — برای سطح ۵ همیشه ۱۰۰ */
  progressToNext: number;
  /** برچسب سطح بعد و چند امتیاز مانده */
  nextLabel?: string;
  pointsToNext?: number;
}

const TIERS: {
  level: number;
  label: string;
  icon: string;
  badgeClass: string;
  description: string;
  min: number;
}[] = [
  {
    level: 1,
    label: "تازه‌کار",
    icon: "🌱",
    badgeClass: "border-emerald/30 bg-emerald/10 text-emerald",
    description: "شروع مسیر لیدری در کوچ‌نشین",
    min: 0,
  },
  {
    level: 2,
    label: "فعال",
    icon: "🧭",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
    description: "لیدر فعال با تجربه اثبات‌شده",
    min: 60,
  },
  {
    level: 3,
    label: "حرفه‌ای",
    icon: "⭐",
    badgeClass: "border-accent/30 bg-accent/10 text-accent",
    description: "حضور حرفه‌ای با امتیاز و رضایت بالا",
    min: 110,
  },
  {
    level: 4,
    label: "طلایی",
    icon: "🏅",
    badgeClass: "border-gold/40 bg-gold/15 text-gold",
    description: "از لیدرهای برتر پلتفرم",
    min: 160,
  },
  {
    level: 5,
    label: "افسانه‌ای",
    icon: "👑",
    badgeClass: "border-gold/50 bg-gradient-to-l from-gold/25 to-sunset/15 text-gold",
    description: "بالاترین سطح افتخار — الگوی لیدرهای کوچ‌نشین",
    min: 220,
  },
];

/** امتیاز سطح: هر تور ۲ امتیاز، هر سال تجربه ۳ امتیاز، امتیاز×۱۰، رضایت÷۲ */
export function leaderTierScore(leader: LeaderTierInput): number {
  return Math.round(
    leader.toursCount * 2 +
      leader.experienceYears * 3 +
      leader.rating * 10 +
      leader.satisfaction / 2
  );
}

export function getLeaderTier(leader: LeaderTierInput): LeaderTier {
  const score = leaderTierScore(leader);
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (score >= TIERS[i].min) idx = i;
  }
  const tier = TIERS[idx];
  const next = TIERS[idx + 1];
  let progressToNext = 100;
  let nextLabel: string | undefined;
  let pointsToNext: number | undefined;
  if (next) {
    const span = next.min - tier.min;
    progressToNext = Math.min(100, Math.max(4, Math.round(((score - tier.min) / span) * 100)));
    nextLabel = next.label;
    pointsToNext = Math.max(0, next.min - score);
  }
  return {
    level: tier.level,
    label: tier.label,
    icon: tier.icon,
    badgeClass: tier.badgeClass,
    description: tier.description,
    progressToNext,
    nextLabel,
    pointsToNext,
  };
}
