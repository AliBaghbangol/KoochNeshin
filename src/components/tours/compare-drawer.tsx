"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  GitCompare,
  Star,
  Clock,
  Trash2,
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Mountain,
  Trophy,
  Tag,
  Check,
  Sparkles,
  Crown,
} from "lucide-react";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useCompare } from "@/store/compare-store";
import { tours } from "@/mocks/tours";
import {
  formatCurrency,
  toFa,
  toPersianShortDate,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from "@/lib/format";
import { SmartImage } from "@/components/common/smart-image";
import { cn } from "@/lib/utils";
import type { Tour } from "@/types";

/**
 * Real feature-by-feature comparison drawer.
 *
 * The previous version stacked tour cards side-by-side, which was a gallery
 * rather than a comparison. This redesign builds an actual comparison table:
 *
 *  - Sticky header: title, count, clear-all, close
 *  - Horizontal-scroll body with a sticky label column (RTL: right side)
 *  - Each tour = one column with image + title + remove button at top
 *  - Each row = one feature (price, duration, rating, difficulty, etc.)
 *  - "Best value" cells get a highlighted pill so the user can spot winners
 *    at a glance (cheapest price, shortest duration, highest rating, etc.)
 *  - Bottom row: per-column CTA button (مشاهده جزئیات)
 *
 * The sheet keeps the glassmorphism aesthetic and the spring slide-up
 * animation; only the inner content layout was rewritten.
 */

// -- Comparison spec ----------------------------------------------------

type Comparator = "min" | "max" | "none";

interface RowSpec {
  key: string;
  label: string;
  icon: typeof Star;
  /** Extracts a comparable numeric/string value from the tour. */
  value: (t: Tour) => string | number;
  /** Render override — gets the tour + whether this cell is the "best". */
  render?: (t: Tour, isBest: boolean) => React.ReactNode;
  /** Which direction is "best". `none` disables highlighting. */
  best: Comparator;
  /** Whether higher (true) or lower (false) numeric values are best. */
}

const PRICE_BEST: Comparator = "min";
const DURATION_BEST: Comparator = "min"; // shorter = better for most users
const RATING_BEST: Comparator = "max";
const CAPACITY_BEST: Comparator = "min"; // smaller group = more intimate

function discountPct(t: Tour): number {
  if (!t.discountPrice || t.discountPrice >= t.price) return 0;
  return Math.round((1 - t.discountPrice / t.price) * 100);
}

const ROWS: RowSpec[] = [
  {
    key: "price",
    label: "قیمت هر نفر",
    icon: Tag,
    value: (t) => t.discountPrice ?? t.price,
    best: PRICE_BEST,
    render: (t, isBest) => {
      const price = t.discountPrice ?? t.price;
      return (
        <div className="flex flex-col items-center gap-0.5">
          {t.discountPrice ? (
            <span className="text-[10px] text-muted-foreground line-through">
              {formatCurrency(t.price)}
            </span>
          ) : null}
          <span
            className={cn(
              "text-sm font-extrabold leading-tight",
              isBest ? "text-emerald" : "text-foreground",
            )}
          >
            {formatCurrency(price)}
          </span>
          {t.discountPrice ? (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent">
              {toFa(discountPct(t))}٪ تخفیف
            </span>
          ) : null}
        </div>
      );
    },
  },
  {
    key: "duration",
    label: "مدت تور",
    icon: Clock,
    value: (t) => t.duration,
    best: DURATION_BEST,
    render: (t, isBest) => (
      <span
        className={cn(
          "text-sm font-bold",
          isBest ? "text-emerald" : "text-foreground",
        )}
      >
        {toFa(t.duration)} روز
      </span>
    ),
  },
  {
    key: "rating",
    label: "امتیاز",
    icon: Star,
    value: (t) => t.rating,
    best: RATING_BEST,
    render: (t, isBest) => (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <Star
            className={cn(
              "h-3.5 w-3.5",
              isBest ? "fill-gold text-gold" : "fill-muted-foreground/40 text-muted-foreground/40",
            )}
          />
          <span
            className={cn(
              "text-sm font-bold",
              isBest ? "text-gold" : "text-foreground",
            )}
          >
            {toFa(t.rating)}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {toFa(t.reviewsCount)} نظر
        </span>
      </div>
    ),
  },
  {
    key: "difficulty",
    label: "سختی",
    icon: Mountain,
    value: (t) => t.difficulty,
    best: "none",
    render: (t) => (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
          DIFFICULTY_COLORS[t.difficulty],
        )}
      >
        <Mountain className="h-3 w-3" />
        {DIFFICULTY_LABELS[t.difficulty]}
      </span>
    ),
  },
  {
    key: "capacity",
    label: "ظرفیت گروه",
    icon: Users,
    value: (t) => t.capacity,
    best: CAPACITY_BEST,
    render: (t, isBest) => (
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-sm font-bold",
            isBest ? "text-emerald" : "text-foreground",
          )}
        >
          {toFa(t.capacity)} نفر
        </span>
        <span className="text-[10px] text-muted-foreground">
          {toFa(Math.max(0, t.capacity - t.reservedCount))} نفر باقی
        </span>
      </div>
    ),
  },
  {
    key: "date",
    label: "تاریخ شروع",
    icon: Calendar,
    value: (t) => t.startDate,
    best: "none",
    render: (t) => (
      <span className="text-xs font-semibold text-foreground">
        {toPersianShortDate(t.startDate)}
      </span>
    ),
  },
  {
    key: "destination",
    label: "مقصد",
    icon: MapPin,
    value: (t) => t.destination,
    best: "none",
    render: (t) => (
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-xs font-bold text-foreground">
          {t.destination}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {t.province}
        </span>
      </div>
    ),
  },
  {
    key: "category",
    label: "دسته‌بندی",
    icon: Sparkles,
    value: (t) => t.category,
    best: "none",
    render: (t) => (
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-foreground">
        {CATEGORY_LABELS[t.category]}
      </span>
    ),
  },
  {
    key: "leader",
    label: "لیدر تور",
    icon: Crown,
    value: (t) => t.leader.rating,
    best: RATING_BEST,
    render: (t, isBest) => (
      <button
        onClick={() => {
          setCompareOpenRef?.(false);
          goRef?.("leader-profile", { id: t.leaderId });
        }}
        className="group/leader flex flex-col items-center gap-1 text-center"
      >
        <div className="relative">
          <SmartImage
            src={t.leader.avatar}
            alt={t.leader.fullName}
            fallback="avatar"
            shimmer={false}
            aspectClass="h-9 w-9 rounded-full ring-2 ring-gold/30"
            className="h-full w-full object-cover"
          />
          {isBest && (
            <span className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-gold text-forest shadow">
              <Crown className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
        <span className="max-w-[110px] truncate text-[11px] font-semibold text-foreground transition group-hover/leader:text-primary">
          {t.leader.fullName}
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <Star className="h-2.5 w-2.5 fill-gold text-gold" />
          {toFa(t.leader.rating)}
        </span>
      </button>
    ),
  },
  {
    key: "facilities",
    label: "امکانات",
    icon: Check,
    value: (t) => t.facilities.length,
    best: "max",
    render: (t, isBest) => (
      <FacilitiesCell tour={t} isBest={isBest} />
    ),
  },
];

// -- Facilities hover popover -------------------------------------------

/**
 * Facilities cell with a hover/tap popover showing the full, clean list.
 *
 * The collapsed cell shows the count + first 2-3 chips. On hover (desktop)
 * or tap (touch), a popover appears above the cell with a vertical list of
 * all facilities, each with a checkmark icon. Desktop default rendering is
 * unchanged (CSS-only group-hover still drives it); the tap toggle is an
 * additive fallback so touch users can read the full list too.
 */
const FACILITY_OPEN_EVT = "kochneshin:facility-popover-open";

function FacilitiesCell({ tour, isBest }: { tour: Tour; isBest: boolean }) {
  const [open, setOpen] = React.useState(false);
  const cellId = React.useId();
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const [shift, setShift] = React.useState(0);

  // Only one facilities popover stays open at a time.
  React.useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== cellId) setOpen(false);
    };
    window.addEventListener(FACILITY_OPEN_EVT, onOther);
    return () => window.removeEventListener(FACILITY_OPEN_EVT, onOther);
  }, [cellId]);

  // Clamp the tap-open popover inside the sheet on narrow screens so edge
  // columns never get their list cut off (desktop hover path untouched).
  React.useLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const pop = popRef.current;
    if (!pop) return;
    const sheet = pop.closest('[role="dialog"]');
    if (!sheet) return;
    const pr = pop.getBoundingClientRect();
    const sr = sheet.getBoundingClientRect();
    const PAD = 8;
    if (pr.left < sr.left + PAD) {
      setShift(sr.left + PAD - pr.left);
    } else if (pr.right > sr.right - PAD) {
      setShift(sr.right - PAD - pr.right);
    } else {
      setShift(0);
    }
  }, [open]);

  return (
    <div className="group/facilities relative flex h-full w-full flex-col items-center justify-center gap-1">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`امکانات تور: ${toFa(tour.facilities.length)} مورد`}
        onClick={() =>
          setOpen((o) => {
            if (!o) {
              window.dispatchEvent(
                new CustomEvent(FACILITY_OPEN_EVT, { detail: cellId })
              );
            }
            return !o;
          })
        }
        className="flex h-full w-full flex-col items-center justify-center gap-1 outline-none max-sm:cursor-pointer max-sm:active:scale-95"
      >
        <span
          className={cn(
            "text-sm font-bold",
            isBest ? "text-emerald" : "text-foreground",
          )}
        >
          {toFa(tour.facilities.length)} مورد
        </span>
        <div className="pointer-events-none flex max-w-[120px] flex-wrap justify-center gap-0.5">
          {tour.facilities.slice(0, 2).map((f) => (
            <span
              key={f}
              className="rounded-full bg-secondary/80 px-1.5 py-0 text-[9px] font-semibold text-muted-foreground"
            >
              {f.length > 8 ? f.slice(0, 7) + "…" : f}
            </span>
          ))}
          {tour.facilities.length > 2 && (
            <span className="rounded-full bg-secondary/80 px-1.5 py-0 text-[9px] font-semibold text-muted-foreground">
              +{toFa(tour.facilities.length - 2)}
            </span>
          )}
        </div>
      </button>

      {/* Hover (desktop) / tap (touch) popover — full facilities list */}
      <div
        ref={popRef}
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-200 group-hover/facilities:translate-y-0 group-hover/facilities:opacity-100",
          open && "translate-y-0 opacity-100",
        )}
        style={
          open && shift !== 0
            ? { transform: `translate(calc(-50% + ${shift}px), 0)` }
            : undefined
        }
        role="tooltip"
      >
        <div className="rounded-2xl border border-border/60 bg-popover/95 p-3 shadow-2xl backdrop-blur-xl">
          <p className="mb-2 flex items-center gap-1.5 border-b border-border/40 pb-1.5 text-[11px] font-extrabold text-foreground">
            <Check className="h-3.5 w-3.5 text-emerald" />
            امکانات تور ({toFa(tour.facilities.length)} مورد)
          </p>
          <ul className="custom-scroll flex max-h-44 flex-col gap-1.5 overflow-y-auto">
            {tour.facilities.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-[11px] font-medium text-foreground"
              >
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald/15 text-emerald">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        {/* Arrow pointing down */}
        <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-border/60 bg-popover/95" />
      </div>
    </div>
  );
}

