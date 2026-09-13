"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Star,
  Clock,
  Users,
  ArrowLeft,
  Crown,
  Flame,
  Tag,
  GitCompare,
  Check,
  Sparkles,
  Trophy,
  Heart,
} from "lucide-react";
import { tours } from "@/mocks/tours";
import { useAllTours } from "@/hooks/use-all-tours";
import { useGo } from "@/lib/use-go";
import { useCompare } from "@/store/compare-store";
import { useWishlist } from "@/store/wishlist-store";
import { useNav } from "@/store/nav-store";
import { IconTooltip } from "@/components/common/icon-tooltip";
import {
  tourFillRatio,
  fillColor,
  capacityLevel,
  levelTextClass,
} from "@/lib/capacity";
import {
  toFa,
  formatCurrency,
  toPersianShortDate,
  CATEGORY_LABELS,
} from "@/lib/format";
import { ScrollReveal, staggerItem } from "@/components/animations/scroll-reveal";
import { TiltCard } from "@/components/animations/tilt-card";
import { MagneticButton } from "@/components/animations/magnetic-button";
import { HeartBurst } from "@/components/animations/heart-burst";
import { SmartImage } from "@/components/common/smart-image";
import { FitScoreBadge } from "@/components/fit-score/fit-score-badge";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

/**
 * Category-based theming for the small category badge on tour cards.
 * Each tour category gets a distinct accent color so users can spot the
 * tour type at a glance.
 */
const CATEGORY_THEME: Record<string, { bg: string; text: string; border: string }> = {
  mountain: { bg: "bg-emerald", text: "text-cream", border: "border-emerald-dark" },
  forest: { bg: "bg-emerald-dark", text: "text-cream", border: "border-emerald" },
  desert: { bg: "bg-sunset", text: "text-white", border: "border-sunset-dark" },
  coastal: { bg: "bg-teal-500", text: "text-white", border: "border-teal-600" },
  historical: { bg: "bg-gold", text: "text-forest", border: "border-gold-light" },
};

type BadgeStyle = {
  icon: typeof Crown;
  label: string;
  /** outer chip classes: gradient, text color, border, glow */
  cls: string;
  /** extra wrapper classes for animations / shimmer */
  wrapper?: string;
  /** whether to render a shimmer overlay */
  shimmer?: boolean;
};

function Badge({ type }: { type: string }) {
  const map: Record<string, BadgeStyle> = {
    "برترین لیدر": {
      icon: Crown,
      label: "برترین لیدر",
      // gold gradient with dark text + glow
      cls: "border-gold/40 bg-gradient-to-br from-gold-light to-gold text-forest shadow-[0_4px_16px_-4px_rgba(217,169,78,0.7)]",
    },
    پرطرفدارترین: {
      icon: Flame,
      label: "داغ",
      // sunset/orange gradient + pulse animation
      cls: "border-sunset/50 bg-gradient-to-br from-sunset-light to-sunset-dark text-white shadow-[0_4px_18px_-4px_rgba(232,98,44,0.7)]",
      wrapper: "animate-pulse",
    },
    "بهترین قیمت": {
      icon: Tag,
      label: "ارزان",
      // emerald gradient + white text
      cls: "border-emerald/50 bg-gradient-to-br from-emerald-light to-emerald-dark text-white shadow-[0_4px_16px_-4px_rgba(15,107,74,0.65)]",
    },
    "تجربه لوکس": {
      icon: Sparkles,
      label: "لوکس",
      // gold with shimmer
      cls: "border-gold/40 bg-gradient-to-br from-gold to-gold-light text-forest shadow-[0_4px_18px_-4px_rgba(217,169,78,0.65)]",
      shimmer: true,
    },
    "تجربه خاص": {
      icon: Trophy,
      label: "خاص",
      // sunset with shimmer
      cls: "border-sunset/50 bg-gradient-to-br from-sunset to-sunset-dark text-white shadow-[0_4px_18px_-4px_rgba(232,98,44,0.65)]",
      shimmer: true,
    },
  };
  const cfg: BadgeStyle =
    map[type] ?? {
      icon: Star,
      label: type,
      cls: "border-border bg-secondary text-secondary-foreground",
    };
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-1 text-[11px] font-extrabold backdrop-blur-sm",
        cfg.cls,
        cfg.wrapper,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="relative z-10 whitespace-nowrap">{cfg.label}</span>
      {cfg.shimmer && (
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2.2s_linear_infinite]"
        />
      )}
    </span>
  );
}

