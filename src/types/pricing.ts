// src/types/pricing.ts
/**
 * Smart / Surge Pricing contract — spec §7.
 * The frontend only *renders* what the backend sends — never computes.
 */

export type PriceReasonTag =
  | "high_demand"
  | "low_capacity"
  | "near_departure"
  | "early_bird";

export interface DynamicPriceInfo {
  basePrice: number;
  finalPrice: number;
  reasonTags: PriceReasonTag[];
  /** متن آماده از بک‌اند، فرانت آن را عیناً نمایش می‌دهد */
  explanation: string;
  /** درصد تغییر نسبت به قیمت پایه — مثبت یا منفی */
  deltaPercent?: number;
}
