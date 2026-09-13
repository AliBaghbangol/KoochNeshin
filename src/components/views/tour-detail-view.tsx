"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Star,
  Clock,
  Users,
  Calendar,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Crown,
  Flame,
  Tag,
  GitCompare,
  Check,
  Heart,
  Share2,
  ShieldCheck,
  Mountain,
  Sun,
  Palmtree,
  Landmark,
  TreePine,
  Trophy,
  TrendingUp,
  Camera,
  ChevronLeft,
  Compass,
  Sparkles,
  Quote,
  Award,
  ZoomIn,
  X,
  Utensils,
  Activity,
  Minus,
  Plus,
  ShoppingBag,
  PenLine,
  User,
  ThumbsUp,
  Headphones,
  Lock,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import {
  getTour,
  getCompetingTours,
  getRelatedTours,
} from "@/mocks/tours";
import { getLeader } from "@/mocks/leaders";
import { getAllTours } from "@/hooks/use-all-tours";
import { useMounted } from "@/hooks/use-mounted";
import { useParams } from "next/navigation";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useCompare } from "@/store/compare-store";
import { useCart } from "@/store/cart-store";
import { useWishlist } from "@/store/wishlist-store";
import { useRecent } from "@/store/recent-store";
import { useReviews } from "@/store/reviews-store";
import { useReviewVotes } from "@/store/review-votes-store";
import { ReviewsModal } from "@/components/tours/reviews-modal";
import { TourFAQ } from "@/components/tours/tour-faq";
import { DifficultyGuide } from "@/components/tours/difficulty-guide";
import { FitnessTips } from "@/components/tours/fitness-tips";
import { CountdownTimer } from "@/components/tours/countdown-timer";
import { WeatherWidget } from "@/components/tours/weather-widget";
import { ViewingIndicator } from "@/components/tours/viewing-indicator";
import { FitScoreBreakdown } from "@/components/fit-score/fit-score-breakdown";
import { SafetyScoreCard } from "@/components/safety/safety-score-card";
import { BuddyOptInToggle } from "@/components/travel-buddy/buddy-opt-in-toggle";
import { TripKitSection } from "@/components/trip-kit/trip-kit-section";
import { ShareDialog } from "@/components/common/share-dialog";
import {
  toFa,
  formatCurrency,
  formatNumber,
  toPersianDate,
  toPersianShortDate,
  daysUntil,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from "@/lib/format";
import {
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/animations/scroll-reveal";
import { MagneticButton } from "@/components/animations/magnetic-button";
import { HeartBurst } from "@/components/animations/heart-burst";
import { SmartImage } from "@/components/common/smart-image";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { cn } from "@/lib/utils";
import {
  tourFillRatio,
  fillColor,
  capacityLevel,
  levelTextClass,
  levelChipClass,
} from "@/lib/capacity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DepartureDatePicker } from "@/components/tours/departure-date-picker";
import type { Tour, TourCategory } from "@/types";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<TourCategory, typeof Mountain> = {
  mountain: Mountain,
  desert: Sun,
  coastal: Palmtree,
  historical: Landmark,
  forest: TreePine,
};

// --- Helper components ---------------------------------------------------

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i < Math.round(rating) ? "fill-gold text-gold" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function BadgeChip({ type, large }: { type: string; large?: boolean }) {
  const map: Record<string, { icon: typeof Crown; cls: string }> = {
    "برترین لیدر": { icon: Crown, cls: "bg-gold/15 text-gold border-gold/30" },
    پرطرفدارترین: { icon: Flame, cls: "bg-sunset/15 text-sunset border-sunset/30" },
    "بهترین قیمت": { icon: Tag, cls: "bg-emerald/15 text-emerald border-emerald/30" },
    "تجربه لوکس": { icon: Sparkles, cls: "bg-gold/15 text-gold border-gold/30" },
    "تجربه خاص": { icon: Flame, cls: "bg-sunset/15 text-sunset border-sunset/30" },
  };
  const cfg = map[type] ?? { icon: Star, cls: "bg-secondary text-foreground border-border" };
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-bold backdrop-blur",
        large ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]",
        cfg.cls
      )}
    >
      <Icon className={large ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {type}
    </span>
  );
}

// --- Keyword highlighting --------------------------------------------------

/**
 * Highlights the tour's key words (destination, leader, category, features…)
 * inside free text so they pop for the reader — requested UI polish: «کلمه‌های
 * کلیدی همه تورها با رنگ دیگه‌ای نمایش داده بشن».
 */
function tourKeywords(tour: Tour): string[] {
  return [
    tour.title,
    tour.destination,
    tour.province,
    tour.leader.fullName,
    CATEGORY_LABELS[tour.category],
    DIFFICULTY_LABELS[tour.difficulty],
    "بیمه مسافر",
    "حمل‌ونقل داخلی",
    "کوچ‌نشین",
    "لیدر حرفه‌ای",
    "فرهنگ محلی",
    "مناظر بکر",
    "طبیعی ایران",
  ].filter(Boolean);
}

