"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  GitCompare,
  Star,
  Trash2,
  ArrowLeft,
  Tag,
  Banknote,
  Package,
  BadgeCheck,
  Sparkles,
  Crown,
  Trophy,
  Check,
  Minus,
  ShoppingCart,
  Repeat,
  Award,
} from "lucide-react";
import { useNav } from "@/store/nav-store";
import { useEquipmentCompare } from "@/store/equipment-compare-store";
import { useCart } from "@/store/cart-store";
import { equipment } from "@/mocks/equipment";
import { toFa, formatCurrency } from "@/lib/format";
import { SmartImage } from "@/components/common/smart-image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Equipment compare drawer — redesigned to mirror the tours CompareDrawer
 * one-to-one (same sheet, same sticky label column, same fixed row heights,
 * same best-value highlighting, same winner crown & footer legend):
 *
 *  - Dimmed backdrop that closes on click
 *  - Glass bottom sheet with sticky header (icon + title + count badge)
 *  - Horizontal-scroll body with a sticky label column (RTL: right side)
 *  - Each product = one column with image + title + remove button at top
 *  - Each row = one feature (price, rent, rating, stock, …)
 *  - Unique per-row winners get a highlighted cell + check badge
 *  - Column with the most wins gets the «بهترین انتخاب» crown
 *  - Sticky footer legend + per-column CTA (افزودن به سبد)
 */

const CAT_LABELS: Record<string, string> = {
  mountaineering: "کوهنوردی",
  camping: "کمپینگ",
  clothing: "پوشاک",
  "travel-gear": "تجهیزات سفر",
};

const MAX_COMPARE = 3;

// -- Comparison spec ----------------------------------------------------

type Comparator = "min" | "max" | "none";

type EquipItem = (typeof equipment)[number];

interface RowSpec {
  key: string;
  label: string;
  icon: typeof Star;
  /** Extracts a comparable numeric value (`null` → never a winner). */
  value: (p: EquipItem) => number | null;
  render: (p: EquipItem, isBest: boolean) => React.ReactNode;
  best: Comparator;
}

const PRICE_BEST: Comparator = "min";
const RENT_BEST: Comparator = "min";
const RATING_BEST: Comparator = "max";
const STOCK_BEST: Comparator = "max";

const ROWS: RowSpec[] = [
  {
    key: "price",
    label: "قیمت خرید",
    icon: Tag,
    value: (p) => p.price,
    best: PRICE_BEST,
    render: (p, isBest) => (
      <span
        className={cn(
          "text-sm font-extrabold leading-tight",
          isBest ? "text-emerald" : "text-foreground",
        )}
      >
        {formatCurrency(p.price)}
      </span>
    ),
  },
  {
    key: "rent",
    label: "اجاره روزانه",
    icon: Banknote,
    value: (p) => p.rentPricePerDay ?? null,
    best: RENT_BEST,
    render: (p, isBest) =>
      p.rentPricePerDay ? (
        <span
          className={cn(
            "text-sm font-bold",
            isBest ? "text-emerald" : "text-sunset",
          )}
        >
          {formatCurrency(p.rentPricePerDay)}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground/60">—</span>
      ),
  },
  {
    key: "rating",
    label: "امتیاز",
    icon: Star,
    value: (p) => p.rating,
    best: RATING_BEST,
    render: (p, isBest) => (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <Star
            className={cn(
              "h-3.5 w-3.5",
              isBest
                ? "fill-gold text-gold"
                : "fill-muted-foreground/40 text-muted-foreground/40",
            )}
          />
          <span
            className={cn(
              "text-sm font-bold",
              isBest ? "text-gold" : "text-foreground",
            )}
          >
            {toFa(p.rating)}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "stock",
    label: "موجودی",
    icon: Package,
    value: (p) => p.stock,
    best: STOCK_BEST,
    render: (p, isBest) => (
      <span
        className={cn(
          "text-sm font-bold",
          p.stock <= 5 ? "text-sunset" : isBest ? "text-emerald" : "text-foreground",
        )}
      >
        {toFa(p.stock)} عدد
      </span>
    ),
  },
  {
    key: "condition",
    label: "وضعیت",
    icon: BadgeCheck,
    value: () => null,
    best: "none",
    render: (p) => (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-bold",
          p.condition === "new"
            ? "bg-emerald/10 text-emerald"
            : "bg-secondary text-muted-foreground",
        )}
      >
        {p.condition === "new" ? "نو" : "دست دوم"}
      </span>
    ),
  },
  {
    key: "brand",
    label: "برند",
    icon: Award,
    value: () => null,
    best: "none",
    render: (p) => (
      <span className="text-xs font-bold text-foreground">{p.brand}</span>
    ),
  },
  {
    key: "category",
    label: "دسته‌بندی",
    icon: Sparkles,
    value: () => null,
    best: "none",
    render: (p) => (
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-foreground">
        {CAT_LABELS[p.category]}
      </span>
    ),
  },
  {
    key: "rentable",
    label: "قابل اجاره",
    icon: Repeat,
    value: () => null,
    best: "none",
    render: (p) =>
      p.availableForRent ? (
        <Check className="h-4 w-4 text-emerald" strokeWidth={2.5} />
      ) : (
        <Minus className="h-4 w-4 text-muted-foreground/40" />
      ),
  },
];

