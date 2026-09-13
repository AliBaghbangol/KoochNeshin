"use client";

import * as React from "react";
import { Backpack, CheckCheck, ShoppingCart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useCart } from "@/store/cart-store";
import { useTripKit } from "@/data/use-trip-kit";
import { KIT_BUNDLE_DISCOUNT } from "@/lib/trip-kit/kit-rules";
import { toFa, formatCurrency } from "@/lib/format";
import type { Tour, EquipmentProduct } from "@/types";
import type { TripKitItem } from "@/types/trip-kit";
import { TripKitItemRow } from "./trip-kit-item-row";

/**
 * بخش «کیت سفر یک‌کلیکی» در صفحه تور (بخش ۵ سند v19):
 * - تب خرید/اجاره (تب اجاره اگر هیچ محصول اجاره‌ای نبود غیرفعال است — نه خالی گمراه‌کننده)
 * - افزودن تکی یا همه با تخفیف باندل به سبد خرید موجود (useCart.addEquipment)
 * - اگر هیچ قانونی مچ نشد، کل بخش مخفی می‌شود (بدون بخش خالی)
 */
export function TripKitSection({ tour }: { tour: Tour }) {
  const { data: kit, isLoading } = useTripKit(tour);
  const addEquipment = useCart((s) => s.addEquipment);
  const [added, setAdded] = React.useState<Set<string>>(new Set());
  // Per-tab selection (checkbox state) — keys are `${productId}:${mode}`.
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const toggleSelect = React.useCallback((key: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-3xl border bg-card p-5">
        <Skeleton className="h-6 w-56" />
        <div className="mt-4 space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // قانون سند: بدون مچ → مخفی کامل
  if (!kit || kit.items.length === 0) return null;

  const buyables = kit.items.filter(
    (i) => i.product.availableForSale && i.product.stock > 0
  );
  const rentables = kit.items.filter(
    (i) => i.product.availableForRent && (i.product.rentStock ?? i.product.stock) > 0
  );

  const addToCart = (item: TripKitItem, mode: "buy" | "rent") => {
    const p: EquipmentProduct = item.product;
    const key = `${p.id}:${mode}`;
    if (added.has(key)) {
      toast.info("این مورد قبلاً به سبد اضافه شده است");
      return;
    }
    if (mode === "buy") {
      addEquipment({
        type: "equipment-sale",
        refId: p.id,
        title: p.title,
        image: p.images[0],
        unitPrice: p.price,
        quantity: 1,
      });
    } else {
      addEquipment({
        type: "equipment-rent",
        refId: p.id,
        title: p.title,
        image: p.images[0],
        unitPrice: (p.rentPricePerDay ?? 0) * kit.rentDays,
        quantity: 1,
        meta: { rentDays: kit.rentDays },
      });
    }
    setAdded((s) => new Set(s).add(key));
    toast.success(`«${p.title}» به سبد خرید اضافه شد`);
  };

  const addAll = (mode: "buy" | "rent") => {
    const list = mode === "buy" ? buyables : rentables;
    const fresh = list.filter((i) => !added.has(`${i.product.id}:${mode}`));
    if (fresh.length === 0) {
      toast.info("همه موارد این بخش در سبد هستند");
      return;
    }
    fresh.forEach((i) => addToCart(i, mode));
    const total = fresh.reduce(
      (sum, i) =>
        sum +
        (mode === "buy"
          ? i.product.price
          : (i.product.rentPricePerDay ?? 0) * kit.rentDays),
      0
    );
    const discounted = Math.round(total * (1 - KIT_BUNDLE_DISCOUNT));
    toast.success(
      `کیت کامل اضافه شد — باندل ${toFa(Math.round(KIT_BUNDLE_DISCOUNT * 100))}٪ تخفیف: ${formatCurrency(discounted)}`,
      { icon: "🎒" }
    );
  };

  // Bulk-add the checkbox-selected items of a tab.
  const addSelected = (mode: "buy" | "rent") => {
    const list = mode === "buy" ? buyables : rentables;
    const chosen = list.filter(
      (i) => selected.has(`${i.product.id}:${mode}`) && !added.has(`${i.product.id}:${mode}`)
    );
    if (chosen.length === 0) {
      toast.info("مورد انتخاب‌شده‌ای برای افزودن نیست");
      return;
    }
    chosen.forEach((i) => addToCart(i, mode));
    setSelected((s) => {
      const next = new Set(s);
      chosen.forEach((i) => next.delete(`${i.product.id}:${mode}`));
      return next;
    });
  };

  const bundleTotal = (mode: "buy" | "rent") => {
    const list = mode === "buy" ? buyables : rentables;
    const total = list.reduce(
      (sum, i) =>
        sum +
        (mode === "buy"
          ? i.product.price
          : (i.product.rentPricePerDay ?? 0) * kit.rentDays),
      0
    );
    return Math.round(total * (1 - KIT_BUNDLE_DISCOUNT));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-3xl border bg-card"
      aria-label="کیت تجهیزات پیشنهادی این سفر"
    >
      <div className="border-b bg-gradient-to-l from-emerald/5 via-transparent to-gold/5 p-5 pb-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
            <Backpack className="h-5.5 w-5.5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-extrabold">
              برای این سفر چه چیزهایی لازم داری؟
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              بر اساس مقصد، سختی و مدت تور پیشنهاد شده — بدون جست‌وجوی اضافه.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="buy" className="p-5 pt-4">
        <TabsList className="mb-4 grid w-full max-w-64 grid-cols-2 rounded-2xl">
          <TabsTrigger value="buy" className="rounded-xl text-sm font-bold">
            خرید
          </TabsTrigger>
          <TabsTrigger
            value="rent"
            disabled={!kit.hasRentable}
            className="rounded-xl text-sm font-bold"
          >
            اجاره
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="mt-0 space-y-2.5">
          {buyables.map((item) => (
            <TripKitItemRow
              key={`buy-${item.product.id}`}
              item={item}
              mode="buy"
              rentDays={kit.rentDays}
              checked={selected.has(`${item.product.id}:buy`)}
              onToggleCheck={(i) => toggleSelect(`${i.product.id}:buy`)}
              onAdd={(i) => addToCart(i, "buy")}
            />
          ))}
          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {selected.size > 0 && (
                <Button
                  size="sm"
                  onClick={() => addSelected("buy")}
                  className="gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-emerald-dark"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden />
                  افزودن {toFa(selected.size)} مورد انتخاب‌شده
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                مجموع کیت با{" "}
                <span className="font-extrabold text-gold">
                  تخفیف باندل {toFa(Math.round(KIT_BUNDLE_DISCOUNT * 100))}٪
                </span>
                :{" "}
                <span className="font-black text-foreground">
                  {formatCurrency(bundleTotal("buy"))}
                </span>
              </p>
            </div>
            <Button
              onClick={() => addAll("buy")}
              className="gap-2 rounded-2xl bg-emerald text-cream hover:bg-emerald-dark"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden />
              افزودن همه به سبد
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="rent" className="mt-0 space-y-2.5">
          {rentables.map((item) => (
            <TripKitItemRow
              key={`rent-${item.product.id}`}
              item={item}
              mode="rent"
              rentDays={kit.rentDays}
              checked={selected.has(`${item.product.id}:rent`)}
              onToggleCheck={(i) => toggleSelect(`${i.product.id}:rent`)}
              onAdd={(i) => addToCart(i, "rent")}
            />
          ))}
          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {selected.size > 0 && (
                <Button
                  size="sm"
                  onClick={() => addSelected("rent")}
                  className="gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-emerald-dark"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden />
                  افزودن {toFa(selected.size)} مورد انتخاب‌شده
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                اجاره {toFa(kit.rentDays)} روزه با{" "}
                <span className="font-extrabold text-gold">
                  تخفیف باندل {toFa(Math.round(KIT_BUNDLE_DISCOUNT * 100))}٪
                </span>
                :{" "}
                <span className="font-black text-foreground">
                  {formatCurrency(bundleTotal("rent"))}
                </span>
              </p>
            </div>
            <Button
              onClick={() => addAll("rent")}
              className="gap-2 rounded-2xl bg-emerald text-cream hover:bg-emerald-dark"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              افزودن همه به سبد
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </motion.section>
  );
}