function HighlightText({ text, words }: { text: string; words: string[] }) {
  const uniq = React.useMemo(() => {
    return [...new Set(words.filter((w) => w && w.length > 1))].sort(
      (a, b) => b.length - a.length
    );
  }, [words]);
  const parts = React.useMemo(() => {
    if (uniq.length === 0) return null;
    const escaped = uniq.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    return text.split(new RegExp(`(${escaped.join("|")})`, "g"));
  }, [text, uniq]);

  if (!parts) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        uniq.includes(part) ? (
          <mark
            key={i}
            className="rounded-md bg-gold/20 px-1 py-0.5 font-bold text-forest dark:bg-gold/15 dark:text-gold-light"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

// --- Gallery -------------------------------------------------------------

function Gallery({ tour }: { tour: Tour }) {
  const [active, setActive] = React.useState(0);
  const [lightbox, setLightbox] = React.useState(false);
  const images = tour.images;

  // Lock body scroll while the fullscreen lightbox is open.
  React.useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  // Keyboard navigation for lightbox
  React.useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setActive((p) => (p + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        setActive((p) => (p - 1 + images.length) % images.length);
      } else if (e.key === "Escape") {
        setLightbox(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, images.length]);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative aspect-[16/10] overflow-hidden rounded-3xl border bg-secondary shadow-sm cursor-zoom-in"
        onClick={() => setLightbox(true)}
      >
        <SmartImage
          src={images[active]}
          alt={tour.title}
          fallback="tour"
          fallbackLabel={CATEGORY_LABELS[tour.category]}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent" />
        {/* Top badges */}
        <div className="absolute right-4 top-4 flex flex-wrap gap-2">
          {tour.badges?.map((b) => (
            <BadgeChip key={b} type={b} large />
          ))}
        </div>
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {tour.discountPrice && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-white shadow-lg">
              {toFa(Math.round((1 - tour.discountPrice / tour.price) * 100))}٪ تخفیف
            </span>
          )}
          <span className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-cream backdrop-blur", "bg-forest/60")}>
            {(() => {
              const Icon = CATEGORY_ICONS[tour.category];
              return <Icon className="h-3.5 w-3.5" />;
            })()}
            {CATEGORY_LABELS[tour.category]}
          </span>
          <span className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold backdrop-blur", DIFFICULTY_COLORS[tour.difficulty])}>
            <Mountain className="h-3.5 w-3.5" />
            {DIFFICULTY_LABELS[tour.difficulty]}
          </span>
        </div>
        {/* Zoom hint — always visible on touch, hover-reveal on desktop */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-forest/70 px-3 py-1.5 text-[10px] font-bold text-cream backdrop-blur transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" />
          مشاهده تمام صفحه
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-3">
        {images.slice(0, 4).map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-2xl border-2 transition-all",
              active === i
                ? "border-primary ring-2 ring-primary/20"
                : "border-transparent opacity-70 hover:opacity-100"
            )}
          >
            <SmartImage src={img} alt={`تصویر ${toFa(i + 1)}`} fallback="tour" shimmer={false} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox — true fullscreen overlay (portal → escapes any
          sticky/backdrop-filter containing block and covers the viewport) */}
      {lightbox &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95"
            role="dialog"
            aria-modal="true"
            aria-label={`گالری تصاویر ${tour.title}`}
          >
            {/* Top bar */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 md:p-5">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur">
                <ZoomIn className="h-4 w-4" />
                {toFa(active + 1)} از {toFa(images.length)}
              </div>
              <button
                onClick={() => setLightbox(false)}
                aria-label="بستن"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:rotate-90 hover:bg-white/25"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Image — object-contain fills the entire viewport */}
            <div
              className="flex min-h-0 w-full flex-1 items-center justify-center p-4 md:p-10"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative h-full w-full"
              >
                <SmartImage
                  src={images[active]}
                  alt={`${tour.title} — تصویر ${toFa(active + 1)}`}
                  fallback="tour"
                  shimmer={false}
                  className="h-full w-full object-contain"
                />
              </motion.div>
            </div>

            {/* Nav arrows — right = بعدی، left = قبلی */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActive((p) => (p + 1) % images.length);
              }}
              aria-label="تصویر بعدی"
              className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:scale-110 hover:bg-white/25 md:right-6 md:h-14 md:w-14"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActive((p) => (p - 1 + images.length) % images.length);
              }}
              aria-label="تصویر قبلی"
              className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:scale-110 hover:bg-white/25 md:left-6 md:h-14 md:w-14"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            {/* Keyboard hint */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] text-white/85 backdrop-blur">
              <kbd className="rounded border border-white/25 px-1.5 py-0.5 font-sans">→</kbd>
              <kbd className="rounded border border-white/25 px-1.5 py-0.5 font-sans">←</kbd>
              برای جابجایی
              <span className="mx-1 text-white/30">|</span>
              <kbd className="rounded border border-white/25 px-1.5 py-0.5 font-sans">Esc</kbd>
              خروج
            </div>
          </motion.div>,
          document.body
        )}
    </div>
  );
}

// --- Sticky booking box --------------------------------------------------

