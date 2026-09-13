"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mountain,
  Tent,
  Shirt,
  Compass,
  Layers,
  Star,
  ShoppingCart,
  Tag,
  Calendar,
  Package,
  PackageX,
  Flame,
  SlidersHorizontal,
  X,
  SearchX,
  Check,
  ArrowUpDown,
  Sparkles,
  Heart,
  GitCompare,
} from "lucide-react";
import { equipment } from "@/mocks/equipment";
import { useNav } from "@/store/nav-store";
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
  levelChipClass,
} from "@/lib/capacity";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/animations/scroll-reveal";
import { HeartBurst } from "@/components/animations/heart-burst";
import { SmartImage } from "@/components/common/smart-image";
import { BundleDeals } from "@/components/equipment/bundle-deals";
import { IconTooltip } from "@/components/common/icon-tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import type { EquipmentProduct } from "@/types";

type CategoryKey = "all" | "mountaineering" | "camping" | "clothing" | "travel-gear";
type SortKey = "popular" | "price-asc" | "price-desc" | "rating";
type ConditionKey = "all" | "new" | "used";
type AvailabilityKey = "all" | "sale" | "rent";

const CATEGORIES: { key: CategoryKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "همه", icon: <Layers className="h-4 w-4" /> },
  { key: "mountaineering", label: "کوهنوردی", icon: <Mountain className="h-4 w-4" /> },
  { key: "camping", label: "کمپینگ", icon: <Tent className="h-4 w-4" /> },
  { key: "clothing", label: "پوشاک", icon: <Shirt className="h-4 w-4" /> },
  { key: "travel-gear", label: "تجهیزات سفر", icon: <Compass className="h-4 w-4" /> },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "محبوب‌ترین" },
  { key: "price-asc", label: "ارزان‌ترین" },
  { key: "price-desc", label: "گران‌ترین" },
  { key: "rating", label: "بالاترین امتیاز" },
];

const CONDITION_LABELS: Record<ConditionKey, string> = {
  all: "همه",
  new: "نو",
  used: "دست دوم",
};

const CAT_LABELS: Record<string, string> = {
  mountaineering: "کوهنوردی",
  camping: "کمپینگ",
  clothing: "پوشاک",
  "travel-gear": "تجهیزات سفر",
};

interface Filters {
  category: CategoryKey;
  brands: string[];
  condition: ConditionKey;
  availability: AvailabilityKey;
  priceRange: [number, number];
  sort: SortKey;
  query: string;
}

const PRICE_MIN = 1_000_000;
const PRICE_MAX = 7_000_000;

function useUniqueBrands() {
  return React.useMemo(
    () => Array.from(new Set(equipment.map((e) => e.brand))).sort(),
    []
  );
}

function applyFilters(items: EquipmentProduct[], f: Filters): EquipmentProduct[] {
  let result = items.slice();
  if (f.category !== "all") result = result.filter((e) => e.category === f.category);
  if (f.brands.length > 0) result = result.filter((e) => f.brands.includes(e.brand));
  if (f.condition !== "all") result = result.filter((e) => e.condition === f.condition);
  if (f.availability === "sale") result = result.filter((e) => e.availableForSale);
  if (f.availability === "rent") result = result.filter((e) => e.availableForRent);
  result = result.filter(
    (e) =>
      e.price >= f.priceRange[0] &&
      e.price <= f.priceRange[1]
  );
  if (f.query.trim()) {
    const q = f.query.trim();
    result = result.filter(
      (e) => e.title.includes(q) || e.brand.includes(q)
    );
  }
  switch (f.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    default:
      result.sort((a, b) => b.rating - a.rating);
  }
  return result;
}

function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.category !== "all") n++;
  n += f.brands.length;
  if (f.condition !== "all") n++;
  if (f.availability !== "all") n++;
  if (f.priceRange[0] !== PRICE_MIN || f.priceRange[1] !== PRICE_MAX) n++;
  if (f.query.trim()) n++;
  return n;
}

/**
 * Inventory meter for one availability mode (sale or rent).
 * The bar runs on the shared green→red scale: the closer the stock is to
 * running out, the redder it gets. Zero stock renders a solid «ناموجود»
 * state instead of a bar.
 */