// Mutable refs so the leader render closure can call into the component
// without re-creating the ROWS array on every render. Set inside the
// component body below.
let setCompareOpenRef: ((open: boolean) => void) | null = null;
let goRef: ((view: string, params?: Record<string, string>) => void) | null = null;

// -- Best-value computation --------------------------------------------

function computeBest(items: Tour[]): Record<string, string | null> {
  const bestIds: Record<string, string | null> = {};
  for (const row of ROWS) {
    if (row.best === "none") continue;
    let bestTour: Tour | null = null;
    let bestVal: number | string | null = null;
    for (const t of items) {
      const v = row.value(t);
      if (bestVal === null) {
        bestVal = v;
        bestTour = t;
      } else if (row.best === "min" && typeof v === "number" && v < (bestVal as number)) {
        bestVal = v;
        bestTour = t;
      } else if (row.best === "max" && typeof v === "number" && v > (bestVal as number)) {
        bestVal = v;
        bestTour = t;
      }
    }
    // Only mark a "best" when there's a unique winner. Ties → no highlight
    // (avoids confusing users with multiple "winners" on equal values).
    if (bestTour) {
      const winners = items.filter((t) => row.value(t) === bestVal);
      bestIds[row.key] = winners.length === 1 ? bestTour.id : null;
    }
  }
  return bestIds;
}

