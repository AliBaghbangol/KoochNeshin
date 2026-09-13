"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Mountain,
  Tent,
  Palmtree,
  Landmark,
  TreePine,
  Star,
  Clock,
  Users,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { tours } from "@/mocks/tours";
import { useGo } from "@/lib/use-go";
import { useViewParams } from "@/lib/use-view-params";
import {
  toFa,
  formatCurrency,
  toPersianShortDate,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
} from "@/lib/format";
import type { TourCategory as TC } from "@/types";
import {
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";
import { TiltCard } from "@/components/animations/tilt-card";
import { MagneticButton } from "@/components/animations/magnetic-button";
import { Counter } from "@/components/animations/counter";
import { cn } from "@/lib/utils";

const CATEGORY_HEROES: Record<
  TC,
  {
    icon: typeof Mountain;
    title: string;
    subtitle: string;
    gradient: string;
    image: string;
    accent: string;
  }
> = {
  mountain: {
    icon: Mountain,
    title: "کوهنوردی",
    subtitle: "صعود به بام ایران، تجربه‌ای فراموش‌نشدنی",
    gradient: "from-emerald via-emerald-dark to-forest",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&h=900&fit=crop&q=80",
    accent: "text-gold",
  },
  forest: {
    icon: TreePine,
    title: "جنگل‌گردی",
    subtitle: "در میان سبزی جنگل‌های هیرکانی",
    gradient: "from-emerald-light via-emerald to-emerald-dark",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&h=900&fit=crop&q=80",
    accent: "text-cream",
  },
  desert: {
    icon: Tent,
    title: "بیابان‌گردی",
    subtitle: "شب‌های پرستاره و کرت‌های بی‌نظیر کویر",
    gradient: "from-sunset via-sunset-dark to-forest",
    image:
      "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1600&h=900&fit=crop&q=80",
    accent: "text-gold",
  },
  coastal: {
    icon: Palmtree,
    title: "سفرهای ساحلی",
    subtitle: "آبی بی‌انتها و جزایر خلیج فارس",
    gradient: "from-emerald-light via-emerald to-sunset",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=900&fit=crop&q=80",
    accent: "text-cream",
  },
  historical: {
    icon: Landmark,
    title: "تاریخ و فرهنگ",
    subtitle: "سفری به عمق تاریخ ایران باستان",
    gradient: "from-gold via-sunset to-forest",
    image:
      "https://images.unsplash.com/photo-1549887534-1541e9326642?w=1600&h=900&fit=crop&q=80",
    accent: "text-cream",
  },
};

const SORT_OPTIONS = [
  { id: "popular", label: "محبوب‌ترین" },
  { id: "price-asc", label: "ارزان‌ترین" },
  { id: "price-desc", label: "گران‌ترین" },
  { id: "rating", label: "بالاترین امتیاز" },
  { id: "duration", label: "کوتاه‌ترین" },
] as const;

export function CategoryView() {
  const go = useGo();
  const params = useViewParams();
  const category = (params.category as TC) ?? "mountain";
  const [sort, setSort] = React.useState<(typeof SORT_OPTIONS)[number]["id"]>("popular");

  const cfg = CATEGORY_HEROES[category] ?? CATEGORY_HEROES.mountain;
  const Icon = cfg.icon;

  const allCategories = Object.keys(CATEGORY_HEROES) as TC[];

  const filtered = React.useMemo(() => {
    const list = tours.filter((t) => t.category === category);
    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        return sorted.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
      case "price-desc":
        return sorted.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "duration":
        return sorted.sort((a, b) => a.duration - b.duration);
      default:
        return sorted.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }
  }, [category, sort]);

  const stats = React.useMemo(() => {
    const list = tours.filter((t) => t.category === category);
    return {
      count: list.length,
      avgRating: list.length ? (list.reduce((s, t) => s + t.rating, 0) / list.length).toFixed(1) : "0",
      minPrice: list.length ? Math.min(...list.map((t) => t.discountPrice ?? t.price)) : 0,
      leaders: new Set(list.map((t) => t.leaderId)).size,
    };
  }, [category]);

  return (
    <div className="bg-background pt-20">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[380px] overflow-hidden">
        <SmartImage
          src={cfg.image}
          alt={cfg.title}
          fallback="destination"
          shimmer={false}
          aspectClass="size-full"
          className="object-cover"
        />
        <div className={cn("absolute inset-0 bg-gradient-to-t", cfg.gradient, "opacity-80")} />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
        <div className="absolute inset-0 bg-noise opacity-15" />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-cream"
          >
            <nav className="mb-4 flex items-center gap-1 text-sm text-cream/70">
              <button onClick={() => go("home")} className="hover:text-cream">
                خانه
              </button>
              <ChevronLeft className="h-3.5 w-3.5" />
              <button onClick={() => go("destinations")} className="hover:text-cream">
                مقاصد
              </button>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="text-cream">{cfg.title}</span>
            </nav>
            <div className="mb-3 flex items-center gap-3">
              <div className={cn("grid h-14 w-14 place-items-center rounded-2xl bg-cream/15 backdrop-blur", cfg.accent)}>
                <Icon className="h-7 w-7" />
              </div>
              <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
                {cfg.title}
              </h1>
            </div>
            <p className="max-w-xl text-lg text-cream/85">{cfg.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
          {[
            { label: "تور فعال", value: stats.count, suffix: "" },
            { label: "میانگین امتیاز", value: Number(stats.avgRating), suffix: "" },
            { label: "از", value: stats.minPrice / 1000000, suffix: " م.ت", decimals: 1 },
            { label: "لیدر فعال", value: stats.leaders, suffix: "" },
          ].map((s, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-primary md:text-3xl">
                  <Counter
                    to={s.value}
                    suffix={s.suffix}
                    decimals={s.decimals ?? 0}
                    format={(n) =>
                      s.decimals ? toFa(n.toFixed(s.decimals)) : toFa(Math.round(n))
                    }
                  />
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Category pills + sort */}
      <section className="sticky top-16 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="custom-scroll flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {allCategories.map((c) => {
                const cCfg = CATEGORY_HEROES[c];
                const CIcon = cCfg.icon;
                const active = c === category;
                return (
                  <button
                    key={c}
                    onClick={() => go("category", { category: c })}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition max-sm:min-h-11 max-sm:px-4",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <CIcon className="h-3.5 w-3.5" />
                    {cCfg.title}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">مرتب‌سازی:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none max-sm:h-11 max-sm:text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Tours grid */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold md:text-3xl">
              تورهای {cfg.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {toFa(filtered.length)} تور از {toFa(stats.leaders)} لیدر حرفه‌ای
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed py-20 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground">
                <Icon className="h-10 w-10" />
              </div>
              <div>
                <p className="text-lg font-bold">توری در این دسته یافت نشد</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  به‌زودی تورهای جدیدی اضافه می‌شود.
                </p>
              </div>
              <button
                onClick={() => go("tours")}
                className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground max-sm:min-h-11 max-sm:px-6"
              >
                مشاهده همه تورها
              </button>
            </div>
          ) : (
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => {
                const left = t.capacity - t.reservedCount;
                const finalPrice = t.discountPrice ?? t.price;
                const fillPct = (t.reservedCount / t.capacity) * 100;
                return (
                  <motion.div key={t.id} variants={staggerItem}>
                    <TiltCard className="h-full" max={6}>
                      <div
                        onClick={() => go("tour-detail", { id: t.id })}
                        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:shadow-xl"
                      >
                        <div className="relative h-52 overflow-hidden">
                          <SmartImage
                            src={t.images[0]}
                            alt={t.title}
                            fallback="tour"
                            fallbackLabel={CATEGORY_LABELS[t.category]}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-forest/50 to-transparent" />
                          {t.discountPrice && (
                            <span className="absolute left-3 top-3 rounded-full bg-accent px-2 py-1 text-xs font-extrabold text-white shadow-lg">
                              {toFa(Math.round((1 - t.discountPrice / t.price) * 100))}٪ تخفیف
                            </span>
                          )}
                          <div className="absolute bottom-3 right-3">
                            <span className="rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-bold text-forest backdrop-blur">
                              {DIFFICULTY_LABELS[t.difficulty]}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {toFa(t.duration)} روز
                            </span>
                            <span>{toPersianShortDate(t.startDate)}</span>
                          </div>
                          <h3 className="line-clamp-2 font-bold leading-7 transition group-hover:text-primary">
                            {t.title}
                          </h3>
                          <div className="mt-3 flex items-center gap-2">
                            <SmartImage
                              src={t.leader.avatar}
                              alt={t.leader.fullName}
                              fallback="avatar"
                              shimmer={false}
                              aspectClass="h-7 w-7 shrink-0 rounded-full ring-2 ring-gold/30"
                              className="h-full w-full object-cover"
                            />
                            <div className="flex-1 text-xs">
                              <p className="font-semibold">{t.leader.fullName}</p>
                            </div>
                            <span className="flex items-center gap-0.5 text-xs font-bold">
                              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                              {toFa(t.rating)}
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                ظرفیت
                              </span>
                              <span className={cn("font-bold", left <= 3 ? "text-accent" : "text-emerald")}>
                                {toFa(left)} نفر باقی
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${fillPct}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className={cn("h-full rounded-full", left <= 3 ? "bg-accent" : "bg-emerald")}
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex items-end justify-between border-t pt-3">
                            <div>
                              {t.discountPrice && (
                                <p className="text-[11px] text-muted-foreground line-through">
                                  {formatCurrency(t.price)}
                                </p>
                              )}
                              <p className="font-extrabold text-primary">
                                {formatCurrency(finalPrice)}
                              </p>
                            </div>
                            <MagneticButton
                              strength={0.25}
                              className="items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:bg-emerald-dark max-sm:min-h-11 max-sm:px-4 max-sm:text-sm"
                            >
                              مشاهده
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </MagneticButton>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </StaggerGroup>
          )}

          {/* CTA */}
          <ScrollReveal className="mt-12">
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-forest via-emerald-dark to-emerald p-8 text-center text-cream md:p-12">
              <h3 className="text-2xl font-extrabold md:text-3xl">
                دسته دیگری مد نظرت است؟
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-cream/80">
                ۵ دسته تور متنوع از کوهنوردی تا تاریخی — همگی با بهترین لیدرهای ایران.
              </p>
              <MagneticButton
                onClick={() => go("destinations")}
                className="mt-6 items-center gap-2 rounded-full bg-gold px-6 py-3 font-bold text-forest"
              >
                همه مقاصد
                <ArrowLeft className="h-5 w-5" />
              </MagneticButton>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
