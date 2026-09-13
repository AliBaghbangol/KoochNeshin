/**
 * Trip Kit types — قرارداد مشترک با بک‌اند (بخش ۵ سند v19).
 */
import type { EquipmentProduct } from "@/types";

export interface TripKitItem {
  product: EquipmentProduct;
  required: boolean;
  /** دلیل پیشنهاد — نمایش به کاربر */
  reason: string;
}

export interface TripKit {
  tourId: string;
  /** required اول، بعد optional */
  items: TripKitItem[];
  hasBuyable: boolean;
  hasRentable: boolean;
  /** مجموع خرید (بدون تخفیف باندل) */
  buyTotal: number;
  /** مجموع اجاره برای مدت تور (قیمت روزانه × روزها) */
  rentTotal: number;
  rentDays: number;
}