function TourCard({ tour }: { tour: (typeof tours)[number] }) {
  const go = useGo();
  const { toggle, has } = useCompare();
  const { toggle: toggleWishlist, has: hasWishlist } = useWishlist();
  // Persisted-store visuals are gated behind mount (see useMounted) so the
  // hydration render always matches the server, even when this Suspense-
  // deferred section hydrates after the app-shell rehydrate() effect ran.
  const mounted = useMounted();
  const isCompared = mounted && has(tour.id);
  const isFav = mounted && hasWishlist(tour.id);
  const discount = tour.discountPrice
    ? Math.round((1 - tour.discountPrice / tour.price) * 100)
    : 0;
  const left = tour.capacity - tour.reservedCount;
  const fillPct = (tour.reservedCount / tour.capacity) * 100;
  // Shared green→red availability scale (same language as /tours cards)
  const fillRatio = tourFillRatio(tour.reservedCount, tour.capacity);
  const capLevel = capacityLevel(fillRatio);
  const isFull = left <= 0;

  return (
    <TiltCard className="h-full" max={6}>
      <motion.div
        variants={staggerItem}
        onClick={() => go("tour-detail", { id: tour.id })}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 dark:hover:border-gold/50 dark:hover:shadow-gold/15"
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <SmartImage
            src={tour.images[0]}
            alt={tour.title}
            fallback="tour"
            fallbackLabel={CATEGORY_LABELS[tour.category]}
            className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
          {/* Badges */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            <FitScoreBadge tour={tour} />
            {tour.badges?.map((b) => (
              <Badge key={b} type={b} />
            ))}
          </div>
          {/* Wishlist button (top-left) */}
          <IconTooltip label={isFav ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"} side="right">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(tour.id);
              }}
              aria-label="افزودن به علاقه‌مندی"
              className={cn(
                "absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition-all duration-300",
                "max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']",
                isFav
                  ? "bg-sunset text-white shadow-md shadow-sunset/30"
                  : "bg-cream/80 text-forest hover:bg-cream hover:scale-110"
              )}
            >
              <HeartBurst active={isFav}>
                <Heart className={cn("h-4 w-4 transition", isFav && "fill-current")} />
              </HeartBurst>
            </button>
          </IconTooltip>
          {discount > 0 && (
            <div className="absolute left-3 top-14 rounded-full bg-accent px-2 py-1 text-xs font-extrabold text-white shadow-lg">
              {toFa(discount)}٪ تخفیف
            </div>
          )}
          {/* Compare checkbox */}
          <IconTooltip label={isCompared ? "حذف از مقایسه" : "افزودن به مقایسه"} side="right">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle(tour.id);
                useNav.getState().setCompareOpen(true);
              }}
              className={cn(
                "absolute bottom-3 left-3 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold backdrop-blur transition",
                "max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']",
                isCompared
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-cream/30 bg-cream/10 text-cream hover:bg-cream/20"
              )}
            >
              {isCompared ? <Check className="h-3 w-3" /> : <GitCompare className="h-3 w-3" />}
              مقایسه
            </button>
          </IconTooltip>
          {/* Category — themed by tour type */}
          <div className="absolute bottom-3 right-3">
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm",
                CATEGORY_THEME[tour.category]?.bg ?? "bg-forest",
                CATEGORY_THEME[tour.category]?.text ?? "text-cream",
                CATEGORY_THEME[tour.category]?.border,
              )}
            >
              {CATEGORY_LABELS[tour.category]}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {toFa(tour.duration)} روز
            </span>
            <span>{toPersianShortDate(tour.startDate)}</span>
          </div>

          <h3 className="line-clamp-2 font-bold leading-7 transition group-hover:text-gold dark:group-hover:text-gold-light">
            {tour.title}
          </h3>

          {/* Leader */}
          <div className="mt-3 flex items-center gap-2">
            <SmartImage
              src={tour.leader.avatar}
              alt={tour.leader.fullName}
              fallback="avatar"
              shimmer={false}
              aspectClass="h-7 w-7 shrink-0 rounded-full ring-2 ring-gold/30 transition group-hover:ring-gold/60"
              className="h-full w-full object-cover"
            />
            <div className="flex-1 text-xs">
              <p className="font-semibold transition group-hover:text-gold dark:group-hover:text-gold-light">{tour.leader.fullName}</p>
              <p className="text-[10px] text-muted-foreground">
                {toFa(tour.leader.experienceYears)} سال تجربه
              </p>
            </div>
            <span className="flex items-center gap-0.5 text-xs font-bold transition group-hover:text-gold dark:group-hover:text-gold-light">
              <Star className="h-3.5 w-3.5 fill-gold text-gold transition group-hover:scale-110" />
              {toFa(tour.rating)}
            </span>
          </div>

          {/* Capacity bar */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                ظرفیت
              </span>
              <span
                className={cn(
                  "font-bold",
                  levelTextClass(isFull ? "full" : capLevel)
                )}
              >
                {isFull ? "تکمیل ظرفیت!" : left <= 3 ? `تنها ${toFa(left)} نفر مانده!` : `${toFa(left)} نفر باقی`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${fillPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: fillColor(fillRatio) }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-end justify-between border-t pt-3 transition group-hover:border-gold/30">
            <div>
              {tour.discountPrice && (
                <p className="text-[11px] text-muted-foreground line-through">
                  {formatCurrency(tour.price)}
                </p>
              )}
              <p className="font-extrabold text-primary transition group-hover:text-gold dark:group-hover:text-gold-light">
                {formatCurrency(tour.discountPrice ?? tour.price)}
              </p>
              <p className="text-[10px] text-muted-foreground">برای هر نفر</p>
            </div>
            <MagneticButton
              strength={0.25}
              className={cn(
                "relative max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']",
                "items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition",
                "bg-primary text-primary-foreground",
                "group-hover:bg-gradient-to-br group-hover:from-gold group-hover:to-gold-light group-hover:text-forest",
                "group-hover:shadow-lg group-hover:shadow-gold/30",
              )}
            >
              مشاهده
              <ArrowLeft className="h-3.5 w-3.5" />
            </MagneticButton>
          </div>
        </div>
      </motion.div>
    </TiltCard>
  );
}

