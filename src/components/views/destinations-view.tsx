"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  ArrowLeft,
  Mountain,
  Tent,
  Palmtree,
  Landmark,
  TreePine,
  Search,
  X,
  CalendarDays,
  Sparkles,
  BookOpen,
  Clock,
} from "lucide-react";
import { destinations, tours } from "@/mocks/tours";
import { getDestinationExtras } from "@/mocks/destination-extras";
import {
  getDestinationArticle,
  type BlogPost,
} from "@/mocks/blog-posts";
import { useGo } from "@/lib/use-go";
import {
  toFa,
  toPersianShortDate,
  formatCurrency,
  CATEGORY_LABELS,
} from "@/lib/format";
import type { TourCategory } from "@/types";
import {
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";
import { TiltCard } from "@/components/animations/tilt-card";
import { IranMapCard } from "@/components/common/iran-map-card";
import { MagneticButton } from "@/components/animations/magnetic-button";
import { cn } from "@/lib/utils";

const CATEGORY_FILTERS: { id: TourCategory | "all"; label: string; icon: typeof Mountain }[] = [
  { id: "all", label: "همه", icon: MapPin },
  { id: "mountain", label: "کوهنوردی", icon: Mountain },
  { id: "forest", label: "جنگل", icon: TreePine },
  { id: "desert", label: "بیابان‌گردی", icon: Tent },
  { id: "coastal", label: "ساحلی", icon: Palmtree },
  { id: "historical", label: "تاریخی", icon: Landmark },
];

export function DestinationsView() {
  const go = useGo();
  const [activeCat, setActiveCat] = React.useState<TourCategory | "all">("all");
  const [search, setSearch] = React.useState("");

  // Compute tour counts + avg rating per destination
  const enriched = React.useMemo(() => {
    return destinations.map((d) => {
      const destTours = tours.filter((t) => t.destination === d.name);
      const avgRating =
        destTours.length > 0
          ? destTours.reduce((s, t) => s + t.rating, 0) / destTours.length
          : d.rating;
      const minPrice =
        destTours.length > 0
          ? Math.min(...destTours.map((t) => t.discountPrice ?? t.price))
          : 0;
      return { ...d, destTours, avgRating, minPrice };
    });
  }, []);

  const filtered = React.useMemo(() => {
    return enriched.filter((d) => {
      const matchCat = activeCat === "all" || d.category === activeCat;
      const matchSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.province.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [enriched, activeCat, search]);

  const totalTours = tours.length;

  // Magazine articles that introduce a destination — shown in the
  // «از مجله سفر» section; each card links straight into the post.
  const destinationArticles = React.useMemo(() => {
    return destinations
      .map((d) => ({ destination: d.name, post: getDestinationArticle(d.name) }))
      .filter((x): x is { destination: string; post: BlogPost } => Boolean(x.post));
  }, []);

  return (
    <div className="bg-background pt-24 md:pt-28">
      {/* Hero */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 rounded-full bg-emerald/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <ScrollReveal>
            <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
              <button onClick={() => go("home")} className="hover:text-primary">
                خانه
              </button>
              <span>/</span>
              <span className="text-foreground">مقاصد</span>
            </nav>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              کاوش مقاصد
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              سفر به <span className="text-gradient-emerald">زیباترین نقاط</span> ایران
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {toFa(destinations.length)} مقصد برتر، {toFa(totalTours)} تور فعال.
              مقصد بعدی‌ات را پیدا کن.
            </p>
            <div className="mt-5 inline-flex max-w-full w-fit items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" />
              <span className="min-w-0">
                هر مقصد، بهترین فصل خودش را دارد — از نشان‌های فصل پیروی کنید
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Filters — static (user report: sticking under the navbar felt wrong) */}
      <section className="border-y bg-background">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="custom-scroll flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORY_FILTERS.map((c) => {
                const Icon = c.icon;
                const active = activeCat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition max-sm:min-h-11 max-sm:px-4",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                );
              })}
            </div>
            <div className="relative md:w-64">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی مقصد یا استان..."
                className="h-10 w-full rounded-full border bg-background pr-10 pl-9 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 max-sm:h-11"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground after:absolute after:-inset-2.5 after:content-['']"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {toFa(filtered.length)} مقصد یافت شد
            </p>
            {activeCat !== "all" && (
              <button
                onClick={() => go("category", { category: activeCat })}
                className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                مشاهده همه تورهای {CATEGORY_LABELS[activeCat]}
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed py-20 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground">
                <MapPin className="h-10 w-10" />
              </div>
              <div>
                <p className="text-lg font-bold">مقصدی یافت نشد</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  فیلترها را تغییر بده یا عبارت دیگری جستجو کن.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveCat("all");
                  setSearch("");
                }}
                className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground max-sm:min-h-11"
              >
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            <>
              {/* Interactive Iran map — same real SVG map as the home page,
                  with precise lat/lng destination pins (replaces the old
                  generic TourMap box) */}
              <ScrollReveal className="mb-8">
                <IranMapCard />
              </ScrollReveal>
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => {
                const extras = getDestinationExtras(d.name);
                // The magazine article that introduces THIS destination (when
                // it exists) — powers the «راهنمای مقصد» button next to
                // «مشاهده تورها» (user request: a second button that shows the
                // location's info from the magazine, separate from tours).
                const guideArticle = getDestinationArticle(d.name);
                return (
                <motion.div key={d.id} variants={staggerItem}>
                  <TiltCard className="h-full" max={8}>
                    <div
                      onClick={() => go("tours", { destination: d.name })}
                      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:shadow-xl"
                    >
                      <div className="relative h-64 overflow-hidden">
                        <SmartImage
                          src={d.image}
                          alt={d.name}
                          fallback="destination"
                          fallbackLabel={d.name}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/30 to-transparent" />

                        {/* Category badge */}
                        <div className="absolute right-3 top-3">
                          <span className="rounded-full bg-gold/90 px-2.5 py-1 text-[10px] font-bold text-forest backdrop-blur">
                            {CATEGORY_LABELS[d.category]}
                          </span>
                        </div>

                        {/* Rating */}
                        <div className="absolute left-3 top-3">
                          <span className="flex items-center gap-1 rounded-full bg-cream/90 px-2 py-1 text-[10px] font-bold text-forest backdrop-blur">
                            <Star className="h-3 w-3 fill-gold text-gold" />
                            {toFa(d.avgRating.toFixed(1))}
                          </span>
                        </div>

                        {/* Vibe chip (stacked under rating, top-left) */}
                        {extras && (
                          <div className="absolute left-3 top-10 z-10">
                            <span className="rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur">
                              {extras.vibe}
                            </span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="absolute inset-x-0 bottom-0 p-5 text-cream">
                          <div className="mb-1 flex items-center gap-1 text-xs text-cream/80">
                            <MapPin className="h-3 w-3" />
                            {d.province}
                          </div>
                          <h3 className="text-2xl font-extrabold">{d.name}</h3>
                          {extras && (
                            <p className="mt-1.5 line-clamp-1 text-xs text-cream/85">
                              {extras.tagline}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {d.description}
                        </p>

                        {/* Seasonality */}
                        {extras && (
                          <div className="mt-3">
                            <p className="text-[10px] font-medium text-muted-foreground/80">
                              بهترین زمان سفر
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gold" />
                              <span className="font-bold text-foreground">
                                {extras.bestMonthsLabel}
                              </span>
                              {extras.bestSeasons.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-secondary/60 p-3 text-center">
                            <p className="text-xs text-muted-foreground">تور فعال</p>
                            <p className="text-lg font-extrabold text-primary">
                              {toFa(d.destTours.length)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-secondary/60 p-3 text-center">
                            <p className="text-xs text-muted-foreground">شروع از</p>
                            <p className="text-sm font-extrabold text-emerald">
                              {d.minPrice > 0
                                ? formatCurrency(d.minPrice)
                                : "—"}
                            </p>
                          </div>
                        </div>

                        <div className={cn("mt-4 grid gap-2", guideArticle ? "grid-cols-2" : "grid-cols-1")}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              go("tours", { destination: d.name });
                            }}
                            className="flex items-center justify-center gap-1 rounded-2xl bg-primary/10 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground max-sm:min-h-11"
                          >
                            مشاهده تورها
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          {guideArticle && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                go("blog-detail", { id: String(guideArticle.id) });
                              }}
                              title={`مقاله مجله درباره ${d.name}`}
                              className="flex items-center justify-center gap-1.5 rounded-2xl border border-gold/40 bg-gold/10 py-2.5 text-sm font-bold text-gold transition hover:bg-gold hover:text-forest max-sm:min-h-11"
                            >
                              <BookOpen className="h-4 w-4 shrink-0" />
                              راهنمای مقصد
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
                );
              })}
            </StaggerGroup>
            </>
          )}
        </div>
      </section>

      {/* Magazine — destination guides from the blog; «مشاهده بیشتر» goes
          straight to the related magazine article (user request) */}
      {destinationArticles.length > 0 && (
        <section className="pb-4">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <ScrollReveal>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                    از مجله سفر
                  </div>
                  <h2 className="text-2xl font-extrabold leading-tight md:text-3xl">
                    مقاصد را از{" "}
                    <span className="text-gradient-emerald">مجله کوچ‌نشین</span>{" "}
                    بشناس
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                    برای هر مقصد یک مقاله کامل نوشته‌ایم — ویژگی‌ها، عکس‌ها و
                    نکته‌هایی که هیچ‌جا نمی‌خوانی.
                  </p>
                </div>
                <button
                  onClick={() => go("blog")}
                  className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground max-sm:min-h-11"
                >
                  مشاهده همه مقالات
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </ScrollReveal>
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destinationArticles.map(({ destination, post }) => (
                <motion.article key={post.id} variants={staggerItem}>
                  <TiltCard className="h-full" max={6}>
                    <div
                      onClick={() => go("blog-detail", { id: String(post.id) })}
                      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:shadow-xl"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <SmartImage
                          src={post.image}
                          alt={post.title}
                          fallback="tour"
                          fallbackLabel={destination}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/20 to-transparent" />
                        <span className="absolute right-3 top-3 rounded-full bg-gold/90 px-2.5 py-1 text-[10px] font-bold text-forest backdrop-blur">
                          {post.category}
                        </span>
                        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur">
                          <MapPin className="h-3 w-3 text-primary" />
                          {destination}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="line-clamp-2 min-h-14 font-bold leading-7 transition group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
                          {post.excerpt}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {toFa(post.readTime)} دقیقه مطالعه
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {toPersianShortDate(post.date)}
                          </span>
                        </div>
                        <div className="mt-auto pt-4">
                          <span className="flex items-center justify-center gap-1 rounded-2xl bg-primary/10 py-2.5 text-sm font-bold text-primary transition group-hover:bg-primary group-hover:text-primary-foreground max-sm:min-h-11">
                            مشاهده بیشتر در مجله
                            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </motion.article>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <ScrollReveal>
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-forest via-emerald-dark to-emerald p-8 text-center text-cream md:p-12">
              <h2 className="text-2xl font-extrabold md:text-4xl">
                مقصد دلخواهت را پیدا نکردی؟
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-cream/80">
                هر هفته مقاصد جدیدی اضافه می‌شود. در خبرنامه عضو شو تا اولین نفری
                باشی که می‌فهمد.
              </p>
              <MagneticButton
                onClick={() => go("about")}
                className="mt-6 items-center gap-2 rounded-full bg-gold px-6 py-3 font-bold text-forest"
              >
                تماس با ما
                <ArrowLeft className="h-5 w-5" />
              </MagneticButton>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