// -- Component ----------------------------------------------------------

export function CompareDrawer() {
  const compareOpen = useNav((s) => s.compareOpen);
  const setCompareOpen = useNav((s) => s.setCompareOpen);
  const go = useGo();
  const { tourIds, remove, clear } = useCompare();
  const items = tours.filter((t) => tourIds.includes(t.id));

  // Wire the refs so ROWS' render closures can access live handlers.
  React.useEffect(() => {
    setCompareOpenRef = setCompareOpen;
    goRef = go;
    return () => {
      setCompareOpenRef = null;
      goRef = null;
    };
  }, [setCompareOpen, go]);

  const bestIds = React.useMemo(() => computeBest(items), [items]);

  // Count how many "best value" wins each tour has — used for the summary
  // badge on the winning column header.
  const winsByTour = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of ROWS) {
      if (row.best === "none") continue;
      const id = bestIds[row.key];
      if (id) counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [bestIds]);

  // Tour with the most "best value" wins gets a "بهترین انتخاب" crown badge
  // on its column header — only when there are 2+ tours and a unique winner.
  const overallWinnerId = React.useMemo(() => {
    if (items.length < 2) return null;
    let topId: string | null = null;
    let topCount = 0;
    let tied = false;
    for (const id of Object.keys(winsByTour)) {
      const c = winsByTour[id];
      if (c > topCount) {
        topCount = c;
        topId = id;
        tied = false;
      } else if (c === topCount && c > 0) {
        tied = true;
      }
    }
    return tied || !topId || topCount === 0 ? null : topId;
  }, [items.length, winsByTour]);

  return (
    <AnimatePresence>
      {compareOpen && (
        <>
          {/* Dimmed backdrop — closes on click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setCompareOpen(false)}
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
            aria-label="مقایسه تورها"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 py-3.5 backdrop-blur-xl md:px-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <GitCompare className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="flex items-center gap-2 text-base font-extrabold leading-tight md:text-lg">
                    مقایسه تورها
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                      {toFa(items.length)}
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground md:text-xs">
                    {items.length === 0
                      ? "توری انتخاب نشده است"
                      : items.length === 1
                        ? "یک تور دیگر اضافه کنید تا مقایسه فعال شود"
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
                  onClick={() => setCompareOpen(false)}
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
                <SingleTourHint
                  item={items[0]}
                  onView={() => {
                    setCompareOpen(false);
                    go("tour-detail", { id: items[0].id });
                  }}
                  onClose={setCompareOpen}
                />
              ) : (
                <ComparisonTable
                  items={items}
                  bestIds={bestIds}
                  winsByTour={winsByTour}
                  overallWinnerId={overallWinnerId}
                  onRemove={remove}
                  onView={(id) => {
                    setCompareOpen(false);
                    go("tour-detail", { id });
                  }}
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
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary/60">
        <GitCompare className="h-7 w-7 opacity-40" />
      </div>
      <div>
        <p className="font-bold text-foreground">توری برای مقایسه نیست</p>
        <p className="mt-1 text-xs">
          روی دکمه «مقایسه» هر تور بزنید تا اینجا اضافه شود.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          حداقل دو تور باید انتخاب شود تا جدول مقایسه فعال شود.
        </p>
      </div>
    </div>
  );
}

// -- Single-tour hint ---------------------------------------------------

function SingleTourHint({
  item,
  onView,
  onClose,
}: {
  item: Tour;
  onView: () => void;
  onClose: (open: boolean) => void;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center">
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
        <SmartImage
          src={item.images[0]}
          alt={item.title}
          fallback="tour"
          shimmer={false}
          aspectClass="h-14 w-14 rounded-xl"
          className="h-full w-full object-cover"
        />
        <div className="text-right">
          <p className="text-sm font-bold">{item.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {toFa(item.duration)} روز — {formatCurrency(item.discountPrice ?? item.price)}
          </p>
        </div>
      </div>
      <div className="max-w-xs text-center">
        <p className="text-sm font-bold text-foreground">یک تور دیگر اضافه کن</p>
        <p className="mt-1 text-xs text-muted-foreground">
          برای دیدن جدول مقایسه، حداقل به دو تور نیاز داری. این панل را ببند
          و روی دکمه «مقایسه» تور دیگری بزن.
        </p>
      </div>
      <div className="flex gap-2 max-sm:flex-wrap">
        <button
          onClick={onView}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-emerald-dark max-sm:min-h-11"
        >
          مشاهده این تور
        </button>
        <button
          onClick={() => onClose(false)}
          className="rounded-xl border border-border/60 px-4 py-2 text-xs font-bold text-muted-foreground transition hover:bg-secondary max-sm:min-h-11"
        >
          بستن و افزودن تور دیگر
        </button>
      </div>
    </div>
  );
}

// -- Comparison table ---------------------------------------------------

function ComparisonTable({
  items,
  bestIds,
  winsByTour,
  overallWinnerId,
  onRemove,
  onView,
}: {
  items: Tour[];
  bestIds: Record<string, string | null>;
  winsByTour: Record<string, number>;
  overallWinnerId: string | null;
  onRemove: (id: string) => void;
  onView: (id: string) => void;
}) {
  // Column width scales down as more tours are added so all stay visible
  // without scrolling on common viewport widths (up to 4 tours).
  const colWidth =
    items.length <= 2
      ? "min-w-[200px] w-[200px] sm:min-w-[240px] sm:w-[240px]"
      : items.length === 3
        ? "min-w-[170px] w-[170px] sm:min-w-[200px] sm:w-[200px]"
        : "min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px]";

  // FIXED row height — guarantees label rows and tour-cell rows are pixel-
  // aligned regardless of each cell's content height. Without this, cells
  // with 3 lines (e.g. price) were taller than cells with 1 line (e.g.
  // duration), causing rows to drift out of alignment across columns.
  // 72px comfortably fits the tallest cell (leader: avatar + name + rating).
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
        {/* Header spacer — same height as tour column headers */}
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

        {/* Row labels — FIXED height to match tour cells exactly */}
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

      {/* Tour columns */}
      <div className="flex gap-3">
        {items.map((t, idx) => {
          const isWinner = overallWinnerId === t.id;
          const wins = winsByTour[t.id] ?? 0;
          return (
            <motion.div
              key={t.id}
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
                  onClick={() => onView(t.id)}
                  className="group/img absolute inset-0 block"
                  aria-label={`مشاهده ${t.title}`}
                >
                  <SmartImage
                    src={t.images[0]}
                    alt={t.title}
                    fallback="tour"
                    shimmer={false}
                    fallbackLabel={CATEGORY_LABELS[t.category]}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/40 to-transparent" />
                </button>

                {/* Remove button */}
                <button
                  onClick={() => onRemove(t.id)}
                  aria-label={`حذف ${t.title}`}
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
                      تور {toFa(idx + 1)}
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
                  onClick={() => onView(t.id)}
                  className="absolute inset-x-0 bottom-0 z-10 block p-2 text-right"
                >
                  <h4 className="line-clamp-2 text-xs font-bold leading-tight text-cream">
                    {t.title}
                  </h4>
                </button>
              </div>

              {/* Feature rows — FIXED height to match label column exactly */}
              {ROWS.map((row, i) => {
                const isBest = bestIds[row.key] === t.id;
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
                    {row.render ? row.render(t, isBest) : null}
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
                  onClick={() => onView(t.id)}
                  className={cn(
                    "flex w-full items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition",
                    isWinner
                      ? "bg-gradient-to-br from-gold-light to-gold text-forest hover:brightness-105"
                      : "bg-primary text-primary-foreground hover:bg-emerald-dark",
                  )}
                >
                  مشاهده جزئیات
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* Trailing "add another" card */}
        {items.length < 4 && (
          <button
            onClick={() => {
              // Closing the drawer lets the user pick more tours from the
              // list — same UX as the previous design.
              useNav.getState().setCompareOpen(false);
            }}
            className={cn(
              "grid shrink-0 place-items-center rounded-2xl border-2 border-dashed border-border/60 bg-secondary/20 text-center text-muted-foreground transition hover:border-primary/40 hover:text-primary",
              colWidth,
            )}
          >
            <div>
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-secondary">
                <GitCompare className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold">تور دیگری اضافه کن</p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">
                تا {toFa(4 - items.length)} تور دیگر
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}