function BookingBox({ tour }: { tour: Tour }) {
  const setCartOpen = useNav((s) => s.setCartOpen);
  const addTour = useCart((s) => s.addTour);
  const { toggle: toggleWishlist, has: hasWishlist } = useWishlist();
  const [participants, setParticipants] = React.useState(1);
  // Mount gate — see useMounted (app-shell rehydrate vs deferred hydration).
  const mounted = useMounted();
  const fav = mounted && hasWishlist(tour.id);
  const [added, setAdded] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  // Selected departure — defaults to the tour's own startDate so the previous
  // behavior is preserved unless the traveler picks one of the upcoming ones.
  const [departureDate, setDepartureDate] = React.useState(tour.startDate);

  const finalPrice = tour.discountPrice ?? tour.price;
  const total = finalPrice * participants;
  const left = tour.capacity - tour.reservedCount;
  const daysLeft = daysUntil(departureDate);

  const handleAdd = () => {
    addTour({
      refId: tour.id,
      title: tour.title,
      image: tour.images[0],
      unitPrice: finalPrice,
      quantity: participants,
      meta: {
        participants,
        startDate: departureDate,
      },
    });
    setAdded(true);
    toast.success("تور به سبد اضافه شد", {
      description: `${toFa(participants)} نفر — ${formatCurrency(total)}`,
    });
    setTimeout(() => setCartOpen(true), 250);
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-lg backdrop-blur-md lg:sticky lg:top-24">
      {/* Price */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          {tour.discountPrice && (
            <p className="text-xs text-muted-foreground line-through">
              {formatCurrency(tour.price)}
            </p>
          )}
          <p className="text-3xl font-extrabold text-primary">
            {formatCurrency(finalPrice)}
          </p>
          <p className="text-[11px] text-muted-foreground">برای هر نفر</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold">
          <Star className="h-3.5 w-3.5 fill-gold" />
          {toFa(tour.rating)}
          <span className="text-[10px] text-muted-foreground">({toFa(tour.reviewsCount)})</span>
        </div>
      </div>

      {/* Live viewing indicator */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-emerald/5 px-3 py-2">
        <ViewingIndicator tourId={tour.id} variant="inline" />
        <span className="text-[10px] text-muted-foreground">همین الان</span>
      </div>

      {/* Capacity warning — color follows the shared green→red scale */}
      {(() => {
        const ratio = tourFillRatio(tour.reservedCount, tour.capacity);
        const level = capacityLevel(ratio);
        const isFull = left <= 0;
        if (level === "ok" && !isFull) return null;
        return (
          <div
            className={cn(
              "mb-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold",
              levelChipClass(isFull ? "full" : level)
            )}
          >
            {isFull ? <AlertTriangle className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
            {isFull
              ? "ظرفیت این تور تکمیل شده است"
              : left <= 5
                ? `تنها ${toFa(left)} نفر ظرفیت باقی مانده!`
                : `ظرفیت در حال تکمیل — ${toFa(left)} نفر باقی`}
          </div>
        );
      })()}

      {/* Date — real Jalali calendar with the tour's departure days enabled */}
      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
          تاریخ حرکت
        </label>
        <DepartureDatePicker
          startDate={tour.startDate}
          durationDays={tour.duration}
          value={departureDate}
          onChange={setDepartureDate}
        />
        {daysLeft > 0 && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {toFa(daysLeft)} روز تا حرکت
          </p>
        )}
      </div>

      {/* Participants stepper */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
          تعداد مسافران
        </label>
        <div className="flex items-center justify-between rounded-xl border bg-background p-1">
          <button
            onClick={() => setParticipants((p) => Math.max(1, p - 1))}
            className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-foreground transition hover:bg-destructive hover:text-white disabled:opacity-40 max-sm:h-11 max-sm:w-11"
            disabled={participants <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-lg font-extrabold text-primary">{toFa(participants)} نفر</span>
          <button
            onClick={() => setParticipants((p) => Math.min(10, p + 1))}
            className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-foreground transition hover:bg-primary hover:text-primary-foreground disabled:opacity-40 max-sm:h-11 max-sm:w-11"
            disabled={participants >= Math.min(10, left)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-emerald/5 px-4 py-3">
        <span className="text-sm text-muted-foreground">مجموع</span>
        <span className="text-xl font-extrabold text-emerald">
          {formatCurrency(total)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <MagneticButton
          strength={0.2}
          onClick={handleAdd}
          className={cn(
            "flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition",
            added
              ? "bg-emerald text-primary-foreground"
              : "bg-primary text-primary-foreground hover:bg-emerald-dark"
          )}
        >
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {added ? "به سبد اضافه شد" : "افزودن به سبد"}
        </MagneticButton>
        <button
          onClick={() => {
            toggleWishlist(tour.id);
            toast.success(
              hasWishlist(tour.id)
                ? "از علاقه‌مندی‌ها حذف شد"
                : "به علاقه‌مندی‌ها اضافه شد!"
            );
          }}
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border transition",
            fav
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-background text-muted-foreground hover:border-accent hover:text-accent"
          )}
          aria-label="افزودن به علاقه‌مندی"
        >
          <HeartBurst active={fav}>
            <Heart className={cn("h-5 w-5", fav && "fill-accent")} />
          </HeartBurst>
        </button>
        <button
          onClick={() => setShareOpen(true)}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-background text-muted-foreground transition hover:border-primary hover:text-primary"
          aria-label="اشتراک‌گذاری"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={tour.title}
      />

      {/* Trust badges */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4">
        {[
          {
            icon: ShieldCheck,
            label: "بیمه مسافر",
            color: "text-emerald",
            bg: "bg-emerald/10",
          },
          {
            icon: Award,
            label: "لیدر تأیید‌شده",
            color: "text-gold",
            bg: "bg-gold/10",
          },
          {
            icon: Check,
            label: "لغو رایگان",
            color: "text-emerald-light",
            bg: "bg-emerald-light/10",
          },
        ].map((badge, i) => {
          const BIcon = badge.icon;
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1 rounded-xl bg-card p-2 text-center"
            >
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg", badge.bg, badge.color)}>
                <BIcon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-foreground/80">
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Countdown timer — uses the SELECTED departure date so changing the
          date in the calendar instantly re-targets the countdown (bug: it
          used to stay on tour.startDate forever). */}
      <CountdownTimer targetDate={departureDate} className="mt-4" />
    </div>
  );
}

// --- Mobile sticky booking CTA -------------------------------------------

/**
 * Sticky bottom booking bar — mobile/tablet only (`lg:hidden`, because from
 * `lg` up the sticky BookingBox sidebar is always on screen).
 *
 * Slides in only after the main booking box has been scrolled completely
 * past (its bottom edge above the viewport top) so it never duplicates the
 * primary CTA while that one is visible. Reuses the exact same add-to-cart
 * flow as BookingBox (participants = 1, the default stepper value).
 */
function MobileStickyCTA({ tour, visible }: { tour: Tour; visible: boolean }) {
  const setCartOpen = useNav((s) => s.setCartOpen);
  const addTour = useCart((s) => s.addTour);
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    setAdded(false);
  }, [tour.id]);

  const finalPrice = tour.discountPrice ?? tour.price;

  const handleAdd = () => {
    addTour({
      refId: tour.id,
      title: tour.title,
      image: tour.images[0],
      unitPrice: finalPrice,
      quantity: 1,
      meta: {
        participants: 1,
        startDate: tour.startDate,
      },
    });
    setAdded(true);
    toast.success("تور به سبد اضافه شد", {
      description: `${toFa(1)} نفر — ${formatCurrency(finalPrice)}`,
    });
    setTimeout(() => setCartOpen(true), 250);
  };

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md transition-transform duration-300 max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom))] max-lg:pb-0 lg:hidden",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
        <div className="shrink-0">
          {tour.discountPrice && (
            <p className="text-[10px] text-muted-foreground line-through">
              {formatCurrency(tour.price)}
            </p>
          )}
          <p className="text-lg font-extrabold leading-6 text-primary">
            {formatCurrency(finalPrice)}
          </p>
          <p className="text-[10px] text-muted-foreground">برای هر نفر</p>
        </div>
        <button
          onClick={handleAdd}
          className={cn(
            "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition sm:max-w-64",
            added
              ? "bg-emerald text-primary-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {added ? "به سبد اضافه شد" : "افزودن به سبد"}
        </button>
      </div>
    </div>
  );
}

// --- Tabs: Description ---------------------------------------------------

function DescriptionTab({ tour }: { tour: Tour }) {
  const CatIcon = CATEGORY_ICONS[tour.category];
  const kw = React.useMemo(() => tourKeywords(tour), [tour]);
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <div dir="rtl" className="space-y-4 rounded-2xl border bg-card/50 p-5 text-right leading-8 text-foreground/90">
          <p>
            تور «<HighlightText text={tour.title} words={kw} />» یک سفر بی‌نظیر به <HighlightText text={tour.destination} words={kw} /> در استان <HighlightText text={tour.province} words={kw} /> است
            که توسط <HighlightText text="لیدر حرفه‌ای" words={kw} /> <HighlightText text={tour.leader.fullName} words={kw} /> با {toFa(tour.leader.experienceYears)} سال
            تجربه برگزار می‌شود. این تور طی {toFa(tour.duration)} روز برنامه‌ریزی شده و برای علاقه‌مندان
            به <HighlightText text={CATEGORY_LABELS[tour.category]} words={kw} /> با سطح سختی <HighlightText text={DIFFICULTY_LABELS[tour.difficulty]} words={kw} /> مناسب است.
          </p>
          <p>
            در این سفر، شما با <HighlightText text="مناظر بکر طبیعی ایران" words={kw} /> آشنا می‌شوید، با <HighlightText text="فرهنگ محلی" words={kw} /> مردم منطقه در ارتباط خواهید بود
            و تجربه‌ای امن و لذت‌بخش را با همراهی تیم حرفه‌ای <HighlightText text="کوچ‌نشین" words={kw} /> سپری خواهید کرد. تمامی وعده‌های غذایی،
            <HighlightText text="حمل‌ونقل داخلی" words={kw} /> و <HighlightText text="بیمه مسافر" words={kw} /> در این تور ارائه می‌شود.
          </p>
          <p>
            ظرفیت این تور {toFa(tour.capacity)} نفر است که تاکنون {toFa(tour.reservedCount)} نفر ثبت‌نام کرده‌اند.
            تاریخ حرکت {toPersianDate(tour.startDate)} می‌باشد و مکان جمع‌آوری پس از ثبت‌نام به شما اطلاع داده می‌شود.
          </p>
        </div>
      </ScrollReveal>

      {/* Info cards */}
      <StaggerGroup className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: CatIcon, label: "دسته", value: CATEGORY_LABELS[tour.category], color: "text-emerald" },
          { icon: Mountain, label: "سختی", value: DIFFICULTY_LABELS[tour.difficulty], color: "text-sunset" },
          { icon: Clock, label: "مدت", value: `${toFa(tour.duration)} روز`, color: "text-gold" },
          { icon: Users, label: "ظرفیت", value: `${toFa(tour.capacity)} نفر`, color: "text-emerald-light" },
        ].map((c) => (
          <motion.div
            key={c.label}
            variants={staggerItem}
            className="rounded-2xl border bg-card p-4 text-center"
          >
            <span className={cn("mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-secondary", c.color)}>
              <c.icon className="h-5 w-5" />
            </span>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="text-sm font-bold">{c.value}</p>
          </motion.div>
        ))}
      </StaggerGroup>

      {/* Weather widget */}
      <WeatherWidget tour={tour} />
    </div>
  );
}

