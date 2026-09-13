// src/lib/analytics/track.ts
/**
 * Lightweight analytics shim — spec §9 of KOCHNESHIN-V19-FRONTEND-DEV-SPEC-PART2.md.
 *
 * For now this only `console.log`s the event so we can verify the wiring in
 * dev. The event names below are the canonical contract used across all
 * Part 2 features; do NOT rename them without updating the spec.
 *
 * TODO(backend/analytics): replace with PostHog / Mixpanel / a Django-side
 * event sink. The signature (`event`, `payload`) should stay stable so the
 * call sites do not change.
 */

export type AnalyticsEvent =
  | "trip_room_opened"
  | "message_sent"
  | "message_replied"
  | "message_deleted"
  | "message_reported"
  | "message_mentioned"
  | "message_pinned"
  | "chat_filter_used"
  | "realtime_connected"
  | "poll_created"
  | "expense_added"
  | "expense_updated"
  | "expenses_exported"
  | "expense_custom_split"
  | "comment_liked"
  | "comment_replied"
  | "comment_deleted"
  | "expense_budget_set"
  | "settlement_marked_paid"
  | "settlement_undone"
  | "settlement_history_cleared"
  | "settlement_reminded"
  | "pwa_nudge_shown"
  | "checklist_item_added"
  | "checklist_item_removed"
  | "planner_budget_preset"
  | "poll_chart_viewed"
  | "live_trip_started"
  | "live_location_shared"
  | "sos_triggered"
  | "safety_checklist_completed"
  | "safety_event_created"
  | "buddy_opted_in"
  | "buddy_request_sent"
  | "buddy_match_created"
  | "story_created"
  | "story_published"
  | "fit_score_viewed"
  | "safety_score_viewed"
  | "dna_quiz_started"
  | "dna_return_to_tour"
  | "dna_quiz_blocked";

export interface AnalyticsPayload {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Track a product event. Safe to call from any client component — it is a
 * no-op on the server and never throws.
 */
export function track(
  event: AnalyticsEvent,
  payload: AnalyticsPayload = {}
): void {
  if (typeof window === "undefined") return;
  try {
    console.debug("[analytics]", event, payload);
    // TODO(backend/analytics): window.posthog?.capture(event, payload) etc.
  } catch {
    /* swallow — analytics must never break UX */
  }
}
