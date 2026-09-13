"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Calendar,
  CalendarDays,
  Tag,
  Minus,
  Plus,
  ChevronLeft,
  Mountain,
  Tent,
  Shirt,
  Compass,
  ShieldCheck,
  Truck,
  RefreshCw,
  Package,
  Home as HomeIcon,
  AlertCircle,
  ZoomIn,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { getProduct, equipment } from "@/mocks/equipment";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { useViewParams } from "@/lib/use-view-params";
import { useCart } from "@/store/cart-store";
import { toFa, formatCurrency, toPersianDate, toPersianShortDate } from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";
import { EquipmentReviewsSection } from "@/components/equipment/equipment-reviews-section";
import { QASection } from "@/components/equipment/qa-section";
import { StockCountdown } from "@/components/equipment/stock-countdown";
import {
  stockFillRatio,
  fillColor,
  capacityLevel,
  levelTextClass,
  levelChipClass,
} from "@/lib/capacity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { JalaliCalendar } from "@/components/common/jalali-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProductCard } from "@/components/home/popular-equipment";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addDays } from "date-fns";

const CAT_LABELS: Record<string, string> = {
  mountaineering: "کوهنوردی",
  camping: "کمپینگ",
  clothing: "پوشاک",
  "travel-gear": "تجهیزات سفر",
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  mountaineering: <Mountain className="h-3.5 w-3.5" />,
  camping: <Tent className="h-3.5 w-3.5" />,
  clothing: <Shirt className="h-3.5 w-3.5" />,
  "travel-gear": <Compass className="h-3.5 w-3.5" />,
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i <= Math.round(rating)
              ? "fill-gold text-gold"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

function Breadcrumb({ product }: { product: { category: string; title: string } }) {
  const go = useGo();
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      <button
        onClick={() => go("home")}
        className="inline-flex items-center gap-1 transition hover:text-primary"
      >
        <HomeIcon className="h-3.5 w-3.5" />
        خانه
      </button>
      <ChevronLeft className="h-3.5 w-3.5" />
      <button
        onClick={() => go("equipment")}
        className="transition hover:text-primary"
      >
        فروشگاه
      </button>
      <ChevronLeft className="h-3.5 w-3.5" />
      <button
        onClick={() => go("equipment")}
        className="inline-flex items-center gap-1 transition hover:text-primary"
      >
        {CAT_ICONS[product.category]}
        {CAT_LABELS[product.category]}
      </button>
      <ChevronLeft className="h-3.5 w-3.5" />
      <span className="line-clamp-1 max-w-[200px] font-medium text-foreground">
        {product.title}
      </span>
    </nav>
  );
}