// --- Tabs: Itinerary timeline --------------------------------------------

function ItineraryTab({ tour }: { tour: Tour }) {
  const kw = React.useMemo(() => tourKeywords(tour), [tour]);
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute right-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald via-gold to-sunset md:right-[31px]" />

      <StaggerGroup className="space-y-6">
        {tour.itinerary.map((day, idx) => (
          <motion.div
            key={day.day}
            variants={staggerItem}
            className="relative pr-16 md:pr-20"
          >
            {/* Day node */}
            <div className="absolute right-0 top-0">
              <div
                className={cn(
                  "relative grid h-14 w-14 place-items-center rounded-full border-4 border-background shadow-lg md:h-16 md:w-16",
                  day.highlight ? "bg-gradient-to-br from-gold to-sunset text-forest" : "bg-primary text-primary-foreground"
                )}
              >
                <span className="text-lg font-extrabold">{toFa(day.day)}</span>
                {day.highlight && (
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gold text-forest shadow">
                    <Star className="h-3.5 w-3.5 fill-forest" />
                  </span>
                )}
              </div>
            </div>

            {/* Card */}
            <div
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md md:p-5",
                day.highlight && "border-gold/40 bg-gradient-to-br from-card to-gold/5"
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    روز {toFa(day.day)}
                  </p>
                  <h4 className="text-lg font-bold leading-7">
                    {day.title}
                    {day.highlight && (
                      <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                        <Sparkles className="h-3 w-3" />
                        نقطه اوج
                      </span>
                    )}
                  </h4>
                </div>
              </div>

              <p className="mb-3 text-right text-sm leading-7 text-foreground/80">
                <HighlightText text={day.description} words={kw} />
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-2">
                {day.elevation !== undefined && day.elevation > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-1 text-[11px] font-bold text-emerald">
                    <TrendingUp className="h-3 w-3" />
                    ارتفاع: {toFa(day.elevation.toLocaleString("en-US"))} م
                  </span>
                )}
                {day.distance !== undefined && day.distance > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-sunset/10 px-2.5 py-1 text-[11px] font-bold text-sunset">
                    <Activity className="h-3 w-3" />
                    مسافت: {toFa(day.distance)} کیلومتر
                  </span>
                )}
                {day.meals.map((m) => (
                  <span
                    key={m}
                    className="flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold"
                  >
                    <Utensils className="h-3 w-3" />
                    {m}
                  </span>
                ))}
              </div>

              {/* Progress connector dot for last item */}
              {idx === tour.itinerary.length - 1 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald/5 px-3 py-2 text-xs font-bold text-emerald">
                  <Check className="h-4 w-4" />
                  پایان سفر و بازگشت به محل شروع
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </StaggerGroup>
    </div>
  );
}

// --- Tabs: Facilities ----------------------------------------------------

function FacilitiesTab({ tour }: { tour: Tour }) {
  return (
    <StaggerGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {tour.facilities.map((f) => (
        <motion.div
          key={f}
          variants={staggerItem}
          className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary/40"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald/10 text-emerald">
            <Check className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">{f}</span>
        </motion.div>
      ))}
    </StaggerGroup>
  );
}

// --- Tabs: Reviews -------------------------------------------------------

function ReviewsTab({ tour }: { tour: Tour }) {
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<"newest" | "highest" | "lowest">("newest");
  const userReviews = useReviews((s) => s.reviews);
  const tourUserReviews = React.useMemo(
    () => userReviews.filter((r) => r.tourId === tour.id),
    [userReviews, tour.id]
  );

  const distribution = React.useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    tour.reviews.forEach((r) => {
      const idx = Math.min(4, Math.max(0, Math.round(r.rating) - 1));
      dist[idx]++;
    });
    tourUserReviews.forEach((r) => {
      const idx = Math.min(4, Math.max(0, Math.round(r.rating) - 1));
      dist[idx]++;
    });
    return dist.reverse(); // 5 → 1
  }, [tour.reviews, tourUserReviews]);

  const total = tour.reviews.length + tourUserReviews.length;
  const totalCount = tour.reviewsCount + tourUserReviews.length;

  // Sorted reviews
  const sortedReviews = React.useMemo(() => {
    const all = [...tour.reviews];
    if (sortBy === "newest") {
      return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    if (sortBy === "highest") {
      return all.sort((a, b) => b.rating - a.rating);
    }
    return all.sort((a, b) => a.rating - b.rating);
  }, [tour.reviews, sortBy]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <ScrollReveal>
        <div className="grid grid-cols-1 gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-l">
            <p className="text-5xl font-extrabold text-gradient-emerald">{toFa(tour.rating)}</p>
            <StarRow rating={tour.rating} size={18} />
            <p className="mt-1 text-xs text-muted-foreground">
              از {toFa(totalCount)} نظر
            </p>
          </div>
          <div className="space-y-2">
            {distribution.map((count, i) => {
              const stars = 5 - i;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="flex w-12 items-center gap-1 text-xs font-bold">
                    {toFa(stars)}
                    <Star className="h-3 w-3 fill-gold text-gold" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-l from-gold to-emerald"
                    />
                  </div>
                  <span className="w-8 text-left text-xs text-muted-foreground">
                    {toFa(count)}
                  </span>
                </div>
              );
            })}
            {/* CTA */}
            <button
              onClick={() => setReviewModalOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <PenLine className="h-4 w-4" />
              نظر بده
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* User-submitted reviews (shown first) */}
      {tourUserReviews.length > 0 && (
        <StaggerGroup className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald">
            <Sparkles className="h-4 w-4" />
            نظرات شما
          </div>
          {tourUserReviews.map((r) => (
            <motion.div
              key={r.id}
              variants={staggerItem}
              className="rounded-2xl border-2 border-emerald/30 bg-emerald/5 p-4 md:p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald/15 text-emerald ring-2 ring-emerald/20">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="flex items-center gap-1.5 font-bold">
                    {r.author}
                    <Badge variant="secondary" className="bg-emerald/15 text-[9px] text-emerald">
                      شما
                    </Badge>
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRow rating={r.rating} size={12} />
                    <span className="text-[10px] text-muted-foreground">
                      {toPersianShortDate(r.date)}
                    </span>
                  </div>
                </div>
                <Quote className="h-5 w-5 text-emerald/40" />
              </div>
              <p className="text-sm leading-7 text-foreground/80">{r.comment}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      )}

      {/* Sort bar */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3 max-sm:flex-wrap">
        <span className="text-sm font-semibold">
          {toFa(sortedReviews.length)} نظر
        </span>
        <div className="flex items-center gap-1 max-sm:flex-wrap">
          <span className="ml-1 text-xs text-muted-foreground">مرتب‌سازی:</span>
          {([
            { id: "newest", label: "جدیدترین" },
            { id: "highest", label: "بالاترین امتیاز" },
            { id: "lowest", label: "پایین‌ترین امتیاز" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                sortBy === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <StaggerGroup className="space-y-4">
        {sortedReviews.map((r) => (
          <motion.div
            key={r.id}
            variants={staggerItem}
            className="rounded-2xl border bg-card p-4 md:p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <SmartImage
                src={r.avatar}
                alt={r.author}
                fallback="avatar"
                shimmer={false}
                aspectClass="h-10 w-10 shrink-0 rounded-full ring-2 ring-gold/20"
                className="h-full w-full object-cover"
              />
              <div className="flex-1">
                <p className="font-bold">{r.author}</p>
                <div className="flex items-center gap-2">
                  <StarRow rating={r.rating} size={12} />
                  <span className="text-[10px] text-muted-foreground">
                    {toPersianShortDate(r.date)}
                  </span>
                </div>
              </div>
              <Quote className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm leading-7 text-foreground/80">{r.comment}</p>
            <ReviewHelpful reviewId={r.id} baseCount={Math.floor(r.rating * 3)} />
          </motion.div>
        ))}
      </StaggerGroup>

      <ReviewsModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        tourId={tour.id}
        tourTitle={tour.title}
      />
    </div>
  );
}

// --- Review helpful button -----------------------------------------------

function ReviewHelpful({ reviewId, baseCount }: { reviewId: string; baseCount: number }) {
  const toggleHelpful = useReviewVotes((s) => s.toggleHelpful);
  const hasVoted = useReviewVotes((s) => s.hasVoted(reviewId));
  const getHelpful = useReviewVotes((s) => s.getHelpful);
  const count = getHelpful(reviewId, baseCount);
  const voted = hasVoted;

  return (
    <div className="mt-3 flex items-center gap-2 border-t pt-3">
      <button
        onClick={() => toggleHelpful(reviewId)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
          voted
            ? "bg-emerald/15 text-emerald"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <ThumbsUp className={cn("h-3.5 w-3.5", voted && "fill-current")} />
        مفید بود
        <span className="font-bold">{toFa(count)}</span>
      </button>
    </div>
  );
}

// --- Competing tours section ---------------------------------------------

function CompetingToursSection({ tour }: { tour: Tour }) {
  const go = useGo();
  const setCompareOpen = useNav((s) => s.setCompareOpen);
  const toggle = useCompare((s) => s.toggle);
  const compareIds = useCompare((s) => s.tourIds);
  const competitors = React.useMemo(() => getCompetingTours(tour), [tour]);

  if (competitors.length === 0) return null;

  // Determine best metrics
  const all = [tour, ...competitors];
  const cheapest = Math.min(...all.map((t) => t.discountPrice ?? t.price));
  const topRated = Math.max(...all.map((t) => t.rating));
  const shortest = Math.min(...all.map((t) => t.duration));

  return (
    <section className="relative mt-16">
      <ScrollReveal y={20}>
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-sunset/10 text-sunset">
                <Trophy className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-sunset">
                رقابت لیدرها
              </span>
            </div>
            <h2 className="text-2xl font-extrabold leading-tight md:text-3xl">
              تورهای مشابه از <span className="text-gradient-sunset">سایر لیدرها</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              همین مقصد را با لیدرهای مختلف تجربه کنید — قیمت، امتیاز و ظرفیت را مقایسه کنید.
            </p>
          </div>
          <MagneticButton
            strength={0.2}
            onClick={() => setCompareOpen(true)}
            className="hidden items-center gap-1.5 rounded-full border-2 border-primary px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground md:inline-flex"
          >
            <GitCompare className="h-4 w-4" />
            مقایسه کامل
          </MagneticButton>
        </div>
      </ScrollReveal>

      {/* Price comparison mini chart */}
      <ScrollReveal delay={0.1}>
        <div className="mb-6 rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold">
              <TrendingUp className="h-4 w-4 text-emerald" />
              مقایسه قیمت
            </h4>
            <span className="text-xs text-muted-foreground">
              {toFa(all.length)} تور رقیب
            </span>
          </div>
          <div className="space-y-2.5">
            {all.map((t) => {
              const p = t.discountPrice ?? t.price;
              const maxPrice = Math.max(...all.map((x) => x.discountPrice ?? x.price));
              const pct = (p / maxPrice) * 100;
              const isCurrent = t.id === tour.id;
              const isCheapest = p === cheapest;
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="flex w-28 shrink-0 items-center gap-1.5">
                    {isCurrent && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <span className={cn("truncate text-xs", isCurrent ? "font-bold text-primary" : "text-muted-foreground")}>
                      {isCurrent ? "این تور" : t.leader.fullName.split(" ")[0]}
                    </span>
                  </div>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-secondary/60">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-lg",
                        isCurrent
                          ? "bg-gradient-to-l from-emerald to-emerald-dark"
                          : isCheapest
                          ? "bg-gradient-to-l from-gold to-gold-light"
                          : "bg-gradient-to-l from-sunset/70 to-sunset"
                      )}
                    />
                  </div>
                  {/* full readable amount (user request) — outside the fill
                      so short bars stay readable */}
                  <span className="w-24 shrink-0 text-left text-[11px] font-extrabold tabular-nums text-foreground">
                    {formatNumber(p)}
                    <span className="mr-1 text-[9px] font-medium text-muted-foreground">تومان</span>
                  </span>
                  {isCheapest && (
                    <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-bold text-gold">
                      ارزان‌ترین
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      <div className="custom-scroll flex gap-4 overflow-x-auto pb-4">
        {/* Current tour — highlighted */}
        <ScrollReveal className="shrink-0" delay={0}>
          <CompetingCard
            tour={tour}
            current
            cheapest={cheapest}
            bestPrice={(tour.discountPrice ?? tour.price) === cheapest}
            bestRating={tour.rating === topRated}
            bestDuration={tour.duration === shortest}
          />
        </ScrollReveal>
        {competitors.map((t, i) => (
          <ScrollReveal key={t.id} className="shrink-0" delay={(i + 1) * 0.06}>
            <CompetingCard
              tour={t}
              cheapest={cheapest}
              bestPrice={(t.discountPrice ?? t.price) === cheapest}
              bestRating={t.rating === topRated}
              bestDuration={t.duration === shortest}
              onNavigate={() => go("tour-detail", { id: t.id })}
              onToggleCompare={() => toggle(t.id)}
              isCompared={compareIds.includes(t.id)}
            />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function CompetingCard({
  tour,
  cheapest,
  current,
  bestPrice,
  bestRating,
  bestDuration,
  onNavigate,
  onToggleCompare,
  isCompared,
}: {
  tour: Tour;
  cheapest: number;
  current?: boolean;
  bestPrice?: boolean;
  bestRating?: boolean;
  bestDuration?: boolean;
  onNavigate?: () => void;
  onToggleCompare?: () => void;
  isCompared?: boolean;
}) {
  const finalPrice = tour.discountPrice ?? tour.price;
  const left = tour.capacity - tour.reservedCount;
  const toggleWishlist = useWishlist((s) => s.toggle);
  const mounted = useMounted();
  const fav = mounted && useWishlist.getState().tourIds.includes(tour.id);
  return (
    <div
      className={cn(
        "relative flex w-72 flex-col overflow-hidden rounded-3xl border-2 bg-card shadow-sm transition-all hover:shadow-lg",
        current ? "border-primary ring-2 ring-primary/20" : "border-border/60"
      )}
    >
      {current && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-lg">
          <Sparkles className="h-3 w-3" />
          تور فعلی
        </div>
      )}
      <div className="relative h-32 overflow-hidden">
        <SmartImage
          src={tour.images[0]}
          alt={tour.title}
          fallback="tour"
          fallbackLabel={CATEGORY_LABELS[tour.category]}
          shimmer={false}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/70 to-transparent" />
        {/* Wishlist heart (top-left) */}
        <IconTooltip label={fav ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"} side="left">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(tour.id);
            }}
            aria-label="افزودن به علاقه‌مندی"
            className={cn(
              "absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition",
              fav
                ? "bg-sunset text-white shadow-md shadow-sunset/30"
                : "bg-cream/20 text-cream hover:bg-cream/35"
            )}
          >
            <HeartBurst active={fav}>
              <Heart className={cn("h-3.5 w-3.5 transition", fav && "fill-current")} />
            </HeartBurst>
          </button>
        </IconTooltip>
        <div className="absolute bottom-2 right-3 left-3 flex items-center justify-between text-cream">
          <span className="line-clamp-1 text-xs font-bold drop-shadow">{tour.destination}</span>
          {onToggleCompare && (
            <IconTooltip label={isCompared ? "حذف از مقایسه" : "افزودن به مقایسه"} side="left">
              <button
                onClick={onToggleCompare}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full backdrop-blur transition",
                  isCompared
                    ? "bg-primary text-primary-foreground"
                    : "bg-cream/20 text-cream hover:bg-cream/35"
                )}
                aria-label="مقایسه"
              >
                {isCompared ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
              </button>
            </IconTooltip>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className="line-clamp-1 font-bold leading-6">{tour.title}</h4>

        {/* Leader */}
        <div className="mt-2 flex items-center gap-2">
          <SmartImage
            src={tour.leader.avatar}
            alt={tour.leader.fullName}
            fallback="avatar"
            shimmer={false}
            aspectClass="h-6 w-6 shrink-0 rounded-full ring-1 ring-gold/30"
            className="h-full w-full object-cover"
          />
          <span className="text-xs font-medium">{tour.leader.fullName}</span>
          {tour.leader.verificationStatus === "verified" && (
            <ShieldCheck className="h-3 w-3 text-emerald" />
          )}
        </div>

        {/* Metrics grid — rating & duration; price moved to its own
            readable row below (user report: «۱.۲ م» ناخوانا بود) */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-center">
          <div className={cn("rounded-xl p-2", bestRating ? "bg-gold/10 ring-1 ring-gold/30" : "bg-secondary/50")}>
            <p className="text-[9px] text-muted-foreground">امتیاز</p>
            <p className="text-[11px] font-extrabold text-gold">{toFa(tour.rating)}</p>
            {bestRating && (
              <p className="text-[8px] font-bold text-gold">برترین</p>
            )}
          </div>
          <div className={cn("rounded-xl p-2", bestDuration ? "bg-sunset/10 ring-1 ring-sunset/30" : "bg-secondary/50")}>
            <p className="text-[9px] text-muted-foreground">مدت</p>
            <p className="text-[11px] font-extrabold text-sunset">{toFa(tour.duration)} روز</p>
            {bestDuration && (
              <p className="text-[8px] font-bold text-sunset">کوتاه‌ترین</p>
            )}
          </div>
        </div>

        {/* Full readable price + comparison row (user request) */}
        <div className={cn(
          "mt-2 rounded-2xl border p-3",
          bestPrice ? "border-gold/40 bg-gold/5" : "border-border/70 bg-secondary/40"
        )}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">قیمت هر نفر</span>
            {bestPrice ? (
              <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-bold text-gold">
                ارزان‌ترین در این مقایسه
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent">
                {formatNumber(finalPrice - cheapest)} تومان گران‌تر
              </span>
            )}
          </div>
          <p className="mt-1 whitespace-nowrap text-lg font-extrabold tabular-nums text-primary">
            {formatCurrency(finalPrice)}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div className="min-w-0 text-[10px] text-muted-foreground">
            <p className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {toFa(left)} نفر باقی
            </p>
            <p className="whitespace-nowrap font-extrabold tabular-nums text-primary">
              {formatCurrency(finalPrice)}
            </p>
          </div>
          {onNavigate && (
            <Button
              size="sm"
              onClick={onNavigate}
              className="rounded-xl bg-primary text-primary-foreground"
            >
              مشاهده
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Trust strip ---------------------------------------------------------

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "لیدر تأییدشده",
    sub: "هویت و مدارک بررسی‌شده",
    circle: "bg-emerald/10 text-emerald",
  },
  {
    icon: Headphones,
    title: "پشتیبانی ۲۴/۷",
    sub: "پاسخگویی در تمام سفر",
    circle: "bg-gold/10 text-gold",
  },
  {
    icon: Lock,
    title: "پرداخت امن",
    sub: "درگاه معتبر بانکی",
    circle: "bg-primary/10 text-primary",
  },
  {
    icon: RotateCcw,
    title: "لغو طبق شرایط تور",
    sub: "بازگشت وجه شفاف",
    circle: "bg-sunset/10 text-sunset",
  },
] as const;

function TrustStrip() {
  return (
    <ScrollReveal y={16}>
      <section
        aria-label="اعتماد و امنیت"
        className="rounded-3xl border border-border/60 bg-card p-4 ring-1 ring-gold/15 md:p-5"
      >
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-2">
          {TRUST_ITEMS.map((item) => (
            <li
              key={item.title}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary/50 p-3 text-center sm:p-2.5"
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                  item.circle
                )}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <p className="text-xs font-bold leading-tight">{item.title}</p>
              <p className="text-[10px] leading-snug text-muted-foreground">
                {item.sub}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </ScrollReveal>
  );
}

// --- Leader card ---------------------------------------------------------

function LeaderCard({ tour }: { tour: Tour }) {
  const go = useGo();
  const leader = tour.leader;
  // Enrich the summary with the full leader record (specialties, tours count,
  // satisfaction). getLeader falls back to leaders[0], so guard against a
  // non-matching id to avoid showing wrong data for user-created tours.
  const found = getLeader(leader.id);
  const profile = found.id === leader.id ? found : undefined;
  return (
    <ScrollReveal>
      <button
        onClick={() => go("leader-profile", { id: leader.id })}
        className="group flex w-full flex-col gap-3 rounded-3xl border bg-card p-4 text-right transition-all hover:shadow-lg md:p-5"
      >
        <div className="flex items-center gap-4">
          <SmartImage
            src={leader.avatar}
            alt={leader.fullName}
            fallback="avatar"
            shimmer={false}
            aspectClass="h-16 w-16 shrink-0 rounded-2xl ring-2 ring-gold/30 sm:h-20 sm:w-20"
            className="h-full w-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-bold sm:text-base">{leader.fullName}</h3>
              {leader.verificationStatus === "verified" && (
                <span className="flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold text-emerald">
                  <ShieldCheck className="h-3 w-3" />
                  تأیید شده
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              راهنمای تور • {toFa(leader.experienceYears)} سال تجربه
              {profile && (
                <>
                  {" • "}
                  {toFa(profile.toursCount)} تور برگزارشده
                </>
              )}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1 font-bold">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                {toFa(leader.rating)}
              </span>
              {profile && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {toFa(profile.satisfaction)}٪ رضایت
                </span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground">
                <Camera className="h-3.5 w-3.5" />
                {toFa(tour.reviewsCount)} نظر
              </span>
            </div>
            {profile && profile.specialties.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.specialties.slice(0, 3).map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground sm:grid">
            <ArrowLeft className="h-4 w-4" />
          </div>
        </div>
        <span
          className={cn(
            "flex min-h-11 items-center justify-between gap-2 border-t pt-3 text-xs font-bold text-muted-foreground transition-colors group-hover:text-primary sm:min-h-0 sm:justify-start sm:gap-1.5"
          )}
        >
          مشاهده پروفایل
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        </span>
      </button>
    </ScrollReveal>
  );
}

// --- Related tours -------------------------------------------------------

function RelatedTourCard({ tour: t }: { tour: Tour }) {
  const go = useGo();
  const toggleCompare = useCompare((s) => s.toggle);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const mounted = useMounted();
  const compared = mounted && useCompare.getState().tourIds.includes(t.id);
  const fav = mounted && useWishlist.getState().tourIds.includes(t.id);
  const left = t.capacity - t.reservedCount;
  const finalPrice = t.discountPrice ?? t.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      onClick={() => go("tour-detail", { id: t.id })}
      className="group w-72 shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-lg sm:w-80"
    >
      <div className="relative h-40 overflow-hidden">
        <SmartImage
          src={t.images[0]}
          alt={t.title}
          fallback="tour"
          fallbackLabel={CATEGORY_LABELS[t.category]}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
        {t.discountPrice && (
          <div className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
            {toFa(Math.round((1 - t.discountPrice / t.price) * 100))}٪
          </div>
        )}
        {/* Wishlist heart (top-left) */}
        <IconTooltip label={fav ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"} side="left">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(t.id);
            }}
            aria-label="افزودن به علاقه‌مندی"
            className={cn(
              "absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition",
              fav
                ? "bg-sunset text-white shadow-md shadow-sunset/30"
                : "bg-cream/25 text-cream hover:bg-cream/40"
            )}
          >
            <HeartBurst active={fav}>
              <Heart className={cn("h-4 w-4 transition", fav && "fill-current")} />
            </HeartBurst>
          </button>
        </IconTooltip>
        {/* Compare (bottom-left) — now with a tooltip like the tours grid */}
        <div className="absolute bottom-2 left-2">
          <IconTooltip label={compared ? "حذف از مقایسه" : "افزودن به مقایسه"} side="right">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCompare(t.id);
              }}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full backdrop-blur transition",
                compared ? "bg-primary text-primary-foreground" : "bg-cream/25 text-cream hover:bg-cream/40"
              )}
              aria-label="مقایسه"
            >
              {compared ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
            </button>
          </IconTooltip>
        </div>
      </div>
      <div className="p-3">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {toFa(t.duration)} روز
          </span>
          <span className="flex items-center gap-1 font-bold">
            <Star className="h-3 w-3 fill-gold text-gold" />
            {toFa(t.rating)}
          </span>
        </div>
        <h4 className="line-clamp-1 text-sm font-bold">{t.title}</h4>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{t.destination}</p>
        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <p className="text-xs font-extrabold text-primary">{formatCurrency(finalPrice)}</p>
          {(() => {
            const ratio = tourFillRatio(t.reservedCount, t.capacity);
            const level = capacityLevel(ratio);
            const remaining = Math.max(0, t.capacity - t.reservedCount);
            return (
              <span className={cn("flex items-center gap-1 text-[10px] font-bold", levelTextClass(remaining <= 0 ? "full" : level))}>
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: fillColor(ratio, 66, 46) }}
                />
                {remaining <= 0 ? "تکمیل ظرفیت" : `${toFa(remaining)} نفر باقی`}
              </span>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}

function RelatedTours({ tour }: { tour: Tour }) {
  const related = React.useMemo(() => getRelatedTours(tour, 6), [tour]);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  if (related.length === 0) return null;

  const scroll = (dir: "next" | "prev") => {
    if (!scrollerRef.current) return;
    const w = scrollerRef.current.clientWidth * 0.8;
    scrollerRef.current.scrollBy({
      left: dir === "next" ? -w : w,
      behavior: "smooth",
    });
  };

  return (
    <section className="mt-16">
      <ScrollReveal y={20}>
        <div className="mb-6 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald/10 text-emerald">
              <Compass className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-extrabold leading-tight md:text-3xl">
              تورهای <span className="text-gradient-emerald">مرتبط</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("prev")}
              className="grid h-10 w-10 place-items-center rounded-full border bg-background transition hover:border-primary hover:text-primary max-sm:h-11 max-sm:w-11"
              aria-label="قبلی"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll("next")}
              className="grid h-10 w-10 place-items-center rounded-full border bg-background transition hover:border-primary hover:text-primary max-sm:h-11 max-sm:w-11"
              aria-label="بعدی"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </ScrollReveal>
      <div
        ref={scrollerRef}
        className="custom-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide"
      >
        {related.map((t) => (
          <RelatedTourCard key={t.id} tour={t} />
        ))}
      </div>
    </section>
  );
}

// --- Not found -----------------------------------------------------------

function NotFoundState({ id }: { id?: string }) {
  const go = useGo();
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 pt-24">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-pulse rounded-full bg-sunset/10 blur-2xl" />
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald/10 to-sunset/10">
            <Compass className="h-10 w-10 text-muted-foreground/60" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-extrabold">تور پیدا نشد</h1>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {id
            ? `توری با شناسه «${id}» در سیستم موجود نیست یا حذف شده است.`
            : "لطفاً از لیست تورها یک مورد را انتخاب کنید."}
        </p>
        <Button onClick={() => go("tours")} className="gap-2 rounded-xl bg-primary text-primary-foreground">
          <ArrowRight className="h-4 w-4" />
          بازگشت به لیست تورها
        </Button>
      </div>
    </div>
  );
}

// --- Main view -----------------------------------------------------------

export function TourDetailView() {
  // Read the [id] route param directly via Next.js useParams().
  // We avoid useViewParams() here because it also calls useSearchParams(),
  // which can yield an unstable empty result on first client render before
  // the route context hydrates, leaving `id` undefined and crashing the
  // tour lookup. useParams() returns the path segment synchronously.
  const params = useParams();
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) as
    | string
    | undefined;
  const go = useGo();
  const trackRecent = useRecent((s) => s.track);
  const [tour, setTour] = React.useState<Tour | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);
  // Mobile sticky CTA visibility — becomes true once the booking box has
  // scrolled out of the viewport (hooks stay above the early returns).
  // Uses an IntersectionObserver instead of a scroll listener (v17 cleanup):
  // the observer fires on scroll/resize/layout changes AND once on observe,
  // giving the same "el.bottom < 0" semantics without per-frame work.
  const bookingRef = React.useRef<HTMLDivElement | null>(null);
  const [ctaVisible, setCtaVisible] = React.useState(false);

  React.useEffect(() => {
    const el = bookingRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setCtaVisible(
          !entry.isIntersecting && entry.boundingClientRect.bottom < 0
        ),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, tour]);

  React.useEffect(() => {
    setLoading(true);
    setCtaVisible(false);
    // Try to find the tour in the merged list (published drafts + mock).
    // Fall back to getTour() which only searches the mock array.
    const allTours = getAllTours();
    const t = id ? allTours.find((tour) => tour.id === id) ?? getTour(id) : undefined;
    setTour(t);
    if (t) trackRecent(t.id);
    const tt = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(tt);
  }, [id, trackRecent]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-24 md:px-6 md:pt-28">
        <div className="shimmer-bg mb-4 h-4 w-32 rounded" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="shimmer-bg aspect-[16/10] w-full rounded-3xl" />
            <div className="shimmer-bg h-8 w-2/3 rounded-xl" />
            <div className="shimmer-bg h-32 w-full rounded-2xl" />
          </div>
          <div className="shimmer-bg h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!tour) {
    return <NotFoundState id={id} />;
  }

  const CatIcon = CATEGORY_ICONS[tour.category];
  const left = tour.capacity - tour.reservedCount;

  return (
    <div className="relative min-h-screen pb-20 pt-24 md:pt-28 max-lg:pb-40">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-emerald/10 blur-3xl" />
        <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Breadcrumb */}
        <ScrollReveal y={10} className="mb-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <button onClick={() => go("home")} className="transition hover:text-primary">
              خانه
            </button>
            <ChevronLeft className="h-3 w-3" />
            <button onClick={() => go("tours")} className="transition hover:text-primary">
              تورها
            </button>
            <ChevronLeft className="h-3 w-3" />
            <span className="font-bold text-foreground">{tour.destination}</span>
          </nav>
        </ScrollReveal>

        {/* Title */}
        <ScrollReveal y={12} className="mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <CatIcon className="h-3.5 w-3.5" />
                  {CATEGORY_LABELS[tour.category]}
                </span>
                <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", DIFFICULTY_COLORS[tour.difficulty])}>
                  <Mountain className="h-3.5 w-3.5" />
                  {DIFFICULTY_LABELS[tour.difficulty]}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {tour.destination}، {tour.province}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold leading-tight md:text-4xl">
                {tour.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  <b>{toFa(tour.rating)}</b>
                  <span className="text-muted-foreground">({toFa(tour.reviewsCount)} نظر)</span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {toFa(tour.duration)} روز
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {toPersianDate(tour.startDate)}
                </span>
                {(() => {
                  const ratio = tourFillRatio(tour.reservedCount, tour.capacity);
                  const level = capacityLevel(ratio);
                  const isFull = left <= 0;
                  return (
                    <span className={cn("flex items-center gap-1.5 font-bold", levelTextClass(isFull ? "full" : level))}>
                      <Users className="h-4 w-4" />
                      {isFull
                        ? "تکمیل ظرفیت"
                        : left <= 5
                          ? `تنها ${toFa(left)} نفر باقی!`
                          : `${toFa(left)} نفر ظرفیت`}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Gallery + Booking */}
        <div ref={bookingRef} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Gallery tour={tour} />
            <TrustStrip />
            <LeaderCard tour={tour} />
            <FitScoreBreakdown tour={tour} />
            <SafetyScoreCard tour={tour} />
            <BuddyOptInToggle tourId={tour.id} />
          </div>
          <BookingBox tour={tour} />
        </div>

        {/* Tabs */}
        <ScrollReveal y={16} className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-secondary/60 p-1.5">
              <TabsTrigger value="description" className="rounded-xl px-4 py-2 text-sm font-bold">
                توضیحات
              </TabsTrigger>
              <TabsTrigger value="itinerary" className="rounded-xl px-4 py-2 text-sm font-bold">
                برنامه روز به روز
                <Badge variant="secondary" className="mr-1 bg-background px-1.5 py-0 text-[10px]">
                  {toFa(tour.itinerary.length)}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="facilities" className="rounded-xl px-4 py-2 text-sm font-bold">
                امکانات
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-xl px-4 py-2 text-sm font-bold">
                نظرات
                <Badge variant="secondary" className="mr-1 bg-background px-1.5 py-0 text-[10px]">
                  {toFa(tour.reviews.length)}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <DescriptionTab tour={tour} />
            </TabsContent>
            <TabsContent value="itinerary" className="mt-6">
              <ItineraryTab tour={tour} />
            </TabsContent>
            <TabsContent value="facilities" className="mt-6">
              <FacilitiesTab tour={tour} />
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <ReviewsTab tour={tour} />
            </TabsContent>
          </Tabs>
        </ScrollReveal>

        {/* Trip Kit (v19) — کیت تجهیزات یک‌کلیکی این تور */}
        <ScrollReveal y={16} className="mt-8">
          <TripKitSection tour={tour} />
        </ScrollReveal>

        {/* Competing tours */}
        <CompetingToursSection tour={tour} />

        {/* Difficulty guide + packing list */}
        <DifficultyGuide tour={tour} />

        {/* Fitness tips */}
        <FitnessTips tour={tour} />

        {/* FAQ */}
        <TourFAQ tour={tour} />

        {/* Related tours */}
        <RelatedTours tour={tour} />
      </div>

      {/* Sticky mobile booking bar (hidden ≥lg — BookingBox is sticky there) */}
      <MobileStickyCTA tour={tour} visible={ctaVisible} />
    </div>
  );
}
