/**
 * AI Trip Planner types — قرارداد مشترک با بک‌اند (بخش ۶ سند v19).
 * این contract با DRF serializer مچ می‌شود — بدون هماهنگی تغییر ندهید.
 */
import type { TourCategory, Difficulty } from "@/types";

export type SocialMode = "solo" | "couple" | "friends" | "group";
export type WeatherPreference = "cool" | "warm" | "any";

export interface TripPlannerInput {
  budgetMin?: number;
  budgetMax?: number;
  durationDays: number;
  categories: TourCategory[];
  difficulty?: Difficulty;
  dateFrom?: string;
  dateTo?: string;
  socialMode: SocialMode;
  camping: boolean;
  weatherPreference?: WeatherPreference;
  /** ورودی آزاد فارسی — فعلاً فقط ذخیره می‌شود، در فاز AI پردازش می‌شود */
  text?: string;
}

export interface PlannerMatch {
  tourId: string;
  score: number;
  /** چرا کامل مچ نشد — برای حالت «نزدیک‌ترین گزینه‌ها» */
  missReasons: string[];
}

export interface PlannerResult {
  input: TripPlannerInput;
  /** تورهای فعال مرتب‌شده (حداکثر ۵) */
  matches: PlannerMatch[];
  /** اگر هیچ تور کاملاً مناسبی نبود */
  isApproximate: boolean;
}