export function HotTours() {
  const go = useGo();
  const allTours = useAllTours();
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (dir: "next" | "prev") => {
    if (!scrollerRef.current) return;
    const w = scrollerRef.current.clientWidth * 0.8;
    // RTL: "next" (visual left) scrolls negative
    scrollerRef.current.scrollBy({
      left: dir === "next" ? -w : w,
      behavior: "smooth",
    });
  };

  // Top-rated tours + discounted ones, sorted
  const hot = [...allTours]
    .sort(
      (a, b) =>
        b.rating - a.rating || b.reviewsCount - a.reviewsCount
    )
    .slice(0, 6);

  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-sunset/10 text-sunset">
                <Flame className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-sunset">
                تورهای داغ این هفته
              </span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">
              تورهای پرطرفدار را <br className="hidden md:block" />
              <span className="text-gradient-sunset">مقایسه</span> و انتخاب کن
            </h2>
          </div>
          {/* Arrow buttons — left side of the header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("prev")}
              className="grid h-11 w-11 place-items-center rounded-full border bg-background transition hover:border-primary hover:text-primary"
              aria-label="قبلی"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </button>
            <button
              onClick={() => scroll("next")}
              className="grid h-11 w-11 place-items-center rounded-full border bg-background transition hover:border-primary hover:text-primary"
              aria-label="بعدی"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </ScrollReveal>

        {/* Horizontal scroller */}
        <div className="relative">
          <div
            ref={scrollerRef}
            className="custom-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 scrollbar-hide"
          >
            {hot.map((t) => (
              <div key={t.id} className="w-72 max-sm:w-[78vw] shrink-0 snap-start sm:w-80">
                <TourCard tour={t} />
              </div>
            ))}
            {/* End card — all tours */}
            <button
              onClick={() => go("tours")}
              className="grid w-72 max-sm:w-[78vw] shrink-0 snap-start place-items-center rounded-3xl border-2 border-dashed border-sunset/30 bg-sunset/5 text-center sm:w-80"
            >
              <div>
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-sunset/10 text-sunset">
                  <ArrowLeft className="h-6 w-6" />
                </div>
                <p className="font-bold text-sunset">همه تورها</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export { TourCard };
