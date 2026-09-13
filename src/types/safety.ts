// src/types/safety.ts
/**
 * Safety Center types — spec §4 of KOCHNESHIN-V19-FRONTEND-DEV-SPEC-PART2.md.
 *
 * Backend is Django + DRF; these TS interfaces are the frontend contract and
 * mirror what the backend *should* send. No Prisma models here.
 */

export interface SafetyScoreBreakdown {
  /** از tour.leader.verificationStatus موجود */
  leaderVerification: number;
  /** TODO(backend): از route/GPX داده واقعی تور */
  routeConfidence: number;
  /** TODO: به weather-widget وصل شود */
  weatherConditions: number;
  /** TODO: به Trip Kit coverage وصل شود (سند اول بخش ۵) */
  equipmentReadiness: number;
  /** از tour.reservedCount / tour.capacity */
  tripSize: number;
  /** فقط بعد از شروع سفر معنی دارد، قبلش ۱۰۰ فرض می‌شود */
  checkInCompliance: number;
}

export interface SafetyScore {
  score: number;
  breakdown: SafetyScoreBreakdown;
}

export type SafetyIncidentType =
  | "medical"
  | "weather"
  | "equipment"
  | "route"
  | "other";

export type SafetyIncidentSeverity = "low" | "medium" | "high";

/** پیش‌نویس فرم گزارش حادثه — فقط UI فعلاً */
export interface SafetyIncidentDraft {
  type: SafetyIncidentType;
  severity: SafetyIncidentSeverity;
  description: string;
  location?: { lat: number; lng: number };
}

/** یک رویداد ثبت‌شده در timeline ایمنی یک سفر */
export interface SafetyIncident {
  id: string;
  bookingId: string;
  type: SafetyIncidentType;
  severity: SafetyIncidentSeverity;
  description: string;
  /** ISO string */
  createdAt: string;
  /** آیا توسط لیدر/ادمین تأیید شده */
  acknowledged?: boolean;
  location?: { lat: number; lng: number };
}

/** آیتم چک‌لیست ایمنی قبل از سفر (spec §4) */
export interface SafetyChecklistItem {
  id: string;
  label: string;
  /** آیا این آیتم به‌صورت خودکار از داده تور تأمین‌شده است */
  autoFilled?: boolean;
}
