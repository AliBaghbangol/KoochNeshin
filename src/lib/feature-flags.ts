// src/lib/feature-flags.ts
/**
 * Feature flags — frontend-only toggle layer for gradual rollout.
 * Spec §10 of KOCHNESHIN-V19-FRONTEND-DEV-SPEC-PART2.md.
 *
 * Keep this file small and explicit so it is trivial to flip a flag
 * during a demo or to disable a broken feature without a redeploy of
 * the whole app once a real backend flag system is in place.
 *
 * TODO(backend/analytics): wire these to a real flag service (LaunchDarkly,
 * PostHog flags, or Django-side user flag table) once available.
 */
export const FEATURE_FLAGS = {
  /** §1 — fit score explainability sentence under the breakdown card. */
  fitScoreExplainability: true,
  /** §2 — per-booking group chat + tabs (announcements / members / checklist / polls). */
  tripRoom: true,
  /** §3 — live trip dashboard + geolocation + SOS. */
  liveTrip: true,
  /** §4 — safety score card + pre-trip checklist + incident form. */
  safetyCenter: true,
  /**
   * §5 — travel buddy matching. Mock candidates are seeded locally, so the
   * experience is fully functional now (user report: «همسفریابی فعلا غیرفعال
   * است» was a false dead-end for users who opted in from a tour page).
   */
  travelBuddy: true,
  /** §6 — travel stories feed + composer. */
  travelStories: true,
  /**
   * §7 — dynamic / surge pricing display layer. Default OFF because the real
   * pricing engine lives in the backend; the frontend only renders what the
   * backend sends.
   */
  dynamicPricing: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/** Convenience helper for guards in components: `if (!flagOn("tripRoom")) return null;` */
export function flagOn(key: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[key] === true;
}