function StockMeter({ value, label }: { value: number; label: string }) {
  const ratio = stockFillRatio(value);
  const level = capacityLevel(ratio);

  if (value <= 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-[11px] font-bold",
          levelChipClass("full")
        )}
      >
        <span className="flex items-center gap-1">
          <PackageX className="h-3.5 w-3.5" />
          موجودی {label}
        </span>
        <span>ناموجود</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-background/60 px-2.5 py-1.5">
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Package className="h-3 w-3" />
          موجودی {label}
        </span>
        <span className={cn("flex items-center gap-1", levelTextClass(level))}>
          {value <= 5 && <Flame className="h-3 w-3" />}
          {value <= 5 ? `تنها ${toFa(value)} عدد` : `${toFa(value)} عدد`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(6, (1 - ratio) * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: fillColor(ratio) }}
        />
      </div>
    </div>
  );
}

function EquipmentStoreCard({ product }: { product: EquipmentProduct }) {
  const go = useGo();
  const addEquipment = useCart((s) => s.addEquipment);
  const setCartOpen = useNav((s) => s.setCartOpen);
  const toggleEquipWishlist = useWishlist((s) => s.toggleEquipment);
  const toggleCompare = useEquipmentCompare((s) => s.toggle);
  // Mount gate — persisted-store visuals must match the server on the
  // hydration render (see useMounted / app-shell rehydrate race).
  const mounted = useMounted();
  const favRaw = useWishlist((s) => s.hasEquipment(product.id));
  const comparedRaw = useEquipmentCompare((s) => s.has(product.id));
  const hasEquipWishlist = mounted && favRaw;
  const isCompared = mounted && comparedRaw;
  const [mode, setMode] = React.useState<"sale" | "rent">(
    product.availableForSale ? "sale" : "rent"
  );

  const price = mode === "sale" ? product.price : product.rentPricePerDay ?? 0;
  // Mode-aware inventory: sale uses the warehouse stock, rent uses the
  // dedicated rent pool (falls back to the warehouse stock for entries
  // that don't declare one).
  const currentStock = mode === "sale" ? product.stock : (product.rentStock ?? product.stock);
  const outOfStock = currentStock <= 0;

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) {
      toast.error(
        mode === "sale"
          ? "موجودی فروش این محصول تمام شده است"
          : "موجودی اجاره این محصول تمام شده است"
      );
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
    setCartOpen(true);
  };

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleEquipWishlist(product.id);
    toast.success(
      hasEquipWishlist ? "از علاقه‌مندی حذف شد" : "به علاقه‌مندی اضافه شد!",
      { description: product.title }
    );
  };

  return (
    <motion.div
      variants={staggerItem}
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
        <div className="absolute inset-0 bg-gradient-to-t from-forest/50 via-transparent to-transparent" />
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          {product.condition === "used" && (
            <span className="rounded-full bg-forest/80 px-2.5 py-1 text-[10px] font-bold text-cream backdrop-blur">
              دست دوم
            </span>
          )}
          {product.rating >= 4.8 && (
            <span className="rounded-full bg-gold/90 px-2.5 py-1 text-[10px] font-bold text-forest backdrop-blur">
              <Sparkles className="ml-1 inline h-3 w-3" />
              منتخب
            </span>
          )}
        </div>
        {(() => {
          // Mode-aware availability chip on the photo: red «ناموجود» when
          // the current mode has no inventory, orange countdown when low.
          // Sits BELOW the wishlist heart (top-14) — same slot the tour
          // cards use for the discount badge.
          if (currentStock <= 0) {
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
        <IconTooltip label={hasEquipWishlist ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"} side="left">
          <button
            onClick={toggleFav}
            aria-label="افزودن به علاقه‌مندی"
            className={cn(
              "absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition-all duration-300",
              // Mobile-only: enlarge invisible touch area (visual size unchanged)
              "max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']",
              hasEquipWishlist
                ? "bg-sunset text-white shadow-md shadow-sunset/30"
                : "bg-cream/80 text-forest hover:bg-cream hover:scale-110"
            )}
          >
            <HeartBurst active={hasEquipWishlist}>
              <Heart className={cn("h-4 w-4 transition", hasEquipWishlist && "fill-current")} />
            </HeartBurst>
          </button>
        </IconTooltip>
        {/* Compare — labeled pill, bottom-left, identical format to tour cards */}
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
          <span className="rounded-full bg-cream/95 px-2.5 py-1 text-[10px] font-bold text-forest backdrop-blur">
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
        <h3 className="line-clamp-2 min-h-[2.8rem] font-bold leading-7 transition group-hover:text-gold dark:group-hover:text-gold-light">
          {product.title}
        </h3>

        <div className="mt-3 flex rounded-xl border p-0.5">
          {product.availableForSale && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMode("sale");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition max-sm:min-h-11",
                mode === "sale"
                  ? "bg-primary text-primary-foreground shadow-sm"
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
                "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition max-sm:min-h-11",
                mode === "rent"
                  ? "bg-sunset text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="h-3 w-3" /> اجاره
            </button>
          )}
        </div>

        <div className="mt-3">
          <StockMeter
            value={currentStock}
            label={mode === "sale" ? "فروش" : "اجاره"}
          />
        </div>

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
                "relative grid h-10 w-10 place-items-center rounded-xl transition max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']",
                outOfStock
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground shadow-sm",
                !outOfStock &&
                  "group-hover:bg-gradient-to-br group-hover:from-gold group-hover:to-gold-light group-hover:text-forest group-hover:shadow-lg group-hover:shadow-gold/30 hover:scale-105"
              )}
            >
              {outOfStock ? <PackageX className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </button>
          </IconTooltip>
        </div>
      </div>
    </motion.div>
  );
}

function FilterPanel({
  filters,
  setFilters,
  brands,
  activeCount = 0,
  showHeader = false,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  brands: string[];
  /** Active-filter count — shown in the tours-style header (desktop). */
  activeCount?: number;
  /** Tours-style header row (icon + «فیلترها» + count) — desktop only;
   *  the mobile sheet already has its own SheetTitle. */
  showHeader?: boolean;
}) {
  const toggleBrand = (b: string) => {
    setFilters((f) => ({
      ...f,
      brands: f.brands.includes(b)
        ? f.brands.filter((x) => x !== b)
        : [...f.brands, b],
    }));
  };

  return (
    <div className="glass space-y-6 rounded-3xl border border-border/60 p-5 shadow-lg shadow-forest/5">
      {/* Tours-style panel header (desktop sidebar) */}
      {showHeader && (
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            فیلترها
          </h3>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {toFa(activeCount)} فعال
            </span>
          )}
        </div>
      )}

      {/* Sort */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold">مرتب‌سازی</h4>
        </div>
        <Select
          value={filters.sort}
          onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as SortKey }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Availability */}
      <div>
        <h4 className="mb-3 text-sm font-bold">نوع دسترسی</h4>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { k: "all", l: "همه" },
              { k: "sale", l: "خرید" },
              { k: "rent", l: "اجاره" },
            ] as { k: AvailabilityKey; l: string }[]
          ).map((opt) => (
            <button
              key={opt.k}
              onClick={() => setFilters((f) => ({ ...f, availability: opt.k }))}
              className={cn(
                "rounded-xl border py-2 text-xs font-bold transition max-sm:min-h-11",
                filters.availability === opt.k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <h4 className="mb-3 text-sm font-bold">وضعیت</h4>
        <RadioGroup
          value={filters.condition}
          onValueChange={(v) => setFilters((f) => ({ ...f, condition: v as ConditionKey }))}
          className="gap-2"
        >
          {(["all", "new", "used"] as ConditionKey[]).map((c) => (
            <div key={c} className="flex items-center gap-2">
              <RadioGroupItem value={c} id={`cond-${c}`} />
              <Label htmlFor={`cond-${c}`} className="cursor-pointer text-sm">
                {CONDITION_LABELS[c]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Price range */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold">محدوده قیمت</h4>
          <span className="text-[11px] text-muted-foreground">
            تا {formatCurrency(filters.priceRange[1])}
          </span>
        </div>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={250_000}
          value={filters.priceRange}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, priceRange: v as [number, number] }))
          }
          className="mt-2"
        />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>{formatCurrency(PRICE_MIN)}</span>
          <span>{formatCurrency(PRICE_MAX)}</span>
        </div>
      </div>

      {/* Brands — fully expanded (tours pattern: NO inner scroll anywhere;
          the whole sidebar scrolls with the page instead). */}
      <div>
        <h4 className="mb-3 text-sm font-bold">برندها</h4>
        <div className="space-y-2">
          {brands.map((b) => (
            <div key={b} className="flex items-center gap-2">
              <Checkbox
                id={`brand-${b}`}
                checked={filters.brands.includes(b)}
                onCheckedChange={() => toggleBrand(b)}
              />
              <Label
                htmlFor={`brand-${b}`}
                className="flex w-full cursor-pointer items-center justify-between text-sm"
              >
                <span>{b}</span>
                <span className="text-[11px] text-muted-foreground">
                  {toFa(equipment.filter((e) => e.brand === b).length)}
                </span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() =>
          setFilters({
            category: "all",
            brands: [],
            condition: "all",
            availability: "all",
            priceRange: [PRICE_MIN, PRICE_MAX],
            sort: "popular",
            query: "",
          })
        }
      >
        <X className="h-4 w-4" /> حذف همه فیلترها
      </Button>
    </div>
  );
}

function ActiveFilterChips({
  filters,
  setFilters,
  brands: _brands,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  brands: string[];
}) {
  const chips: { label: string; onRemove: () => void }[] = [];
  if (filters.category !== "all") {
    const cat = CATEGORIES.find((c) => c.key === filters.category);
    chips.push({
      label: cat?.label ?? "",
      onRemove: () => setFilters((f) => ({ ...f, category: "all" })),
    });
  }
  filters.brands.forEach((b) =>
    chips.push({
      label: b,
      onRemove: () =>
        setFilters((f) => ({ ...f, brands: f.brands.filter((x) => x !== b) })),
    })
  );
  if (filters.condition !== "all") {
    chips.push({
      label: CONDITION_LABELS[filters.condition],
      onRemove: () => setFilters((f) => ({ ...f, condition: "all" })),
    });
  }
  if (filters.availability !== "all") {
    chips.push({
      label: filters.availability === "sale" ? "قابل خرید" : "قابل اجاره",
      onRemove: () => setFilters((f) => ({ ...f, availability: "all" })),
    });
  }
  if (filters.priceRange[0] !== PRICE_MIN || filters.priceRange[1] !== PRICE_MAX) {
    chips.push({
      label: `تا ${formatCurrency(filters.priceRange[1])}`,
      onRemove: () =>
        setFilters((f) => ({ ...f, priceRange: [PRICE_MIN, PRICE_MAX] })),
    });
  }
  if (filters.query.trim()) {
    chips.push({
      label: `«${filters.query.trim()}»`,
      onRemove: () => setFilters((f) => ({ ...f, query: "" })),
    });
  }

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={chip.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition hover:border-primary/40 hover:bg-primary/10"
        >
          {chip.label}
          <X className="h-3 w-3 transition group-hover:rotate-90" />
        </button>
      ))}
      <button
        onClick={() =>
          setFilters({
            category: "all",
            brands: [],
            condition: "all",
            availability: "all",
            priceRange: [PRICE_MIN, PRICE_MAX],
            sort: "popular",
            query: "",
          })
        }
        className="text-xs font-bold text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
      >
        پاک کردن همه
      </button>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground">
        <SearchX className="h-9 w-9" />
      </div>
      <div>
        <p className="text-lg font-bold">هیچ تجهیزی یافت نشد</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          با تغییر فیلترها یا کلمه جست‌وجو، دوباره امتحان کنید.
        </p>
      </div>
      <Button onClick={onReset} className="bg-primary text-primary-foreground">
        <Check className="h-4 w-4" /> بازنشانی فیلترها
      </Button>
    </div>
  );
}

export function EquipmentView() {
  const brands = useUniqueBrands();
  const [filters, setFilters] = React.useState<Filters>({
    category: "all",
    brands: [],
    condition: "all",
    availability: "all",
    priceRange: [PRICE_MIN, PRICE_MAX],
    sort: "popular",
    query: "",
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const filtered = React.useMemo(
    () => applyFilters(equipment, filters),
    [filters]
  );

  const activeCount = countActiveFilters(filters);
  const resetFilters = () =>
    setFilters({
      category: "all",
      brands: [],
      condition: "all",
      availability: "all",
      priceRange: [PRICE_MIN, PRICE_MAX],
      sort: "popular",
      query: "",
    });

  return (
    <div className="min-h-screen bg-background pb-24 pt-28">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald/10 via-cream to-transparent dark:via-forest/40" />
        <div className="pointer-events-none absolute -right-32 -top-20 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-6">
          <ScrollReveal>
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald/10 text-emerald">
                  <Package className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald">
                  فروشگاه کوچ‌نشین
                </span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
                فروشگاه تجهیزات <span className="text-gradient-emerald">کوچ‌نشین</span>
              </h1>
              <p className="max-w-2xl text-muted-foreground md:text-lg">
                از چادر کمپ تا کوله حرفه‌ای، کفش کوهنوردی تا طناب دینامیک — هر چیزی که
                برای سفر و طبیعت‌گردی نیاز داری، با امکان خرید یا اجاره.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-primary" />
                  {toFa(equipment.length)} محصول
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-sunset" />
                  اجاره روزانه
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-gold" />
                  برندهای معتبر
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Category pills */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal delay={0.1}>
          <div className="custom-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const count =
                cat.key === "all"
                  ? equipment.length
                  : equipment.filter((e) => e.category === cat.key).length;
              const active = filters.category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setFilters((f) => ({ ...f, category: cat.key }))}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border px-4 py-2.5 text-sm font-bold transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <span className={cn(active ? "text-primary-foreground" : "text-primary")}>
                    {cat.icon}
                  </span>
                  {cat.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {toFa(count)}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>
      </div>

      {/* Bundle deals — shown prominently at the top as special offers */}
      <BundleDeals />

      {/* Main layout */}
      <div className="mx-auto mt-6 max-w-7xl gap-6 px-4 md:px-6 lg:grid lg:grid-cols-[280px_1fr]">
        {/* Sidebar - desktop — EXACTLY like the tours sidebar: a plain,
            static panel at its natural top position (user: «فیکس و ثابت...
            مثل ساید بار تورها»). No sticky, no max-height, no inner
            scrollbar — the whole panel scrolls with the page and every
            section (brands + reset) is visible without nested scrolling. */}
        <aside className="hidden lg:block">
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            brands={brands}
            activeCount={activeCount}
            showHeader
          />
        </aside>

        {/* Content */}
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">
                {toFa(filtered.length)} محصول
              </h2>
              {activeCount > 0 && (
                <Badge className="bg-primary/10 text-primary">
                  {toFa(activeCount)} فیلتر فعال
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 max-sm:w-full">
              <input
                type="text"
                value={filters.query}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, query: e.target.value }))
                }
                placeholder="جست‌وجوی محصول یا برند..."
                className="h-9 w-44 rounded-lg border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 md:w-56 max-sm:h-11 max-sm:min-w-0 max-sm:flex-1 max-sm:w-auto"
              />
              {/* Mobile filter button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden max-sm:h-11 max-sm:px-4">
                    <SlidersHorizontal className="h-4 w-4" />
                    فیلترها
                    {activeCount > 0 && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {toFa(activeCount)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-sm overflow-y-auto max-lg:max-w-full">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-primary" />
                      فیلترهای فروشگاه
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <FilterPanel filters={filters} setFilters={setFilters} brands={brands} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active chips */}
          <ActiveFilterChips
            filters={filters}
            setFilters={setFilters}
            brands={brands}
          />

          {/* Grid */}
          {filtered.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            <StaggerGroup
              className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 max-sm:gap-3 max-[360px]:grid-cols-1"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((p) => (
                  <EquipmentStoreCard key={p.id} product={p} />
                ))}
              </AnimatePresence>
            </StaggerGroup>
          )}

          {/* Bottom note */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3 text-center text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-gold" />
              هر تجهیز را می‌توانید خریداری کنید یا به‌صورت روزانه اجاره بگیرید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
