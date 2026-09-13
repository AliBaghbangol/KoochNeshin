// src/lib/safety/compute-safety-score.ts
import type { Tour } from "@/types";
import type { SafetyScore, SafetyScoreBreakdown } from "@/types/safety";

/**
 * Compute a transparent Safety Score for a tour — spec §4 of
 * KOCHNESHIN-V19-FRONTEND-DEV-SPEC-PART2.md.
 *
 * Pure TS, no AI. The score is a weighted average of six breakdown
 * dimensions. Some dimensions are stubbed (route GPX, equipment coverage,
 * weather) until the backend exposes them — those TODOs are inline.
 *
 * The weights below are the canonical ones from the spec and must not be
 * changed without product approval (they affect user trust messaging).
 */
export function computeSafetyScore(tour: Tour): SafetyScore {
  const leaderVerification =
    tour.leader.verificationStatus === "verified"
      ? 100
      : tour.leader.verificationStatus === "pending"
        ? 65
        : 35;

  // گروه پرتر کمی ریسک بیشتر — بین ۱۰۰ و ۸۰
  const ratio =
    tour.capacity > 0 ? Math.min(1, tour.reservedCount / tour.capacity) : 0;
  const tripSize = Math.round(100 - ratio * 20);

  const breakdown: SafetyScoreBreakdown = {
    leaderVerification,
    // TODO(backend): route GPX / historical incident data
    routeConfidence: 80,
    // TODO: wire to weather-widget (already on the tour detail page)
    weatherConditions: 85,
    // TODO: wire to Trip Kit coverage (سند اول بخش ۵)
    equipmentReadiness: 75,
    tripSize,
    // قبل از شروع سفر، check-in بی‌معنی است → خوش‌بینانه ۱۰۰
    checkInCompliance: 100,
  };

  const score = Math.round(
    0.2 * breakdown.leaderVerification +
      0.15 * breakdown.routeConfidence +
      0.15 * breakdown.weatherConditions +
      0.15 * breakdown.equipmentReadiness +
      0.1 * breakdown.tripSize +
      // historicalIncidents — فعلاً داده نداریم، خوش‌بینانه ۱۰۰
      0.1 * 100 +
      0.15 * breakdown.checkInCompliance,
  );

  return { score, breakdown };
}

/** Persian label + emoji for each breakdown dimension, used in the UI. */
export const SAFETY_DIMENSION_META: Record<
  keyof SafetyScoreBreakdown,
  { emoji: string; label: string; description: string }
> = {
  leaderVerification: {
    emoji: "✓",
    label: "لیدر تأیید شده",
    description: "هویت و صلاحیت لیدر توسط تیم کوچ‌نشین بررسی شده است.",
  },
  routeConfidence: {
    emoji: "🧭",
    label: "مسیر شناخته‌شده",
    description: "مسیر تور از مسیرهای امن و شناخته‌شده انتخاب شده است.",
  },
  weatherConditions: {
    emoji: "🌤️",
    label: "شرایط جوی مناسب",
    description: "پیش‌بینی هوا در روزهای سفر پایدار به‌نظر می‌رسد.",
  },
  equipmentReadiness: {
    emoji: "🎒",
    label: "تجهیزات اضطراری",
    description: "کیت اولیه، ارتباطات و تجهیزات حیاتی همراه گروه است.",
  },
  tripSize: {
    emoji: "👥",
    label: "ظرفیت کنترل‌شده",
    description: "اندازه‌ی گروه متناسب با ظرفیت ایمن تور است.",
  },
  checkInCompliance: {
    emoji: "📍",
    label: "چک‌این منظم",
    description: "گروه در طول مسیر در نقاط کنترلی ثبت موقعیت می‌کند.",
  },
};

/** رنگ متغیر بر اساس امتیاز کلی — برای ring و badge. */
export function safetyScoreTone(score: number): {
  ring: string;
  text: string;
  bg: string;
  label: string;
} {
  if (score >= 90) {
    return {
      ring: "stroke-emerald",
      text: "text-emerald",
      bg: "bg-emerald/10",
      label: "ایمن",
    };
  }
  if (score >= 75) {
    return {
      ring: "stroke-gold",
      text: "text-gold",
      bg: "bg-gold/10",
      label: "متوسط",
    };
  }
  return {
    ring: "stroke-sunset",
    text: "text-sunset",
    bg: "bg-sunset/10",
    label: "نیاز به توجه",
  };
}
