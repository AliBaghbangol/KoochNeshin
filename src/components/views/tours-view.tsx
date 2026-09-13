"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  Star,
  Clock,
  Users,
  ArrowLeft,
  Crown,
  Flame,
  Tag,
  GitCompare,
  Check,
  Mountain,
  Sun,
  Palmtree,
  Landmark,
  TreePine,
  RotateCcw,
  MapPin,
  Compass,
  Heart,
} from "lucide-react";
import { tours } from "@/mocks/tours";
import { useAllTours } from "@/hooks/use-all-tours";
import { useGo } from "@/lib/use-go";
import { useViewParams } from "@/lib/use-view-params";
import { useCompare } from "@/store/compare-store";
import { useWishlist } from "@/store/wishlist-store";
import { useFilters } from "@/store/filter-store";
import {
  toFa,
  formatCurrency,
  toPersianShortDate,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from "@/lib/format";
import {
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/animations/scroll-reveal";
import { TiltCard } from "@/components/animations/tilt-card";
import { MagneticButton } from "@/components/animations/magnetic-button";
import { HeartBurst } from "@/components/animations/heart-burst";
import { SmartImage } from "@/components/common/smart-image";
import { FitScoreBadge } from "@/components/fit-score/fit-score-badge";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { cn } from "@/lib/utils";
import {
  tourFillRatio,
  fillColor,
  capacityLevel,
  levelTextClass,
} from "@/lib/capacity";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Tour, TourCategory, Difficulty } from "@/types";

const CATEGORY_ICONS: Record<TourCategory, typeof Mountain> = {
  mountain: Mountain,
  desert: Sun,
  coastal: Palmtree,
  historical: Landmark,
  forest: TreePine,
};

const CATEGORY_COLORS: Record<TourCategory, string> = {
  mountain: "text-emerald bg-emerald/10",
  desert: "text-sunset bg-sunset/10",
  coastal: "text-emerald-light bg-emerald-light/10",
  historical: "text-gold bg-gold/10",
  forest: "text-emerald-dark bg-emerald-dark/10",
};

const SORT_OPTIONS: { value: "popular" | "price-asc" | "price-desc" | "rating" | "duration"; label: string }[] = [
  { value: "popular", label: "محبوب‌ترین" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
  { value: "rating", label: "بالاترین امتیاز" },
  { value: "duration", label: "کوتاه‌ترین مدت" },
];

const PRICE_CEILING = 5_000_000;
const DURATION_MAX = 15;

// --- List card -----------------------------------------------------------

function BadgeChip({ type }: { type: string }) {
  const map: Record<string, { icon: typeof Crown; cls: string }> = {
    "برترین لیدر": { icon: Crown, cls: "bg-gold/15 text-gold border-gold/30" },
    پرطرفدارترین: { icon: Flame, cls: "bg-sunset/15 text-sunset border-sunset/30" },
    "بهترین قیمت": { icon: Tag, cls: "bg-emerald/15 text-emerald border-emerald/30" },
    "تجربه لوکس": { icon: Crown, cls: "bg-gold/15 text-gold border-gold/30" },
    "تجربه خاص": { icon: Flame, cls: "bg-sunset/15 text-sunset border-sunset/30" },
  };
  const cfg = map[type] ?? { icon: Star, cls: "bg-secondary text-foreground border-border" };
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold backdrop-blur", cfg.cls)}>
      <Icon className="h-3 w-3" />
      {type}
    </span>
  );
}

function RichTourCard({ tour, listView }: { tour: Tour; listView?: boolean }) {
  const go = useGo();
  const toggle = useCompare((s) => s.toggle);
  const toggleWishlist = useWishlist((s) => s.toggle);
  // Mount gate — persisted-store visuals must match the server on the
  // hydration render (see useMounted / app-shell rehydrate race).
  const mounted = useMounted();
  const comparedRaw = useCompare((s) => s.tourIds.includes(tour.id));
  const favRaw = useWishlist((s) => s.tourIds.includes(tour.id));
  const isCompared = mounted && comparedRaw;
  const isFav = mounted && favRaw;
  const discount = tour.discountPrice
    ? Math.round((1 - tour.discountPrice / tour.price) * 100)
    : 0;
  const left = tour.capacity - tour.reservedCount;
  const fillPct = (tour.reservedCount / tour.capacity) * 100;
  // Shared green→red availability scale (1 = fully booked)
  const fillRatio = tourFillRatio(tour.reservedCount, tour.capacity);
  const capLevel = capacityLevel(fillRatio);
  const isFull = left <= 0;
  const finalPrice = tour.discountPrice ?? tour.price;
  const CatIcon = CATEGORY_ICONS[tour.category];
  const diff = tour.difficulty;

  if (listView) {
    return (
      <motion.div variants={staggerItem}>
        <div
          onClick={() => go("tour-detail", { id: tour.id })}
          className="group grid cursor-pointer grid-cols-[140px_1fr] gap-4 overflow-hidden rounded-3xl border bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 dark:hover:border-gold/50 dark:hover:shadow-gold/15 max-sm:grid-cols-1 md:grid-cols-[200px_1fr] md:p-4"
        >
          {/* max-sm: image becomes a full-width top banner in stacked list mode */}
          <div className="relative h-full min-h-[140px] overflow-hidden rounded-2xl max-sm:h-44">
            <SmartImage
              src={tour.images[0]}
              alt={tour.title}
              fallback="tour"
              fallbackLabel={CATEGORY_LABELS[tour.category]}
              className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/50 to-transparent" />
            {discount > 0 && (
              <div className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold text-white shadow-lg">
                {toFa(discount)}٪
              </div>
            )}
            <div className="absolute bottom-2 right-2">
              <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur", CATEGORY_COLORS[tour.category], "bg-background/80")}>
                <CatIcon className="h-3 w-3" />
                {CATEGORY_LABELS[tour.category]}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  {tour.badges?.slice(0, 2).map((b) => (
                    <BadgeChip key={b} type={b} />
                  ))}
                </div>
                <h3 className="line-clamp-1 text-base font-bold leading-7 transition group-hover:text-gold dark:group-hover:text-gold-light md:text-lg">
                  {tour.title}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {tour.destination}، {tour.province}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-2">
                <IconTooltip label={isFav ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"} side="left">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(tour.id);
                    }}
                    aria-label="افزودن به علاقه‌مندی"
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-full border transition",
                      isFav
                        ? "border-sunset bg-sunset text-white shadow-md shadow-sunset/30"
                        : "border-border bg-background text-muted-foreground hover:border-sunset hover:text-sunset"
                    )}
                  >
                    <HeartBurst active={isFav}>
                      <Heart className={cn("h-[18px] w-[18px] transition", isFav && "fill-current")} />
                    </HeartBurst>
                  </button>
                </IconTooltip>
                <IconTooltip label={isCompared ? "حذف از مقایسه" : "افزودن به مقایسه"} side="left">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(tour.id);
                    }}
                    aria-label="مقایسه"
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-full border transition",
                      isCompared
                        ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                    )}
                  >
                    {isCompared ? <Check className="h-[18px] w-[18px]" /> : <GitCompare className="h-[18px] w-[18px]" />}
                  </button>
                </IconTooltip>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-emerald" />
                {toFa(tour.duration)} روز
              </span>
              <span className="flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-sunset" />
                {toPersianShortDate(tour.startDate)}
              </span>
              <span className={cn("flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold", DIFFICULTY_COLORS[diff])}>
                {DIFFICULTY_LABELS[diff]}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                <b className="text-foreground">{toFa(tour.rating)}</b>
                <span className="text-[10px]">({toFa(tour.reviewsCount)})</span>
              </span>
            </div>

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
            </div>

            <div className="mt-auto flex items-end justify-between gap-2 pt-3 max-sm:flex-wrap">
              <div>
                <div className="mb-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      "flex min-w-24 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold",
                      isFull ? "bg-accent/10" : "bg-secondary/80"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span className={cn(levelTextClass(isFull ? "full" : capLevel), isFull && "font-bold")}>
                      {isFull ? "تکمیل ظرفیت" : `${toFa(left)} نفر باقی مانده`}
                    </span>
                  </span>
                  <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-secondary sm:block">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${fillPct}%`, backgroundColor: fillColor(fillRatio) }}
                    />
                  </div>
                </div>
                {tour.discountPrice && (
                  <p className="text-[11px] text-muted-foreground line-through">
                    {formatCurrency(tour.price)}
                  </p>
                )}
                <p className="font-extrabold text-primary transition group-hover:text-gold dark:group-hover:text-gold-light">{formatCurrency(finalPrice)}</p>
                <p className="text-[10px] text-muted-foreground">برای هر نفر</p>
              </div>
              <MagneticButton
                strength={0.2}
                onClick={() => go("tour-detail", { id: tour.id })}
                className={cn(
                  "items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition",
                  "bg-primary text-primary-foreground",
                  "group-hover:bg-gradient-to-br group-hover:from-gold group-hover:to-gold-light group-hover:text-forest",
                  "group-hover:shadow-lg group-hover:shadow-gold/30",
                  "max-sm:px-4 max-sm:py-2.5",
                )}
              >
                مشاهده
                <ArrowLeft className="h-3.5 w-3.5" />
              </MagneticButton>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <TiltCard className="h-full" max={6}>
      <motion.div
        variants={staggerItem}
        onClick={() => go("tour-detail", { id: tour.id })}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 dark:hover:border-gold/50 dark:hover:shadow-gold/15"
      >
        <div className="relative h-56 overflow-hidden">
          <SmartImage
            src={tour.images[0]}
            alt={tour.title}
            fallback="tour"
            fallbackLabel={CATEGORY_LABELS[tour.category]}
            className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-forest/10 to-transparent" />
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            <FitScoreBadge tour={tour} />
            {tour.badges?.map((b) => (
              <BadgeChip key={b} type={b} />
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
          <IconTooltip label={isCompared ? "حذف از مقایسه" : "افزودن به مقایسه"} side="right">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle(tour.id);
              }}
              className={cn(
                "absolute bottom-3 left-3 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold backdrop-blur transition",
                isCompared
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-cream/30 bg-cream/10 text-cream hover:bg-cream/20"
              )}
            >
              {isCompared ? <Check className="h-3 w-3" /> : <GitCompare className="h-3 w-3" />}
              مقایسه
            </button>
          </IconTooltip>
          <div className="absolute bottom-3 right-3">
            <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-cream backdrop-blur", "bg-forest/60")}>
              <CatIcon className="h-3 w-3" />
              {CATEGORY_LABELS[tour.category]}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {toFa(tour.duration)} روز
            </span>
            <span className="flex items-center gap-1">
              <Compass className="h-3.5 w-3.5" />
              {toPersianShortDate(tour.startDate)}
            </span>
          </div>

          <h3 className="line-clamp-2 min-h-14 font-bold leading-7 transition group-hover:text-gold dark:group-hover:text-gold-light">
            {tour.title}
          </h3>

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

          <div className="mb-4 mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                ظرفیت
              </span>
              <span className={cn("font-bold", levelTextClass(isFull ? "full" : capLevel))}>
                {isFull
                  ? "تکمیل ظرفیت!"
                  : left <= 3
                    ? `تنها ${toFa(left)} نفر مانده!`
                    : `${toFa(left)} نفر باقی`}
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

          <div className="mt-auto flex items-end justify-between border-t pt-3 transition group-hover:border-gold/30">
            <div>
              {/* fixed-height slot keeps the final price on the same baseline
                  across cards with and without a discount (user report:
                  «قیمت کارت‌ها تراز نیست») */}
              <div className="min-h-4">
                {tour.discountPrice && (
                  <p className="text-[11px] text-muted-foreground line-through">
                    {formatCurrency(tour.price)}
                  </p>
                )}
              </div>
              <p className="font-extrabold text-primary transition group-hover:text-gold dark:group-hover:text-gold-light">
                {formatCurrency(finalPrice)}
              </p>
              <p className="text-[10px] text-muted-foreground">برای هر نفر</p>
            </div>
            <MagneticButton
              strength={0.25}
              onClick={() => go("tour-detail", { id: tour.id })}
              className={cn(
                "items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition",
                "bg-primary text-primary-foreground",
                "group-hover:bg-gradient-to-br group-hover:from-gold group-hover:to-gold-light group-hover:text-forest",
                "group-hover:shadow-lg group-hover:shadow-gold/30",
                "max-sm:px-4 max-sm:py-2.5",
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

function TourCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <div className="shimmer-bg h-56 w-full" />
      <div className="space-y-3 p-4">
        <div className="shimmer-bg h-3 w-1/3 rounded" />
        <div className="shimmer-bg h-4 w-full rounded" />
        <div className="shimmer-bg h-4 w-2/3 rounded" />
        <div className="shimmer-bg h-6 w-full rounded-full" />
        <div className="shimmer-bg h-8 w-1/2 rounded" />
      </div>
    </div>
  );
}

// --- Filter panel --------------------------------------------------------

const CATEGORIES: TourCategory[] = ["mountain", "desert", "coastal", "historical", "forest"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function FilterPanelContent({ closeSheet }: { closeSheet?: () => void }) {
  const f = useFilters();
  const uniqueProvinces = React.useMemo(
    () => Array.from(new Set(tours.map((t) => t.province))).sort(),
    []
  );

  const activeCount =
    (f.search ? 1 : 0) +
    f.categories.length +
    f.difficulties.length +
    f.provinces.length +
    (f.minPrice > 0 || f.maxPrice < PRICE_CEILING ? 1 : 0) +
    (f.minDuration > 0 || f.maxDuration < DURATION_MAX ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label>جستجو</Label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={f.search}
            onChange={(e) => f.setSearch(e.target.value)}
            placeholder="نام تور، مقصد..."
            className="rounded-xl bg-background pr-9"
          />
        </div>
      </div>

      {/* Category */}
      <FilterSection icon={<Compass className="h-4 w-4" />} title="دسته‌بندی">
        <div className="space-y-1.5">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            const checked = f.categories.includes(c);
            return (
              <label
                key={c}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition",
                  checked ? "bg-primary/5" : "hover:bg-secondary/60"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => f.toggleCategory(c)}
                />
                <span className={cn("grid h-6 w-6 place-items-center rounded-md", CATEGORY_COLORS[c])}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium">{CATEGORY_LABELS[c]}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Difficulty */}
      <FilterSection icon={<Mountain className="h-4 w-4" />} title="سختی">
        <div className="space-y-1.5">
          {DIFFICULTIES.map((d) => {
            const checked = f.difficulties.includes(d);
            return (
              <label
                key={d}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition",
                  checked ? "bg-primary/5" : "hover:bg-secondary/60"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => f.toggleDifficulty(d)}
                />
                <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-bold", DIFFICULTY_COLORS[d])}>
                  {DIFFICULTY_LABELS[d]}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Province */}
      <FilterSection icon={<MapPin className="h-4 w-4" />} title="استان">
        <div className="space-y-1.5">
          {uniqueProvinces.map((p) => {
            const checked = f.provinces.includes(p);
            const count = tours.filter((t) => t.province === p).length;
            return (
              <label
                key={p}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-sm transition",
                  checked ? "bg-primary/5" : "hover:bg-secondary/60"
                )}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => f.toggleProvince(p)}
                  />
                  <span className="font-medium">{p}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{toFa(count)}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Price range — RTL slider (global DirectionProvider): min sits on the
          RIGHT, max on the LEFT; dragging leftwards increases the value. */}
      <FilterSection icon={<Tag className="h-4 w-4" />} title="بازه قیمت">
        <div className="mb-3 flex items-center justify-between text-xs font-bold">
          <span className="text-primary">{formatCurrency(f.minPrice)}</span>
          <span className="text-muted-foreground">تا</span>
          <span className="text-primary">
            {f.maxPrice >= PRICE_CEILING ? "نامحدود" : formatCurrency(f.maxPrice)}
          </span>
        </div>
        <Slider
          value={[f.minPrice, Math.min(f.maxPrice, PRICE_CEILING)]}
          min={0}
          max={PRICE_CEILING}
          step={100_000}
          onValueChange={([a, b]) => f.setPriceRange(a, b)}
          className="[&_span[data-slot=slider-thumb]]:border-emerald dark:[&_span[data-slot=slider-thumb]]:border-gold dark:[&_span[data-slot=slider-thumb]]:shadow-[0_0_8px_rgba(212,175,55,0.45)]"
        />
      </FilterSection>

      {/* Duration range — same RTL orientation as the price slider */}
      <FilterSection icon={<Clock className="h-4 w-4" />} title="مدت تور (روز)">
        <div className="mb-3 flex items-center justify-between text-xs font-bold">
          <span className="text-primary">{toFa(f.minDuration)} روز</span>
          <span className="text-muted-foreground">تا</span>
          <span className="text-primary">
            {f.maxDuration >= DURATION_MAX ? `${toFa(DURATION_MAX)}+ روز` : `${toFa(f.maxDuration)} روز`}
          </span>
        </div>
        <Slider
          value={[f.minDuration, Math.min(f.maxDuration, DURATION_MAX)]}
          min={0}
          max={DURATION_MAX}
          step={1}
          onValueChange={([a, b]) => f.setDurationRange(a, b)}
          className="[&_span[data-slot=slider-thumb]]:border-emerald dark:[&_span[data-slot=slider-thumb]]:border-gold dark:[&_span[data-slot=slider-thumb]]:shadow-[0_0_8px_rgba(212,175,55,0.45)]"
        />
      </FilterSection>

      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          className="flex-1 gap-1.5 rounded-xl border-gold/40 text-gold transition-colors hover:border-gold hover:bg-gold/10 hover:text-gold-light dark:hover:border-gold dark:hover:bg-gold/15 dark:hover:text-gold-light max-sm:min-h-11"
          onClick={() => f.reset()}
        >
          <RotateCcw className="h-4 w-4" />
          پاک کردن فیلترها
        </Button>
        {closeSheet && (
          <Button className="flex-1 gap-1.5 rounded-xl bg-primary text-primary-foreground max-sm:min-h-11" onClick={closeSheet}>
            <Check className="h-4 w-4" />
            مشاهده نتایج
          </Button>
        )}
      </div>

      {activeCount > 0 && !closeSheet && (
        <p className="text-center text-[11px] text-muted-foreground">
          {toFa(activeCount)} فیلتر فعال
        </p>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function FilterSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

// --- Main view -----------------------------------------------------------

export function ToursView() {
  const params = useViewParams();
  const f = useFilters();
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  // Use the merged tours hook (published drafts + mock seed)
  const allTours = useAllTours();

  // Apply filters from nav params — re-runs when params change (SPA view-switch safe)
  React.useEffect(() => {
    if (params.destination) {
      f.setSearch(params.destination);
    }
    if (params.province && !f.provinces.includes(params.province)) {
      f.toggleProvince(params.province);
    }
    if (
      params.category &&
      CATEGORIES.includes(params.category as TourCategory) &&
      !f.categories.includes(params.category as TourCategory)
    ) {
      f.toggleCategory(params.category as TourCategory);
    }
  }, [params.destination, params.province, params.category]);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const filtered = React.useMemo(() => {
    let list = allTours.filter((t) => {
      if (f.search) {
        const q = f.search.trim();
        if (
          !t.title.includes(q) &&
          !t.destination.includes(q) &&
          !t.province.includes(q) &&
          !t.leader.fullName.includes(q)
        ) {
          return false;
        }
      }
      if (f.categories.length && !f.categories.includes(t.category)) return false;
      if (f.difficulties.length && !f.difficulties.includes(t.difficulty)) return false;
      if (f.provinces.length && !f.provinces.includes(t.province)) return false;
      const price = t.discountPrice ?? t.price;
      if (price < f.minPrice) return false;
      if (f.maxPrice < PRICE_CEILING && price > f.maxPrice) return false;
      if (t.duration < f.minDuration) return false;
      if (f.maxDuration < DURATION_MAX && t.duration > f.maxDuration) return false;
      return true;
    });

    list = list.sort((a, b) => {
      switch (f.sortBy) {
        case "price-asc":
          return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
        case "price-desc":
          return (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price);
        case "rating":
          return b.rating - a.rating;
        case "duration":
          return a.duration - b.duration;
        default:
          return b.reviewsCount - a.reviewsCount;
      }
    });
    return list;
  }, [f.search, f.categories, f.difficulties, f.provinces, f.minPrice, f.maxPrice, f.minDuration, f.maxDuration, f.sortBy, allTours]);

  const activeCount =
    (f.search ? 1 : 0) +
    f.categories.length +
    f.difficulties.length +
    f.provinces.length +
    (f.minPrice > 0 || f.maxPrice < PRICE_CEILING ? 1 : 0) +
    (f.minDuration > 0 || f.maxDuration < DURATION_MAX ? 1 : 0);

  return (
    <div className="relative min-h-screen pb-32 pt-24 md:pt-28">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-emerald/10 blur-3xl" />
        <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-sunset/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <ScrollReveal y={20} className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald/10 text-emerald">
                  <Compass className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald">
                  کاوش تورهای ایران
                </span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
                سفر را <span className="text-gradient-emerald">انتخاب</span> کن،
                <br className="hidden md:block" />
                تورها را <span className="text-gradient-sunset">مقایسه</span> کن
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {loading ? "در حال بارگذاری..." : (
                  <>
                    <b className="text-foreground">{toFa(filtered.length)}</b> تور از{" "}
                    <b className="text-foreground">{toFa(new Set(filtered.map((t) => t.destination)).size)}</b> مقصد
                    {activeCount > 0 && (
                      <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {toFa(activeCount)} فیلتر فعال
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            {/* Mobile filter trigger */}
            <div className="flex items-center gap-2 md:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-1.5 rounded-xl max-sm:h-11 max-sm:px-5">
                    <SlidersHorizontal className="h-4 w-4" />
                    فیلتر
                    {activeCount > 0 && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {toFa(activeCount)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85%] max-w-sm overflow-y-auto p-4">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-lg">فیلترها</SheetTitle>
                  </SheetHeader>
                  <FilterPanelContent closeSheet={() => setSheetOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sidebar — desktop. NO inner scroll anywhere (user request):
              the panel is a normal block that scrolls with the page; the
              province list is fully expanded. */}
          <aside className="hidden lg:block">
            <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <SlidersHorizontal className="h-4 w-4" />
                  </span>
                  فیلترها
                </h3>
                {activeCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {toFa(activeCount)}
                  </span>
                )}
              </div>
              <FilterPanelContent />
            </div>
          </aside>

          {/* Main */}
          <div>
            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 p-3 backdrop-blur">
              <div className="flex items-center gap-2 max-sm:w-full">
                <span className="text-sm text-muted-foreground">مرتب‌سازی:</span>
                <Select value={f.sortBy} onValueChange={(v) => f.setSortBy(v as typeof f.sortBy)}>
                  <SelectTrigger className="h-9 w-40 rounded-xl bg-background max-sm:flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 max-sm:flex-1">
                <button
                  onClick={() => setView("grid")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition max-sm:min-h-11 max-sm:flex-1 max-sm:justify-center",
                    view === "grid" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  شبکه‌ای
                </button>
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition max-sm:min-h-11 max-sm:flex-1 max-sm:justify-center",
                    view === "list" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <ListIcon className="h-4 w-4" />
                  لیستی
                </button>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className={cn(
                "grid gap-6",
                view === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TourCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState onReset={() => f.reset()} />
            ) : (
              <StaggerGroup
                key={view}
                animate
                className={cn(
                  "grid gap-6",
                  view === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {filtered.map((t) => (
                  <RichTourCard key={t.id} tour={t} listView={view === "list"} />
                ))}
              </StaggerGroup>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-card/50 px-6 py-20 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse rounded-full bg-sunset/10 blur-2xl" />
        <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald/10 to-sunset/10">
          <Compass className="h-10 w-10 text-muted-foreground/60" />
        </div>
      </div>
      <h3 className="mb-1 text-xl font-bold">توری با این فیلترها پیدا نشد</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        لطفاً فیلترها را تغییر دهید یا بازنشانی کنید تا تورهای بیشتری را ببینید.
      </p>
      <Button onClick={onReset} className="gap-2 rounded-xl bg-primary text-primary-foreground">
        <RotateCcw className="h-4 w-4" />
        پاک کردن فیلترها
      </Button>
    </div>
  );
}