function NotFound() {
  const go = useGo();
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 pt-28">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground">
          <AlertCircle className="h-9 w-9" />
        </div>
        <div>
          <p className="text-lg font-bold">محصول یافت نشد</p>
          <p className="mt-1 text-sm text-muted-foreground">
            شاید این محصول دیگر در دسترس نباشد.
          </p>
        </div>
        <Button onClick={() => go("equipment")} className="bg-primary text-primary-foreground">
          بازگشت به فروشگاه
        </Button>
      </div>
    </div>
  );
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [zoomed, setZoomed] = React.useState(false);
  const [zoomPos, setZoomPos] = React.useState({ x: 50, y: 50 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // Touch equivalents so mobile users get the same zoom interaction
  // (bug class «چ» — mouse-only interactions without a touch fallback).
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((touch.clientX - rect.left) / rect.width) * 100,
      y: ((touch.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="space-y-4">
      <motion.div
        key={activeIdx}
        initial={{ opacity: 0.6, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMove}
        onTouchStart={(e) => {
          setZoomed(true);
          handleTouchMove(e);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setZoomed(false)}
        className="group relative aspect-square touch-none overflow-hidden rounded-3xl border bg-card shadow-xl shadow-forest/5"
      >
        <SmartImage
          src={images[activeIdx]}
          alt={title}
          fallback="equipment"
          fallbackLabel="تجهیز"
          className="h-full w-full object-cover"
          style={{
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            transform: zoomed ? "scale(1.6)" : "scale(1)",
            transitionProperty: "transform, opacity",
            transitionDuration: "300ms",
          }}
        />
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-forest/60 px-2.5 py-1 text-[10px] font-bold text-cream backdrop-blur">
          <ZoomIn className="h-3 w-3" />
          <span className="sm:hidden">برای بزرگنمایی انگشت را بکش</span>
          <span className="hidden sm:inline">برای بزرگنمایی نشانگر را نگه دار</span>
        </div>
      </motion.div>
      {images.length > 1 && (
        <div className="custom-scroll flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition",
                i === activeIdx
                  ? "border-primary shadow-md shadow-primary/20"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <SmartImage src={img} alt="" fallback="equipment" shimmer={false} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SaleMode({
  product,
}: {
  product: NonNullable<ReturnType<typeof getProduct>>;
}) {
  const addEquipment = useCart((s) => s.addEquipment);
  const setCartOpen = useNav((s) => s.setCartOpen);
  const [qty, setQty] = React.useState(1);
  const max = product.stock;
  const outOfStock = max <= 0;
  const saleRatio = stockFillRatio(max);
  const saleLevel = capacityLevel(saleRatio);

  const handleAdd = () => {
    if (outOfStock) {
      toast.error("موجودی فروش این محصول تمام شده است");
      return;
    }
    if (qty < 1) return;
    addEquipment({
      type: "equipment-sale",
      refId: product.id,
      title: product.title,
      image: product.images[0],
      unitPrice: product.price,
      quantity: qty,
    });
    toast.success("به کوله‌پشتی اضافه شد", {
      description: `${product.title} • ${toFa(qty)} عدد`,
    });
    setCartOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border bg-card p-4">
        <div>
          <p className="text-xs text-muted-foreground">موجودی انبار</p>
          {outOfStock ? (
            <p className="text-sm font-bold text-destructive">ناموجود</p>
          ) : (
            <p className={cn("text-sm font-bold", levelTextClass(saleLevel))}>
              {max <= 5 ? "تنها " : ""}
              {toFa(max)} عدد در انبار
            </p>
          )}
          {/* Smooth green→red availability bar */}
          <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(6, (1 - saleRatio) * 100)}%`,
                backgroundColor: fillColor(saleRatio),
              }}
            />
          </div>
        </div>
        <div className={cn("flex items-center gap-1 rounded-xl border bg-background", outOfStock && "opacity-40")}>
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={outOfStock}
            className="grid h-9 w-9 place-items-center rounded-r-lg hover:bg-secondary max-sm:h-11 max-sm:w-11"
            aria-label="کاهش تعداد"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-bold">{toFa(qty)}</span>
          <button
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            disabled={outOfStock}
            className="grid h-9 w-9 place-items-center rounded-l-lg hover:bg-secondary max-sm:h-11 max-sm:w-11"
            aria-label="افزایش تعداد"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-primary/5 p-4">
        <span className="text-sm font-bold text-muted-foreground">جمع کل</span>
        <span className="text-xl font-extrabold text-primary">
          {formatCurrency(product.price * qty)}
        </span>
      </div>

      <Button
        onClick={handleAdd}
        size="lg"
        disabled={outOfStock}
        className={cn(
          "h-13 w-full rounded-2xl text-base shadow-lg transition",
          outOfStock
            ? "cursor-not-allowed bg-muted text-muted-foreground shadow-none"
            : "bg-primary text-primary-foreground shadow-primary/20 hover:bg-emerald-dark"
        )}
      >
        <ShoppingCart className="h-5 w-5" />
        {outOfStock ? "موجودی فروش تمام شده است" : "افزودن به سبد خرید"}
      </Button>

      {/* Rent inventory — always visible so both pools are transparent */}
      {(() => {
        const rent = product.rentStock ?? product.stock;
        const rentRatio = stockFillRatio(rent);
        const rentLevel = capacityLevel(rentRatio);
        return (
          <div
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-bold",
              rent <= 0 ? levelChipClass("full") : levelChipClass(rentLevel)
            )}
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              موجودی اجاره
            </span>
            <span>
              {rent <= 0
                ? "ناموجود"
                : `${rent <= 5 ? "تنها " : ""}${toFa(rent)} عدد آماده اجاره`}
            </span>
          </div>
        );
      })()}

      {/* Live stock countdown */}
      {max > 0 && max <= 10 && <StockCountdown stock={max} />}
    </div>
  );
}

function RentMode({
  product,
}: {
  product: NonNullable<ReturnType<typeof getProduct>>;
}) {
  const addEquipment = useCart((s) => s.addEquipment);
  const setCartOpen = useNav((s) => s.setCartOpen);
  const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
  const [days, setDays] = React.useState(3);
  const perDay = product.rentPricePerDay ?? 0;
  const total = perDay * days;
  const rentStock = product.rentStock ?? product.stock;
  const rentOut = rentStock <= 0;

  const endDate = React.useMemo(() => {
    if (!startDate) return null;
    return addDays(startDate, days - 1);
  }, [startDate, days]);

  const handleRent = () => {
    if (rentOut) {
      toast.error("موجودی اجاره این محصول تمام شده است");
      return;
    }
    if (!startDate) {
      toast.error("تاریخ شروع اجاره را انتخاب کنید");
      return;
    }
    addEquipment({
      type: "equipment-rent",
      refId: product.id,
      title: product.title,
      image: product.images[0],
      unitPrice: perDay,
      quantity: 1,
      meta: {
        rentDays: days,
        rentStart: startDate.toISOString(),
        rentEnd: endDate ? endDate.toISOString() : undefined,
      },
    });
    toast.success("اجاره ثبت شد", {
      description: `${product.title} • ${toFa(days)} روز`,
    });
    setCartOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
            تاریخ شروع
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-11 w-full justify-start rounded-xl text-right font-medium"
              >
                <Calendar className="h-4 w-4 text-primary" />
                {startDate
                  ? toPersianDate(startDate.toISOString())
                  : "انتخاب تاریخ"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className="w-auto p-0"
            >
              <JalaliCalendar
                mode="single"
                selected={startDate}
                onSelect={(d) => d && setStartDate(d)}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                defaultMonth={startDate}
                modifiers={{
                  rentSpan: (date) =>
                    !!startDate && !!endDate && date >= startDate && date <= endDate,
                }}
                modifiersClassNames={{
                  rentSpan:
                    "!bg-sunset/15 !text-sunset !font-bold !rounded-none data-[selected-single=true]:!bg-sunset",
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
            مدت اجاره (روز)
          </label>
          <div className="flex h-11 items-center justify-between rounded-xl border bg-background px-2">
            <button
              onClick={() => setDays((d) => Math.max(1, d - 1))}
              className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunset/50 active:scale-95 max-sm:h-11 max-sm:w-11"
              aria-label="کاهش روز"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold">{toFa(days)} روز</span>
            <button
              onClick={() => setDays((d) => Math.min(30, d + 1))}
              className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunset/50 active:scale-95 max-sm:h-11 max-sm:w-11"
              aria-label="افزایش روز"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {endDate && (
        <div className="flex items-center justify-between rounded-2xl border border-sunset/20 bg-sunset/5 p-3 text-sm">
          <span className="text-muted-foreground">تاریخ تحویل</span>
          <span className="font-bold text-sunset">
            {toPersianDate(endDate.toISOString())}
          </span>
        </div>
      )}

      {/* Rental window — always visible so the traveler sees the exact span */}
      {startDate && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border bg-card px-3 py-2.5 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-sunset" />
          <span>
            بازه اجاره: {toPersianShortDate(startDate.toISOString())}
            {endDate && ` تا ${toPersianShortDate(endDate.toISOString())}`}
          </span>
          <span className="ms-auto rounded-full bg-sunset/10 px-2 py-0.5 font-bold text-sunset">
            {toFa(days)} شب رزرو
          </span>
        </div>
      )}

      {/* Rental inventory — color-coded green→red on the shared scale */}
      {(() => {
        const ratio = stockFillRatio(rentStock);
        const level = capacityLevel(ratio);
        return (
          <div
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3",
              rentOut ? levelChipClass("full") : levelChipClass(level)
            )}
          >
            <span className="flex items-center gap-1.5 text-xs font-bold">
              <Package className="h-4 w-4" />
              موجودی اجاره
            </span>
            <span className="text-xs font-bold">
              {rentOut
                ? "ناموجود"
                : `${rentStock <= 5 ? "تنها " : ""}${toFa(rentStock)} عدد آماده تحویل`}
            </span>
          </div>
        );
      })()}

      <div className="space-y-2 rounded-2xl bg-sunset/5 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">اجاره روزانه</span>
          <span className="font-bold">{formatCurrency(perDay)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">تعداد روز</span>
          <span className="font-bold">{toFa(days)} روز</span>
        </div>
        <Separator className="my-1" />
        <div className="flex items-center justify-between">
          <span className="font-bold">جمع کل اجاره</span>
          <span className="text-xl font-extrabold text-sunset">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <Button
        onClick={handleRent}
        size="lg"
        disabled={rentOut}
        className={cn(
          "h-13 w-full rounded-2xl text-base shadow-lg transition",
          rentOut
            ? "cursor-not-allowed bg-muted text-muted-foreground shadow-none"
            : "bg-sunset text-white shadow-sunset/20 hover:bg-sunset-dark"
        )}
      >
        <Calendar className="h-5 w-5" />
        {rentOut ? "موجودی اجاره تمام شده است" : "ثبت درخواست اجاره"}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
        قابل بازگشت پس از پایان مدت اجاره
      </p>
    </div>
  );
}

function SpecsTable({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-3xl border bg-card">
      <div className="border-b bg-secondary/50 p-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Package className="h-5 w-5 text-primary" />
          مشخصات محصول
        </h3>
      </div>
      <div className="divide-y">
        {specs.map((spec, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between gap-4 p-4 transition hover:bg-secondary/30",
              i % 2 === 0 && "bg-secondary/20"
            )}
          >
            <span className="text-sm text-muted-foreground">{spec.label}</span>
            <span className="text-sm font-bold">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustBadges() {
  const items = [
    { icon: <ShieldCheck className="h-5 w-5" />, title: "ضمانت اصالت", desc: "ضمانت بازگشت وجه" },
    { icon: <Truck className="h-5 w-5" />, title: "ارسال سریع", desc: "تا ۲۴ ساعت در تهران" },
    { icon: <RefreshCw className="h-5 w-5" />, title: "بازگشت اجاره", desc: "پس از اتمام دوره" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-3 text-center"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            {it.icon}
          </span>
          <p className="text-xs font-bold leading-tight">{it.title}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">{it.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailView() {
  const params = useViewParams();
  const id = params.id;
  const product = React.useMemo(() => (id ? getProduct(id) : undefined), [id]);

  const related = React.useMemo(
    () =>
      product
        ? equipment
            .filter((e) => e.category === product.category && e.id !== product.id)
            .slice(0, 8)
        : [],
    [product]
  );

  const relatedScrollerRef = React.useRef<HTMLDivElement>(null);
  const scrollRelated = (dir: "next" | "prev") => {
    if (!relatedScrollerRef.current) return;
    const w = relatedScrollerRef.current.clientWidth * 0.8;
    relatedScrollerRef.current.scrollBy({
      left: dir === "next" ? -w : w,
      behavior: "smooth",
    });
  };

  if (!product) return <NotFound />;

  const initialMode: "sale" | "rent" = product.availableForSale ? "sale" : "rent";

  return (
    <div className="min-h-screen bg-background pb-24 pt-24">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6">
        <ScrollReveal>
          <Breadcrumb product={product} />
        </ScrollReveal>
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <ScrollReveal>
            <Gallery images={product.images} title={product.title} />
          </ScrollReveal>

          {/* Details */}
          <ScrollReveal delay={0.1}>
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/10 text-primary">
                  {CAT_ICONS[product.category]}
                  {CAT_LABELS[product.category]}
                </Badge>
                <span className="text-xs font-bold text-muted-foreground">
                  {product.brand}
                </span>
                {product.condition === "used" && (
                  <Badge variant="secondary" className="bg-forest/10 text-foreground">
                    دست دوم
                  </Badge>
                )}
                {product.rating >= 4.8 && (
                  <Badge className="bg-gold/15 text-gold">
                    <Star className="h-3 w-3 fill-gold" />
                    منتخب کوچ‌نشین
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">
                  {product.title}
                </h1>
                <div className="mt-3 flex items-center gap-3">
                  <StarRating rating={product.rating} />
                  <span className="text-sm font-bold">{toFa(product.rating)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({toFa(Math.round(product.rating * 47))} نظر)
                  </span>
                </div>
              </div>

              {/* Mode toggle + price */}
              <ModeSection product={product} initialMode={initialMode} />

              <TrustBadges />
            </div>
          </ScrollReveal>
        </div>

        {/* Description + Specs */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScrollReveal>
            <div className="rounded-3xl border bg-card p-6">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <Package className="h-5 w-5 text-primary" />
                درباره محصول
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                این محصول از برند معتبر {product.brand} با کیفیت تضمینی و امکان
                بازگشت در صورت بروز مشکل، در دسترس شما قرار دارد. اگر قصد سفر
                طبیعت‌گردی، کوهنوردی یا کمپینگ دارید، این گزینه می‌تواند همراه
                مطمئن شما باشد.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <SpecsTable specs={product.specs} />
          </ScrollReveal>
        </div>

        {/* Reviews section */}
        <div className="mt-16">
          <ScrollReveal>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-sunset">
                  نظرات کاربران
                </p>
                <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">
                  تجربه‌های واقعی
                </h2>
              </div>
            </div>
          </ScrollReveal>
          <EquipmentReviewsSection
            productId={product.id}
            productTitle={product.title}
            baseRating={product.rating}
            baseReviewsCount={Math.floor(product.rating * 12)}
          />

          {/* Q&A Section */}
          <div className="mt-12">
            <QASection productId={product.id} productTitle={product.title} />
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16">
            <ScrollReveal>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">
                    محصولات مرتبط
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">
                    پیشنهادهای مشابه
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollRelated("prev")}
                    className="grid h-10 w-10 place-items-center rounded-full border bg-background transition hover:border-primary hover:text-primary max-sm:h-11 max-sm:w-11"
                    aria-label="قبلی"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => scrollRelated("next")}
                    className="grid h-10 w-10 place-items-center rounded-full border bg-background transition hover:border-primary hover:text-primary max-sm:h-11 max-sm:w-11"
                    aria-label="بعدی"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </ScrollReveal>
            <div
              ref={relatedScrollerRef}
              className="custom-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide"
            >
              {related.map((p) => (
                <div key={p.id} className="w-64 shrink-0 snap-start sm:w-72">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeSection({
  product,
  initialMode,
}: {
  product: NonNullable<ReturnType<typeof getProduct>>;
  initialMode: "sale" | "rent";
}) {
  const [mode, setMode] = React.useState<"sale" | "rent">(initialMode);
  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-2xl border bg-card p-1">
        {product.availableForSale && (
          <button
            onClick={() => setMode("sale")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition",
              mode === "sale"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Tag className="h-4 w-4" />
            خرید
            <span className="text-xs opacity-80">
              {formatCurrency(product.price)}
            </span>
          </button>
        )}
        {product.availableForRent && product.rentPricePerDay && (
          <button
            onClick={() => setMode("rent")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition",
              mode === "rent"
                ? "bg-sunset text-white shadow-md shadow-sunset/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="h-4 w-4" />
            اجاره
            <span className="text-xs opacity-80">
              {formatCurrency(product.rentPricePerDay)}/روز
            </span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {mode === "sale" ? <SaleMode product={product} /> : <RentMode product={product} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
