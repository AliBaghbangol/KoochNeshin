// Persian number + currency + Jalali date helpers

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);
}

export function toEn(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

export function formatCurrency(amount: number): string {
  return toFa(amount.toLocaleString("en-US")) + " تومان";
}

export function formatNumber(n: number): string {
  return toFa(n.toLocaleString("en-US"));
}

// Simplified Jalali (Persian) date conversion — good enough for display.
// Uses the algorithm derived from Kazimierz M. Borkowski.
function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function toPersianDate(iso: string): string {
  const d = new Date(iso);
  const [jy, jm, jd] = gregorianToJalali(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate()
  );
  return `${toFa(jd)} ${JALALI_MONTHS[jm - 1]} ${toFa(jy)}`;
}

/** Jalali parts of a Date — { jy, jm (1-12), jd } (same algorithm as toPersianDate). */
export function getJalaliParts(d: Date): { jy: number; jm: number; jd: number } {
  const [jy, jm, jd] = gregorianToJalali(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate()
  );
  return { jy, jm, jd };
}

export { JALALI_MONTHS };

export function toPersianShortDate(iso: string): string {
  const d = new Date(iso);
  const [, jm, jd] = gregorianToJalali(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate()
  );
  return `${toFa(jd)} ${JALALI_MONTHS[jm - 1]}`;
}

export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// Relative time in Persian, e.g. "۵ دقیقه پیش", "۲ ساعت پیش", "دیروز"
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (mins < 1) return "همین الان";
  if (mins < 60) return `${toFa(mins)} دقیقه پیش`;
  if (hours < 24) return `${toFa(hours)} ساعت پیش`;
  if (days === 1) return "دیروز";
  if (days < 7) return `${toFa(days)} روز پیش`;
  if (days < 30) return `${toFa(Math.floor(days / 7))} هفته پیش`;
  return toPersianShortDate(iso);
}

export const CATEGORY_LABELS: Record<string, string> = {
  mountain: "کوهنوردی",
  desert: "بیابان‌گردی",
  coastal: "ساحلی",
  historical: "تاریخی",
  forest: "جنگل",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "آسان",
  medium: "متوسط",
  hard: "سخت",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-emerald-light bg-emerald/10",
  medium: "text-sunset bg-sunset/10",
  hard: "text-destructive bg-destructive/10",
};
