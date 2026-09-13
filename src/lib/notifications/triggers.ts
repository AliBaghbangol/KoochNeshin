import { useNotifications } from "@/store/notifications-store";

/**
 * تولید نوتیفیکیشن‌های هوشمند محلی — گسترش notifications-store موجود
 * (بخش ۹ سند v19). ساختار داده جدید ساخته نمی‌شود؛ از همان AppNotification
 * با type های موجود استفاده می‌شود.
 *
 * TODO(backend): این تریگرها بعداً سمت سرور (سیگنال‌های Django) اجرا می‌شوند؛
 * در فاز فرانت فقط رویدادهای واقعی محلی را نوتیف می‌کنیم — داده جعلی تولید
 * نمی‌شود (قانون ۷ سند).
 */

function add(n: Parameters<ReturnType<typeof useNotifications.getState>["add"]>[0]) {
  useNotifications.getState().add(n);
}

/** بعد از تکمیل Travel DNA — بخش ۹ بند ۲ سند (Fit Score تورهای محبوب به‌روز شد) */
export function notifyDNACompleted() {
  add({
    id: `dna-completed-${Date.now()}`,
    type: "system",
    title: "🧬 DNA سفرت ساخته شد",
    body: "حالا امتیاز تناسب «متناسب با تو» روی تورها و در برنامه‌ریز هوشمند فعال شد.",
    actionLabel: "دیدن تورها",
    actionView: "tours",
  });
}

/** بعد از اولین استفاده از برنامه‌ریز — بهترین مچ پیدا شده */
export function notifyPlannerTopMatch(tourTitle: string, score: number) {
  add({
    id: `planner-match-${Date.now()}`,
    type: "social",
    title: "🗺️ برنامه‌ریز هوشمند",
    body: `برنامه سفرت آماده شد — نزدیک‌ترین تور به سلیقه‌ات: «${tourTitle}» با ${score}٪ تناسب.`,
    actionLabel: "مشاهده برنامه",
    actionView: "tours",
  });
}

/**
 * «تور مطابق با Travel DNA تو منتشر شد» — وقتی لیدر تور جدیدی منتشر کند.
 * فعلاً فقط از جریان واقعی draft-tours (انتشار لیدر) صدا زده می‌شود؛
 * demo-trigger دستی ندارد تا داده جعلی نمایش داده نشود.
 */
export function notifyDnaMatchedTour(tourTitle: string, categoryLabel: string) {
  add({
    id: `dna-tour-${Date.now()}`,
    type: "social",
    title: "✨ تور جدید مطابق سلیقه‌ات",
    body: `یک تور ${categoryLabel} تازه منتشر شد: «${tourTitle}». به‌نظر بر اساس DNA سفرت می‌تواند باب میل تو باشد.`,
    actionLabel: "دیدن تور",
    actionView: "tours",
  });
}

/** تخفیف روی تجهیزات Trip Kit (رویداد واقعی: تغییر قیمت در draft-products فروشنده) */
export function notifyKitDiscount(tourTitle: string) {
  add({
    id: `kit-discount-${Date.now()}`,
    type: "discount",
    title: "🎒 تخفیف کیت تجهیزات",
    body: `تجهیزات پیشنهادی تور «${tourTitle}» اکنون با تخفیف باندل در دسترس است.`,
    actionLabel: "دیدن کیت",
    actionView: "tour-detail",
  });
}
