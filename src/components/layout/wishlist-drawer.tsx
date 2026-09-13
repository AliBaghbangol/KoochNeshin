"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  Heart,
  ShoppingBag,
  Backpack,
  Star,
  Tag,
} from "lucide-react";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useWishlist } from "@/store/wishlist-store";
import { useCart } from "@/store/cart-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { tours } from "@/mocks/tours";
import { equipment } from "@/mocks/equipment";
import { toast } from "sonner";
import {
  formatCurrency,
  toFa,
  CATEGORY_LABELS,
} from "@/lib/format";
import { SmartImage } from "@/components/common/smart-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Wishlist drawer — shows all favorited tours and equipment in a slide-in
 * panel from the right (RTL) side.
 *
 * Reads from `useWishlist` (tourIds + equipmentIds) and joins against the
 * tours/equipment catalogs to display full details. Each item can be:
 *  - removed from wishlist (heart toggle)
 *  - opened to its detail page
 *  - added to cart (equipment only; tours go to detail for booking)
 */
export function WishlistDrawer() {
  const wishlistOpen = useNav((s) => s.wishlistOpen);
  const setWishlistOpen = useNav((s) => s.setWishlistOpen);
  const go = useGo();
  const { tourIds, equipmentIds, remove, removeEquipment } = useWishlist();
  const addEquipment = useCart((s) => s.addEquipment);
  // Mobile: bottom sheet (brief §17). Desktop keeps the side drawer untouched.
  const isMobile = useIsMobile();
  // Guards the staggered clear-all so double clicks don't restart the chain.
  const clearingRef = React.useRef(false);

  const tourItems = tours.filter((t) => tourIds.includes(t.id));
  const equipItems = equipment.filter((e) => equipmentIds.includes(e.id));
  const total = tourItems.length + equipItems.length;
  const totalValue =
    tourItems.reduce((s, t) => s + (t.discountPrice ?? t.price), 0) +
    equipItems.reduce((s, e) => s + e.price, 0);

  const addAllEquipmentToCart = () => {
    equipItems.forEach((e) =>
      addEquipment({
        type: "equipment-sale",
        refId: e.id,
        title: e.title,
        image: e.images[0],
        unitPrice: e.price,
        quantity: 1,
      })
    );
    toast.success(`${toFa(equipItems.length)} تجهیز به سبد خرید اضافه شد`, {
      description: "برای تکمیل خرید، سبد را بررسی کن.",
    });
  };

  /**
   * App-like clear-all: items animate out one-by-one (top → bottom) instead
   * of the whole list vanishing in a single frame (user request: «به ترتیب
   * پاک بشن»). Each removal triggers the smooth exit animation below.
   */
  const clearSequentially = () => {
    if (clearingRef.current) return;
    clearingRef.current = true;
    const ops: Array<() => void> = [
      ...tourItems.map((t) => () => remove(t.id)),
      ...equipItems.map((e) => () => removeEquipment(e.id)),
    ];
    ops.forEach((op, i) => {
      window.setTimeout(() => {
        op();
        if (i === ops.length - 1) clearingRef.current = false;
      }, i * 90);
    });
  };

  /* Shared app-like removal animation: the card collapses to zero height
     while sliding out, so remaining items glide up into place (framer
     `layout` on siblings) instead of jumping when the node unmounts.
     marginBottom:-12 cancels one flex gap so no phantom space remains. */
  const itemExit = {
    opacity: 0,
    x: 60,
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderWidth: 0,
    marginBottom: -12,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <AnimatePresence>
      {wishlistOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWishlistOpen(false)}
            className="fixed inset-0 z-[60] bg-forest/50 backdrop-blur-sm"
          />
          {/* Drawer — slides from right (RTL natural side); bottom sheet on mobile */}
          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={{ x: 0, y: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={cn(
              "fixed z-[70] flex w-full max-w-md flex-col bg-background shadow-2xl",
              isMobile
                ? "inset-x-0 bottom-0 max-h-[88svh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
                : "inset-y-0 right-0",
            )}
          >
            {/* Drag handle — mobile only affordance */}
            {isMobile && (
              <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/25" />
            )}
            {/* Header */}
            <div className="flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sunset/10 text-sunset">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">علاقه‌مندی‌ها</h3>
                  <p className="text-xs text-muted-foreground">
                    {toFa(total)} مورد ذخیره شده
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {total > 0 && (
                  <button
                    onClick={clearSequentially}
                    className="relative flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive max-sm:py-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">پاک کردن همه</span>
                  </button>
                )}
                <button
                  onClick={() => setWishlistOpen(false)}
                  aria-label="بستن"
                  className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="custom-scroll flex-1 overflow-y-auto p-5">
              {total === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <Heart className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="font-semibold">لیست علاقه‌مندی‌ها خالی است</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      تورها و تجهیزات دلخواهت را با قلب ❤ ذخیره کن!
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => {
                        setWishlistOpen(false);
                        go("tours");
                      }}
                      className="bg-primary text-primary-foreground"
                    >
                      کاوش تورها
                    </Button>
                    <Button
                      onClick={() => {
                        setWishlistOpen(false);
                        go("equipment");
                      }}
                      variant="outline"
                    >
                      کاوش تجهیزات
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Tours section */}
                  {tourItems.length > 0 && (
                    <div>
                      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        تورها ({toFa(tourItems.length)})
                      </h4>
                      <ul className="flex flex-col gap-3">
                        <AnimatePresence initial={false}>
                          {tourItems.map((t) => {
                            const price = t.discountPrice ?? t.price;
                            return (
                              <motion.li
                                key={t.id}
                                layout
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={itemExit}
                                className="group flex gap-3 overflow-hidden rounded-2xl border bg-card p-3"
                              >
                                <button
                                  onClick={() => {
                                    setWishlistOpen(false);
                                    go("tour-detail", { id: t.id });
                                  }}
                                  className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary"
                                >
                                  <SmartImage
                                    src={t.images[0]}
                                    alt={t.title}
                                    fallback="tour"
                                    shimmer={false}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                  />
                                </button>
                                <div className="flex flex-1 flex-col">
                                  <div className="flex items-start justify-between gap-2">
                                    <button
                                      onClick={() => {
                                        setWishlistOpen(false);
                                        go("tour-detail", { id: t.id });
                                      }}
                                      className="text-right"
                                    >
                                      <p className="line-clamp-2 text-sm font-semibold leading-6">
                                        {t.title}
                                      </p>
                                      <span className="text-[10px] text-muted-foreground">
                                        {t.destination} • {toFa(t.duration)} روز
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => remove(t.id)}
                                      className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                                      aria-label="حذف"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 max-sm:gap-x-2">
                                    <span className="flex items-center gap-0.5 text-xs">
                                      <Star className="h-3 w-3 fill-gold text-gold" />
                                      {toFa(t.rating)}
                                    </span>
                                    <div className="text-left">
                                      {t.discountPrice && (
                                        <p className="text-[10px] text-muted-foreground line-through">
                                          {formatCurrency(t.price)}
                                        </p>
                                      )}
                                      <p className="text-sm font-bold text-primary">
                                        {formatCurrency(price)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.li>
                            );
                          })}
                        </AnimatePresence>
                      </ul>
                    </div>
                  )}

                  {/* Equipment section */}
                  {equipItems.length > 0 && (
                    <div>
                      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Backpack className="h-3.5 w-3.5" />
                        تجهیزات ({toFa(equipItems.length)})
                      </h4>
                      <ul className="flex flex-col gap-3">
                        <AnimatePresence initial={false}>
                          {equipItems.map((e) => {
                            return (
                              <motion.li
                                key={e.id}
                                layout
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={itemExit}
                                className="group flex gap-3 overflow-hidden rounded-2xl border bg-card p-3"
                              >
                                <button
                                  onClick={() => {
                                    setWishlistOpen(false);
                                    go("product-detail", { id: e.id });
                                  }}
                                  className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary"
                                >
                                  <SmartImage
                                    src={e.images[0]}
                                    alt={e.title}
                                    fallback="equipment"
                                    shimmer={false}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                  />
                                </button>
                                <div className="flex flex-1 flex-col">
                                  <div className="flex items-start justify-between gap-2">
                                    <button
                                      onClick={() => {
                                        setWishlistOpen(false);
                                        go("product-detail", { id: e.id });
                                      }}
                                      className="text-right"
                                    >
                                      <p className="line-clamp-2 text-sm font-semibold leading-6">
                                        {e.title}
                                      </p>
                                      <span className="text-[10px] text-muted-foreground">
                                        {e.brand} •{" "}
                                        {CATEGORY_LABELS[e.category]}
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => removeEquipment(e.id)}
                                      className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                                      aria-label="حذف"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 max-sm:gap-x-2">
                                    <span className="flex items-center gap-0.5 text-xs">
                                      <Star className="h-3 w-3 fill-gold text-gold" />
                                      {toFa(e.rating)}
                                    </span>
                                    <button
                                      onClick={() =>
                                        addEquipment({
                                          type: "equipment-sale",
                                          refId: e.id,
                                          title: e.title,
                                          image: e.images[0],
                                          unitPrice: e.price,
                                          quantity: 1,
                                        })
                                      }
                                      className={cn(
                                        "relative flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1",
                                        "text-[11px] font-bold text-primary-foreground transition hover:bg-emerald-dark",
                                        "max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']",
                                      )}
                                    >
                                      <ShoppingBag className="h-3 w-3" />
                                      افزودن به سبد
                                    </button>
                                  </div>
                                </div>
                              </motion.li>
                            );
                          })}
                        </AnimatePresence>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {total > 0 && (
              <div className="border-t bg-card p-5 max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    مجموع علاقه‌مندی‌ها
                  </span>
                  <span className="font-extrabold text-primary">
                    {toFa(total)} مورد
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ارزش کل سبد دلخواه</span>
                  <span className="font-bold">{formatCurrency(totalValue)}</span>
                </div>
                {equipItems.length > 0 && (
                  <Button
                    onClick={addAllEquipmentToCart}
                    className="mt-3 h-11 w-full rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-emerald-dark max-sm:h-12"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    افزودن همه تجهیزات ({toFa(equipItems.length)}) به سبد
                  </Button>
                )}
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  برای رزرو، روی هر مورد بزن تا به صفحه جزئیاتش بری.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