// -- Best-value computation (same unique-winner rule as tours) -----------

function computeBest(items: EquipItem[]): Record<string, string | null> {
  const bestIds: Record<string, string | null> = {};
  for (const row of ROWS) {
    if (row.best === "none") continue;
    let bestVal: number | null = null;
    for (const p of items) {
      const v = row.value(p);
      if (v === null) continue;
      if (bestVal === null) {
        bestVal = v;
      } else if (row.best === "min" && v < bestVal) {
        bestVal = v;
      } else if (row.best === "max" && v > bestVal) {
        bestVal = v;
      }
    }
    if (bestVal !== null) {
      const winners = items.filter((p) => row.value(p) === bestVal);
      // Ties → no highlight (avoids multiple "winners" on equal values).
      bestIds[row.key] = winners.length === 1 ? winners[0].id : null;
    } else {
      bestIds[row.key] = null;
    }
  }
  return bestIds;
}

// -- Component ----------------------------------------------------------

export function EquipmentCompareDrawer() {
  const equipCompareOpen = useNav((s) => s.equipCompareOpen);
  const setEquipCompareOpen = useNav((s) => s.setEquipCompareOpen);
  const go = useNav((s) => s.go);
  const { productIds, remove, clear } = useEquipmentCompare();
  const addEquipment = useCart((s) => s.addEquipment);
  const setCartOpen = useNav((s) => s.setCartOpen);
  const items = equipment.filter((e) => productIds.includes(e.id));

  const bestIds = React.useMemo(() => computeBest(items), [items]);

  const winsByProduct = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of ROWS) {
      if (row.best === "none") continue;
      const id = bestIds[row.key];
      if (id) counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [bestIds]);

  // Product with the most wins gets the crown — only with a unique winner.
  const overallWinnerId = React.useMemo(() => {
    if (items.length < 2) return null;
    let topId: string | null = null;
    let topCount = 0;
    let tied = false;
    for (const id of Object.keys(winsByProduct)) {
      const c = winsByProduct[id];
      if (c > topCount) {
        topCount = c;
        topId = id;
        tied = false;
      } else if (c === topCount && c > 0) {
        tied = true;
      }
    }
    return tied || !topId || topCount === 0 ? null : topId;
  }, [items.length, winsByProduct]);

  const addToCart = (id: string) => {
    const p = equipment.find((e) => e.id === id);
    if (!p) return;
    addEquipment({
      type: "equipment-sale",
      refId: p.id,
      title: p.title,
      image: p.images[0],
      unitPrice: p.price,
      quantity: 1,
    });
    toast.success("به سبد اضافه شد", { description: p.title });
    setCartOpen(true);
  };

  const viewProduct = (id: string) => {
    setEquipCompareOpen(false);
    go("product-detail", { id });
  };

  return (
    <AnimatePresence>
      {equipCompareOpen && (
        <>
          {/* Dimmed backdrop — closes on click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setEquipCompareOpen(false)}
            className="fixed inset-0 z-[64] bg-forest/40 backdrop-blur-sm"
            aria-hidden
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-[65] mx-auto flex max-h-[85vh] max-w-6xl flex-col overflow-hidden rounded-t-[28px] border-t border-white/20 bg-background/85 shadow-[0_-12px_60px_-12px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="مقایسه تجهیزات"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 py-3.5 backdrop-blur-xl md:px-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sunset/10 text-sunset ring-1 ring-sunset/20">
                  <GitCompare className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="flex items-center gap-2 text-base font-extrabold leading-tight md:text-lg">
                    مقایسه تجهیزات
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-sunset px-1.5 text-xs font-bold text-white">
                      {toFa(items.length)}
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground md:text-xs">
                    {items.length === 0
                      ? "تجهیزی انتخاب نشده است"
                      : items.length === 1
                        ? "یک تجهیز دیگر اضافه کنید تا مقایسه فعال شود"
                        : "ویژگی‌ها را کنار هم مقایسه کنید — برترین‌ها هایلایت شده‌اند"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {items.length > 0 && (
                  <button
                    onClick={clear}
                    className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent max-sm:min-h-11"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">پاک کردن همه</span>
                    <span className="sm:hidden">پاک کردن</span>
                  </button>
                )}
                <button
                  onClick={() => setEquipCompareOpen(false)}
                  aria-label="بستن"
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground max-sm:h-11 max-sm:w-11"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="custom-scroll flex-1 overflow-auto px-2 py-3 md:px-4 md:py-4">
              {items.length === 0 ? (
                <EmptyState />
              ) : items.length === 1 ? (
                <SingleProductHint
                  item={items[0]}
                  onView={() => viewProduct(items[0].id)}
                  onClose={() => setEquipCompareOpen(false)}
                />
              ) : (
                <ComparisonTable
                  items={items}
                  bestIds={bestIds}
                  winsByProduct={winsByProduct}
                  overallWinnerId={overallWinnerId}
                  onRemove={remove}
                  onView={viewProduct}
                  onAddToCart={addToCart}
                />
              )}
            </div>

            {/* Sticky footer — legend + CTA row */}
            {items.length >= 2 && (
              <div className="shrink-0 border-t border-border/60 bg-background/70 px-4 py-2.5 backdrop-blur-xl md:px-6 max-sm:pb-[max(0.625rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between gap-3 text-[11px] max-sm:flex-col max-sm:items-start max-sm:gap-1.5">
                  <div className="flex items-center gap-3 text-muted-foreground max-sm:flex-wrap max-sm:gap-x-3 max-sm:gap-y-1">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-gold" />
                      برترین هر ردیف
                    </span>
                    <span className="flex items-center gap-1">
                      <Crown className="h-3.5 w-3.5 text-gold" />
                      بهترین انتخاب کلی
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {toFa(ROWS.length)} ویژگی مقایسه می‌شود
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// -- Empty state --------------------------------------------------------

function EmptyState() {
  const setEquipCompareOpen = useNav((s) => s.setEquipCompareOpen);
  const go = useNav((s) => s.go);
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary/60">
        <GitCompare className="h-7 w-7 opacity-40" />
      </div>
      <div>
        <p className="font-bold text-foreground">تجهیزی برای مقایسه نیست</p>
        <p className="mt-1 text-xs">
          روی دکمه «مقایسه» هر تجهیز بزنید تا اینجا اضافه شود.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          حداقل دو تجهیز باید انتخاب شود تا جدول مقایسه فعال شود.
        </p>
      </div>
      <div>
        <button
          onClick={() => {
            setEquipCompareOpen(false);
            go("equipment");
          }}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-emerald-dark max-sm:min-h-11"
        >
          کاوش فروشگاه
        </button>
      </div>
    </div>
  );
}

// -- Single-product hint ------------------------------------------------

function SingleProductHint({
  item,
  onView,
  onClose,
}: {
  item: EquipItem;
  onView: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center">
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
        <SmartImage
          src={item.images[0]}
          alt={item.title}
          fallback="equipment"
          shimmer={false}
          aspectClass="h-14 w-14 rounded-xl"
          className="h-full w-full object-cover"
        />
        <div className="text-right">
          <p className="text-sm font-bold">{item.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatCurrency(item.price)}
            {item.rentPricePerDay
              ? ` — اجاره ${formatCurrency(item.rentPricePerDay)}/روز`
              : ""}
          </p>
        </div>
      </div>
      <div className="max-w-xs text-center">
        <p className="text-sm font-bold text-foreground">
          یک تجهیز دیگر اضافه کن
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          برای دیدن جدول مقایسه، حداقل به دو تجهیز نیاز داری. این پنل را ببند
          و روی دکمه «مقایسه» تجهیز دیگری بزن.
        </p>
      </div>
      <div className="flex gap-2 max-sm:flex-wrap">
        <button
          onClick={onView}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-emerald-dark max-sm:min-h-11"
        >
          مشاهده این محصول
        </button>
        <button
          onClick={onClose}
          className="rounded-xl border border-border/60 px-4 py-2 text-xs font-bold text-muted-foreground transition hover:bg-secondary max-sm:min-h-11"
        >
          بستن و افزودن تجهیز دیگر
        </button>
      </div>
    </div>
  );
}

// -- Comparison table ---------------------------------------------------

function ComparisonTable({
  items,
  bestIds,
  winsByProduct,
  overallWinnerId,
  onRemove,
  onView,
  onAddToCart,
}: {
  items: EquipItem[];
  bestIds: Record<string, string | null>;
  winsByProduct: Record<string, number>;
  overallWinnerId: string | null;
  onRemove: (id: string) => void;
  onView: (id: string) => void;
  onAddToCart: (id: string) => void;
}) {
  // Column width scales down as more products are added so all stay visible
  // without scrolling on common viewport widths (up to 3 products).
  const colWidth =
    items.length <= 2
      ? "min-w-[200px] w-[200px] sm:min-w-[240px] sm:w-[240px]"
      : "min-w-[170px] w-[170px] sm:min-w-[200px] sm:w-[200px]";

  // FIXED row height — guarantees label rows and product-cell rows are
  // pixel-aligned regardless of each cell's content height (same technique
  // as the tours comparison table).
  const ROW_H = "h-[72px]";

  return (
    <div className="flex gap-3">
      {/* Sticky label column (right side in RTL) */}
      <div
        className={cn(
          "sticky right-0 z-10 shrink-0 bg-background/85 backdrop-blur-xl",
          "min-w-[120px] w-[120px] sm:min-w-[140px] sm:w-[140px]",
        )}
      >
        {/* Header spacer — same height as product column headers */}
        <div className="mb-2 flex h-[120px] items-end justify-end pb-2 pl-1">
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              ویژگی‌ها
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              {toFa(ROWS.length)} مورد
            </span>
          </div>
        </div>

        {/* Row labels — FIXED height to match product cells exactly */}
        {ROWS.map((row, i) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className={cn(
                "flex items-center justify-end gap-1.5 border-b border-border/40 px-2 text-right",
                ROW_H,
                i % 2 === 0 ? "bg-secondary/20" : "",
              )}
            >
              <span className="text-[11px] font-bold text-foreground">
                {row.label}
              </span>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-secondary/60 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
          );
        })}

        {/* Footer spacer — same height as CTA row */}
        <div className="h-14" />
      </div>

      {/* Product columns */}
      <div className="flex gap-3">
        {items.map((p, idx) => {
          const isWinner = overallWinnerId === p.id;
          const wins = winsByProduct[p.id] ?? 0;
          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={cn(
                "relative flex shrink-0 flex-col overflow-hidden rounded-2xl border bg-card/70 backdrop-blur-sm",
                colWidth,
                isWinner
                  ? "border-gold/60 shadow-[0_0_0_2px_rgba(217,169,78,0.25),0_8px_30px_-8px_rgba(217,169,78,0.4)]"
                  : "border-border/60",
              )}
            >
              {/* Column header: image + title + remove */}
              <div className="relative mb-2 h-[120px] overflow-hidden">
                <button
                  onClick={() => onView(p.id)}
                  className="group/img absolute inset-0 block"
                  aria-label={`مشاهده ${p.title}`}
                >
                  <SmartImage
                    src={p.images[0]}
                    alt={p.title}
                    fallback="equipment"
                    shimmer={false}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/40 to-transparent" />
                </button>

                {/* Remove button */}
                <button
                  onClick={() => onRemove(p.id)}
                  aria-label={`حذف ${p.title}`}
                  className="absolute left-1.5 top-1.5 z-20 grid h-7 w-7 place-items-center rounded-full bg-background/85 text-muted-foreground shadow-md ring-1 ring-border/50 backdrop-blur transition hover:bg-destructive hover:text-white max-sm:h-9 max-sm:w-9"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Winner badge or rank */}
                <div className="absolute right-1.5 top-1.5 z-20 flex flex-col items-end gap-1">
                  {isWinner ? (
                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-br from-gold-light to-gold px-2 py-0.5 text-[10px] font-extrabold text-forest shadow-md">
                      <Crown className="h-3 w-3" />
                      بهترین انتخاب
                    </span>
                  ) : (
                    <span className="rounded-full bg-forest/70 px-2 py-0.5 text-[10px] font-bold text-cream backdrop-blur">
                      تجهیز {toFa(idx + 1)}
                    </span>
                  )}
                  {wins > 0 && !isWinner && (
                    <span className="flex items-center gap-0.5 rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold text-gold backdrop-blur">
                      <Trophy className="h-2.5 w-2.5" />
                      {toFa(wins)} برتری
                    </span>
                  )}
                </div>

                {/* Title */}
                <button
                  onClick={() => onView(p.id)}
                  className="absolute inset-x-0 bottom-0 z-10 block p-2 text-right"
                >
                  <h4 className="line-clamp-2 text-xs font-bold leading-tight text-cream">
                    {p.title}
                  </h4>
                </button>
              </div>

              {/* Feature rows — FIXED height to match label column exactly */}
              {ROWS.map((row, i) => {
                const isBest = bestIds[row.key] === p.id;
                return (
                  <div
                    key={row.key}
                    className={cn(
                      "relative flex items-center justify-center overflow-visible border-b border-border/40 px-2 text-center",
                      ROW_H,
                      i % 2 === 0 ? "bg-secondary/15" : "",
                      isBest && "bg-emerald/5",
                    )}
                  >
                    {row.render(p, isBest)}
                    {isBest && (
                      <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald text-cream shadow-sm">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}

              {/* CTA row */}
              <div className="flex h-14 items-center justify-center px-2 pt-2">
                <button
                  onClick={() => onAddToCart(p.id)}
                  className={cn(
                    "flex w-full items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition",
                    isWinner
                      ? "bg-gradient-to-br from-gold-light to-gold text-forest hover:brightness-105"
                      : "bg-primary text-primary-foreground hover:bg-emerald-dark",
                  )}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  افزودن به سبد
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* Trailing "add another" card */}
        {items.length < MAX_COMPARE && (
          <button
            onClick={() => useNav.getState().setEquipCompareOpen(false)}
            className={cn(
              "grid shrink-0 place-items-center rounded-2xl border-2 border-dashed border-border/60 bg-secondary/20 text-center text-muted-foreground transition hover:border-primary/40 hover:text-primary",
              colWidth,
            )}
          >
            <div>
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-secondary">
                <GitCompare className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold">تجهیز دیگری اضافه کن</p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">
                تا {toFa(MAX_COMPARE - items.length)} تجهیز دیگر
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
