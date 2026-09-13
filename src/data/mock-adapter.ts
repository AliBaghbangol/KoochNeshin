/**
 * لایه داده کوچ‌نشین — آداپتور mock
 *
 * هر تابع data-layer باید همین شکل را داشته باشد تا جایگزینی با API واقعی
 * فقط بدنه تابع عوض شود، امضا (signature) و خروجی ثابت بماند.
 * TODO(backend): به‌محض آماده شدن Django/DRF، بدنه fetchX ها به
 *   fetch(`${NEXT_PUBLIC_API_BASE}/api/...`) تغییر می‌کند — نه امضا، نه کامپوننت‌ها.
 */

/** یک تاخیر مصنوعی شبیه‌سازی شبکه، برای تست loading state */
export async function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** کلیدهای localStorage به‌صورت متمرکز تا در کل اپ تکراری نشوند */
export const LS_KEYS = {
  travelDNA: (userId: string) => `travel-dna:${userId}`,
  dnaBannerDismissed: (userId: string) => `dna-banner-dismissed:${userId}`,
} as const;
