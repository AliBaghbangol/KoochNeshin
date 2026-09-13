"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Tag, Check, Sparkles, Gift } from "lucide-react";
import { equipment } from "@/mocks/equipment";
import { useCart } from "@/store/cart-store";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import {
  BUNDLE_DEALS,
  calculateBundlePrice,
  type BundleDeal,
} from "@/store/bundle-deals-store";
import { toFa, formatCurrency } from "@/lib/format";
import { SmartImage } from "@/components/common/smart-image";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLOR_CLASSES: Record<BundleDeal["color"], { bg: string; text: string; border: string; gradient: string }> = {
  emerald: {
    bg: "bg-emerald/5",
    text: "text-emerald",
    border: "border-emerald/30",
    gradient: "from-emerald to-emerald-dark",
  },
  sunset: {
    bg: "bg-sunset/5",
    text: "text-sunset",
    border: "border-sunset/30",
    gradient: "from-sunset to-sunset-dark",
  },
  gold: {
    bg: "bg-gold/5",
    text: "text-gold",
    border: "border-gold/30",
    gradient: "from-gold to-sunset",
  },
};

function BundleCard({ bundle }: { bundle: BundleDeal }) {
  const go = useGo();
  const addEquipment = useCart((s) => s.addEquipment);
  const setCartOpen = useNav((s) => s.setCartOpen);
  const cfg = COLOR_CLASSES[bundle.color];

  const products = bundle.productIds
    .map((id) => equipment.find((e) => e.id === id))
    .filter(Boolean) as typeof equipment;

  const pricing = calculateBundlePrice(
    bundle,
    (id) => equipment.find((e) => e.id === id)
  );

  const addBundleToCart = () => {
    products.forEach((p) => {
      addEquipment({
        type: "equipment-sale",
        refId: p.id,
        title: p.title,
        image: p.images[0],
        unitPrice: Math.round(p.price * (1 - bundle.discountPercent / 100)),
        quantity: 1,
      });
    });
    toast.success("پکیج به سبد اضافه شد!", {
      description: `${bundle.title} — ${toFa(bundle.discountPercent)}٪ تخفیف اعمال شد`,
    });
    setCartOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
        cfg.border
      )}
    >
      {/* Top row: discount badge + special badge */}
      <div className="mb-4 flex items-center justify-between">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full bg-gradient-to-l px-3 py-1.5 text-xs font-extrabold text-white shadow-md",
            cfg.gradient
          )}
        >
          <Tag className="h-3.5 w-3.5" />
          {toFa(bundle.discountPercent)}٪ تخفیف
        </span>
        {bundle.badge && (
          <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", cfg.bg, cfg.text)}>
            {bundle.badge}
          </span>
        )}
      </div>

      {/* Title + description */}
      <div>
        <h3 className="text-lg font-extrabold leading-7 transition group-hover:text-gold dark:group-hover:text-gold-light">{bundle.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{bundle.description}</p>
      </div>

      {/* Product previews — stacked horizontally with + separators */}
      <div className="mt-4 flex items-center gap-2">
        {products.map((p, i) => (
          <React.Fragment key={p.id}>
            <div
              className="group/prod relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border transition hover:scale-105 max-sm:h-12 max-sm:w-12"
              onClick={() => go("product-detail", { id: p.id })}
              title={p.title}
            >
              <SmartImage
                src={p.images[0]}
                alt={p.title}
                fallback="equipment"
                shimmer={false}
                aspectClass="size-full"
                className="object-cover"
              />
            </div>
            {i < products.length - 1 && (
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                +
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Product names */}
      <div className="mt-3 space-y-1">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-xs">
            <Check className={cn("h-3 w-3 shrink-0", cfg.text)} />
            <span className="truncate">{p.title}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="mt-auto flex items-end justify-between border-t pt-4 max-sm:flex-col max-sm:items-start max-sm:gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground line-through">
            {formatCurrency(pricing.original)}
          </p>
          <p className={cn("text-xl font-extrabold", cfg.text)}>
            {formatCurrency(pricing.discounted)}
          </p>
          <p className="text-[10px] font-bold text-emerald">
            صرفه‌جویی: {formatCurrency(pricing.savings)}
          </p>
        </div>
        <button
          onClick={addBundleToCart}
          className={cn(
            "flex items-center gap-1.5 rounded-xl bg-gradient-to-l px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:shadow-lg max-sm:w-full max-sm:justify-center max-sm:py-3",
            cfg.gradient
          )}
        >
          <Tag className="h-3.5 w-3.5" />
          افزودن پکیج
        </button>
      </div>
    </motion.div>
  );
}

export function BundleDeals() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-sunset/10 text-sunset">
              <Gift className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-sunset">
              پیشنهاد ویژه
            </span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
            پکیج‌های <span className="text-gradient-sunset">تخفیف‌دار</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            با خرید پکیج، چند تجهیز را همزمان بگیر و تا ۲۰٪ تخفیف بگیر!
          </p>
        </ScrollReveal>

        <div className="grid gap-5 md:grid-cols-3">
          {BUNDLE_DEALS.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>

        <ScrollReveal className="mt-6">
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3 text-center text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-gold" />
            تخفیف پکیج به‌صورت خودکار هنگام افزودن به سبد اعمال می‌شود.
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
