"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag, Backpack } from "lucide-react";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useCart } from "@/store/cart-store";
import { formatCurrency, toFa } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/common/smart-image";
import { CartItemMetaChips } from "@/components/common/cart-item-meta";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const cartOpen = useNav((s) => s.cartOpen);
  const setCartOpen = useNav((s) => s.setCartOpen);
  const go = useGo();
  const { items, remove, updateQty, total, count } = useCart();
  // Mobile: bottom sheet (brief §17). Desktop keeps the side drawer untouched.
  const isMobile = useIsMobile();

  const checkout = () => {
    setCartOpen(false);
    go("checkout");
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-[60] bg-forest/50 backdrop-blur-sm"
          />
          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "-100%" }}
            animate={{ x: 0, y: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={cn(
              "fixed z-[70] flex w-full max-w-md flex-col bg-background shadow-2xl",
              isMobile
                ? "inset-x-0 bottom-0 max-h-[88svh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
                : "inset-y-0 left-0",
            )}
          >
            {/* Drag handle — mobile only affordance */}
            {isMobile && (
              <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/25" />
            )}
            {/* Header */}
            <div className="flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Backpack className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">کوله‌پشتی سفر</h3>
                  <p className="text-xs text-muted-foreground">
                    {toFa(count())} آیتم در سبد
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="custom-scroll flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="font-semibold">کوله‌پشتی خالی است</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      تورها و تجهیزات دلخواهت را اضافه کن!
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => {
                        setCartOpen(false);
                        go("tours");
                      }}
                      className="bg-primary text-primary-foreground"
                    >
                      کاوش تورها
                    </Button>
                    <Button
                      onClick={() => {
                        setCartOpen(false);
                        go("equipment");
                      }}
                      variant="outline"
                    >
                      کاوش تجهیزات
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        className="flex gap-3 rounded-2xl border bg-card p-3"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                          <SmartImage
                            src={item.image}
                            alt={item.title}
                            fallback={item.type === "tour" ? "tour" : "equipment"}
                            shimmer={false}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="line-clamp-2 text-sm font-semibold leading-6">
                                {item.title}
                              </p>
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                {item.type === "tour"
                                  ? "تور"
                                  : item.type === "equipment-rent"
                                  ? "اجاره تجهیز"
                                  : "خرید تجهیز"}
                              </span>
                            </div>
                            <button
                              onClick={() => remove(item.id)}
                              className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <CartItemMetaChips meta={item.meta} type={item.type} />
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 max-sm:gap-x-2">
                            <div className="flex items-center gap-1 rounded-lg border">
                              <button
                                onClick={() =>
                                  updateQty(item.id, item.quantity - 1)
                                }
                                className="relative grid h-7 w-7 place-items-center rounded-r-lg hover:bg-secondary max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold">
                                {toFa(item.quantity)}
                              </span>
                              <button
                                onClick={() =>
                                  updateQty(item.id, item.quantity + 1)
                                }
                                className="relative grid h-7 w-7 place-items-center rounded-l-lg hover:bg-secondary max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-sm font-bold text-primary">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="space-y-3 border-t bg-card p-5 max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">جمع کل</span>
                  <span className="text-lg font-extrabold text-primary">
                    {formatCurrency(total())}
                  </span>
                </div>
                <Button
                  onClick={checkout}
                  className="h-12 w-full rounded-2xl bg-primary text-base text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-emerald-dark"
                >
                  ادامه و پرداخت
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
