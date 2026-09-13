/**
 * XP / Achievements types — لایه UI محلی (بخش ۸ سند v19).
 */

export type XpEventType =
  | "booking:created"
  | "review:created"
  | "dna:completed"
  | "planner:first-use";

export interface XpEvent {
  id: string;
  type: XpEventType;
  amount: number;
  at: string; // ISO
  meta?: Record<string, string | number>;
}

export interface Achievement {
  id: string;
  trigger: XpEventType;
  /** چندمین رویداد از این نوع لازم است (پیش‌فرض ۱) */
  threshold?: number;
  label: string;
  icon: string;
  description: string;
  xp: number;
}

export const XP_AMOUNTS: Record<XpEventType, number> = {
  "booking:created": 100,
  "review:created": 40,
  "dna:completed": 60,
  "planner:first-use": 30,
};

/** هر ۲۵۰ XP یک سطح */
export const XP_PER_LEVEL = 250;
