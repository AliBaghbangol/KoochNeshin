"use client";

import { Check, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/common/smart-image";
import { toFa, formatCurrency } from "@/lib/format";
import type { TripKitItem } from "@/types/trip-kit";

/**
 * یک ردیف کیت تجهیزات (بخش ۵ سند v19) — ✓ ضروری / □ اختیاری + قیمت + افزودن به سبد.
 *
 * v23.1: دایره‌ی تیک دیگر صرفاً نشانه نیست — یک چک‌باکس واقعی است که آیتم را
 * «انتخاب‌شده» می‌کند (انتخاب‌ها با دکمه‌ی «افزودن موارد انتخاب‌شده» به سبد
 * می‌روند) و کلیک روی آن پاسخ می‌دهد.
 */
export function TripKitItemRow({
  item,
  mode,
  rentDays,
  checked,
  onToggleCheck,
  onAdd,
  addLabel = "افزودن به سبد",
}: {
  item: TripKitItem;
  mode: "buy" | "rent";
  rentDays: number;
  /** Selection state owned by the section (shared bulk-add button). */
  checked?: boolean;
  onToggleCheck?: (item: TripKitItem) => void;
  onAdd: (item: TripKitItem) => void;
  addLabel?: string;
}) {
  const { product, required, reason } = item;
  const outOfSale = !product.availableForSale || product.stock <= 0;
  const outOfRent =
    !product.availableForRent || (product.rentStock ?? product.stock) <= 0;
  const disabled = mode === "buy" ? outOfSale : outOfRent;

  const unitPrice = mode === "buy" ? product.price : product.rentPricePerDay ?? 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border bg-background p-2.5 transition-colors hover:border-emerald/30 ${
        checked ? "border-emerald/50 bg-emerald/5" : ""
      }`}
    >
      {/* Interactive selection checkbox (previously a static indicator). */}
      <button
        type="button"
        role="checkbox"
        aria-checked={!!checked}
        aria-label={checked ? "حذف از انتخاب‌ها" : "انتخاب برای افزودن به سبد"}
        onClick={() => onToggleCheck?.(item)}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${
          checked
            ? "bg-emerald text-white shadow-sm shadow-emerald/30"
            : required
              ? "bg-emerald/15 text-emerald hover:bg-emerald/25"
              : "bg-muted text-muted-foreground hover:bg-secondary"
        }`}
      >
        {checked ? (
          <Check className="h-3.5 w-3.5" />
        ) : required ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Square className="h-3 w-3" />
        )}
      </button>

      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
        <SmartImage
          src={product.images[0]}
          alt={product.title}
          fallback="equipment"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-bold">{product.title}</p>
          {required ? (
            <Badge className="rounded-full bg-emerald/10 text-[10px] text-emerald">
              ضروری
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full text-[10px]">
              اختیاری
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {reason}
        </p>
      </div>

      <div className="hidden shrink-0 text-left sm:block">
        <p className="text-sm font-extrabold">
          {formatCurrency(mode === "buy" ? unitPrice : unitPrice * rentDays)}
        </p>
        {mode === "rent" && (
          <p className="text-[10px] text-muted-foreground">
            {toFa(rentDays)} روز × {formatCurrency(unitPrice)}
          </p>
        )}
      </div>

      <Button
        size="sm"
        variant={disabled ? "ghost" : "outline"}
        disabled={disabled}
        onClick={() => onAdd(item)}
        className="h-8 shrink-0 gap-1 rounded-xl border-primary/30 px-2.5 text-[11px] font-bold text-primary transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15 dark:hover:text-emerald-light"
        title={disabled ? "ناموجود" : undefined}
      >
        {disabled ? "ناموجود" : (
          <>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden md:inline">{addLabel}</span>
          </>
        )}
      </Button>
    </div>
  );
}
