/**
 * Travel DNA types — قرارداد مشترک با بک‌اند (بخش ۳ سند v19).
 * این ساختار API contract است؛ فیلدها را تغییر ندهید.
 */

/** پاسخ‌های کوییز — همه مقادیر ۱ تا ۵ */
export interface TravelDNAAnswers {
  earlyMorning: number; // 1-5 (۱=شب‌بیدار … ۵=سحرخیز)
  adventure: number; // 1-5 (۱=آرام … ۵=ماجراجو)
  campingVsHotel: number; // 1-5 (۱=هتل … ۵=کمپ)
  soloVsGroup: number; // 1-5 (۱=تنها … ۵=گروه)
  viewVsHistory: number; // 1-5 (۱=منظره طبیعی … ۵=تاریخی)
  budgetSensitivity: number; // 1-5 (۱=بی‌تفاوت … ۵=خیلی حساس)
}

export interface TravelDNAScores {
  explorer: number; // 0-100
  adventurer: number; // 0-100
  social: number; // 0-100
  natureLover: number; // 0-100
}

export interface TravelDNA {
  userId: string;
  answers: TravelDNAAnswers;
  scores: TravelDNAScores;
  computedAt: string; // ISO
}
