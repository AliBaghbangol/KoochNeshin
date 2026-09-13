"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Star,
  ArrowLeft,
  ShoppingCart,
  Calendar,
  Tag,
  Package,
  PackageX,
  Flame,
  Heart,
  Check,
  GitCompare,
} from "lucide-react";
import { equipment } from "@/mocks/equipment";
import { useGo } from "@/lib/use-go";
import { useCart } from "@/store/cart-store";
import { useWishlist } from "@/store/wishlist-store";
import { useEquipmentCompare } from "@/store/equipment-compare-store";
import { toFa, formatCurrency } from "@/lib/format";
import {
  stockFillRatio,
  fillColor,
  capacityLevel,
  levelTextClass,
} from "@/lib/capacity";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { HeartBurst } from "@/components/animations/heart-burst";
import { useMounted } from "@/hooks/use-mounted";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CAT_LABELS: Record<string, string> = {
  mountaineering: "کوهنوردی",
  camping: "کمپینگ",
  clothing: "پوشاک",
  "travel-gear": "تجهیزات سفر",
};

function ProductCard({ product }: { product: (typeof equipment)[number] }) {
  const go = useGo();
  const addEquipment = useCart((s) => s.addEquipment);
  const { toggleEquipment, hasEquipment } = useWishlist();
  const { toggle: toggleCompare, has: hasCompare } = useEquipmentCompare();
  // Mount gate — see useMounted: deferred Suspense sections can hydrate
  // after the app-shell rehydrate() effect, so persisted-store visuals must
  // start in their server (default) state on the hydration render.
  const mounted = useMounted();
  const isFav = mounted && hasEquipment(product.id);
  const isCompared = mounted && hasCompare(product.id);
  const [justAdded, setJustAdded] = React.useState(false);
  const [mode, setMode] = React.useState<"sale" | "rent">(
    product.availableForSale ? "sale" : "rent"
  );

  const price = mode === "sale" ? product.price : product.rentPricePerDay ?? 0;
  // Mode-aware inventory on the shared green→red scale (same as /equipment)
  const currentStock =
    mode === "sale" ? product.stock : product.rentStock ?? product.stock;
  const outOfStock = currentStock <= 0;
  const stockRatio = stockFillRatio(currentStock);
  const stockLevel = capacityLevel(stockRatio);

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) {
      toast.error("موجودی تمام شده است", {
        description:
          mode === "rent"
            ? "این تجهیز در حال حاضر برای اجاره موجود نیست."
            : "این تجهیز در حال حاضر برای خرید موجود نیست.",
      });
      return;
    }
    addEquipment({
      type: mode === "sale" ? "equipment-sale" : "equipment-rent",
      refId: product.id,
      title: product.title,
      image: product.images[0],
      unitPrice: price,
      quantity: 1,
      meta: mode === "rent" ? { rentDays: 1 } : undefined,
    });
    toast.success("به کوله‌پشتی اضافه شد", {
      description: product.title,
    });
    // Micro-interaction (brief §35): brief confirmation state on the button.
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleEquipment(product.id);
    toast.success(isFav ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها اضافه شد", {
      description: product.title,
    });
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      onClick={() => go("product-detail", { id: product.id })}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-300 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 dark:hover:border-gold/50 dark:hover:shadow-gold/15"
    >
      <div className="relative h-52 overflow-hidden">
        <SmartImage
          src={product.images[0]}
          alt={product.title}
          fallback="equipment"
          fallbackLabel={CAT_LABELS[product.category]}
          className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/40 to-transparent" />
        {product.condition === "used" && (
          <span className="absolute right-3 top-3 rounded-full bg-forest/70 px-2 py-0.5 text-[10px] font-bold text-cream backdrop-blur">
            دست دوم
          </span>
        )}
        {(() => {
          // Mode-aware availability chip on the photo (same as /equipment):
          // red «ناموجود» when the current mode has no stock, orange when low.
          // Sits BELOW the wishlist heart (top-14) — same slot as the tour
          // cards' discount badge.
          if (outOfStock) {
            return (
              <span className="absolute left-3 top-14 rounded-full bg-destructive/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur">
                ناموجود
              </span>
            );
          }
          if (currentStock <= 5) {
            return (
              <span className="absolute left-3 top-14 rounded-full bg-sunset/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur">
                تنها {toFa(currentStock)} عدد
              </span>
            );
          }
          return null;
        })()}
        {/* Wishlist heart — top-left, same slot as tour cards */}
        <IconTooltip label={isFav ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"} side="left">
          <button
            onClick={toggleFav}
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
        {/* Compare — labeled pill, bottom-left, identical format to tour cards.
            The compare drawer itself is mounted globally in the app-shell,
            so comparing from the home page works too. */}
        <IconTooltip label={isCompared ? "حذف از مقایسه" : "افزودن به مقایسه"} side="left">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(product.id);
              if (!isCompared) toast.success("به مقایسه اضافه شد", { description: product.title });
            }}
            aria-label="افزودن به مقایسه"
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
        <div className="absolute bottom-3 right-3">
          <span className="rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-bold text-forest backdrop-blur">
            {CAT_LABELS[product.category]}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-bold text-primary transition group-hover:text-gold dark:group-hover:text-gold-light">{product.brand}</span>
          <span className="flex items-center gap-0.5 font-semibold transition group-hover:text-gold dark:group-hover:text-gold-light">
            <Star className="h-3.5 w-3.5 fill-gold text-gold transition group-hover:scale-110" />
            {toFa(product.rating)}
          </span>
        </div>
        <h3 className="line-clamp-2 font-bold leading-7 transition group-hover:text-gold dark:group-hover:text-gold-light">
          {product.title}
        </h3>

        {/* Sale / Rent toggle */}
        <div className="mt-3 flex rounded-xl border p-0.5">
          {product.availableForSale && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMode("sale");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition max-sm:py-3.5",
                mode === "sale"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Tag className="h-3 w-3" /> خرید
            </button>
          )}
          {product.availableForRent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMode("rent");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition max-sm:py-3.5",
                mode === "rent"
                  ? "bg-accent text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="h-3 w-3" /> اجاره
            </button>
          )}
        </div>

        {/* Mode-aware colored stock meter — same language as /equipment */}
        {outOfStock ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[11px] font-bold text-destructive">
            <span className="flex items-center gap-1">
              <PackageX className="h-3.5 w-3.5" />
              موجودی {mode === "sale" ? "فروش" : "اجاره"}
            </span>
            <span>ناموجود</span>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-border/60 bg-background/60 px-2.5 py-1.5">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Package className="h-3 w-3" />
                موجودی {mode === "sale" ? "فروش" : "اجاره"}
              </span>
              <span className={cn("flex items-center gap-1", levelTextClass(stockLevel))}>
                {currentStock <= 5 && <Flame className="h-3 w-3" />}
                {toFa(currentStock)} عدد
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(6, (1 - stockRatio) * 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: fillColor(stockRatio) }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-extrabold text-primary transition group-hover:text-gold dark:group-hover:text-gold-light">
              {formatCurrency(price)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {mode === "rent" ? "برای هر روز" : "قیمت خرید"}
            </p>
          </div>
          <IconTooltip label={outOfStock ? "موجودی تمام شده" : "افزودن به سبد خرید"} side="left">
            <button
              onClick={addToCart}
              disabled={outOfStock}
              aria-label="افزودن به سبد خرید"
              aria-disabled={outOfStock}
              className={cn(
                "relative max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']",
                "grid h-10 w-10 place-items-center rounded-xl transition",
                outOfStock
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground",
                !outOfStock &&
                  "group-hover:bg-gradient-to-br group-hover:from-gold group-hover:to-gold-light group-hover:text-forest group-hover:shadow-lg group-hover:shadow-gold/30 hover:scale-105"
              )}
            >
              {outOfStock ? (
                <PackageX className="h-4 w-4" />
              ) : justAdded ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </button>
          </IconTooltip>
        </div>
      </div>
    </motion.div>
  );
}

export function PopularEquipment() {
  const go = useGo();
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

  const items = equipment.slice(0, 8);

  return (
    <section className="relative overflow-hidden bg-secondary/40 py-20 md:py-28">
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-emerald/5 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald/10 text-emerald">
                <Package className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald">
                فروشگاه تجهیزات
              </span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">
              تجهیزاتت را <span className="text-gradient-emerald">اجاره</span> یا
              بخر
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              از چادر کمپ تا کوله حرفه‌ای — همه‌چیز برای سفر و طبیعت‌گردی.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("prev")}
              className="grid h-11 w-11 place-items-center rounded-full border bg-background transition hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </button>
            <button
              onClick={() => scroll("next")}
              className="grid h-11 w-11 place-items-center rounded-full border bg-background transition hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </ScrollReveal>

        <div
          ref={scrollerRef}
          className="custom-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 scrollbar-hide"
        >
          {items.map((p) => (
            <div
              key={p.id}
              className="w-72 max-sm:w-[78vw] shrink-0 snap-start sm:w-80"
            >
              <ProductCard product={p} />
            </div>
          ))}
          <button
            onClick={() => go("equipment")}
            className="grid w-72 max-sm:w-[78vw] shrink-0 snap-start place-items-center rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 text-center sm:w-80"
          >
            <div>
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <ArrowLeft className="h-6 w-6" />
              </div>
              <p className="font-bold text-primary">همه تجهیزات</p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}

export { ProductCard };
