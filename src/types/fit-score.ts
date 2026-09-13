/**
 * Tour Fit Score types — قرارداد مشترک با بک‌اند (بخش ۴ سند v19).
 */

export interface FitScoreBreakdown {
  budget: number; // 0-100
  difficulty: number; // 0-100
  weather: number; // 0-100
  leader: number; // 0-100
  preference: number; // 0-100
}

export interface TourFitScore {
  tourId: string;
  score: number; // 0-100
  breakdown: FitScoreBreakdown;
}
