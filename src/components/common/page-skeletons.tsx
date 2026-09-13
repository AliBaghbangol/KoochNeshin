import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level page skeletons (brief §25 — «اسکلت واقعی و هم‌اندازه»).
 *
 * Plain server-safe module: no "use client", no hooks. Each page skeleton
 * mirrors the real view's root padding, container, grid columns and card
 * anatomy (see src/components/views/*.tsx) so the swap from skeleton to
 * content is seamless. Shimmer = shadcn/ui Skeleton `animate-pulse` with a
 * CSS-only `animationDelay` cascade (globals.css already collapses all
 * animations under prefers-reduced-motion).
 */

const STAGGER_STEP = 110;

/** CSS-only cascade: positive delay keeps blocks solid, then they pulse in order. */
function stagger(i: number, step = STAGGER_STEP) {
  return { animationDelay: `${i * step}ms` };
}

/** Skeleton with optional cascade delay. */
function Sk({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <Skeleton
      className={className}
      style={delay ? stagger(delay) : undefined}
    />
  );
}

/** Shared card shell — matches the rounded-3xl bordered cards used by all views. */
const CARD = "flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm";

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

export function PageHeaderSkeleton({
  center = false,
  breadcrumb = true,
}: {
  center?: boolean;
  breadcrumb?: boolean;
}) {
  return (
    <div className={center ? "flex flex-col items-center" : undefined}>
      {breadcrumb && (
        <div className="mb-4 flex items-center gap-1.5">
          <Sk className="h-3.5 w-10 rounded" />
          <Sk className="h-3.5 w-1.5 rounded" />
          <Sk className="h-3.5 w-12 rounded" />
        </div>
      )}
      <Sk className="mb-4 h-9 w-32 rounded-full" />
      <Sk className="h-10 w-72 max-w-full rounded-xl md:h-14 md:w-[26rem]" />
      <Sk className="mt-4 h-4 w-64 max-w-full rounded md:w-96" />
    </div>
  );
}

/** Desktop filter sidebar card (tours / equipment) — title row + filter groups. */
export function FilterSidebarSkeleton() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-md">
      <div className="mb-4 flex items-center gap-2">
        <Sk className="h-8 w-8 rounded-lg" />
        <Sk className="h-4 w-16 rounded" />
      </div>
      {[0, 1, 2].map((g) => (
        <div
          key={g}
          className="mb-3 rounded-2xl border border-border/60 bg-background/40 p-3"
        >
          <Sk className="mb-3 h-4 w-20 rounded" />
          <div className="space-y-2.5">
            <Sk className="h-4 w-28 rounded" delay={g * 60 + 40} />
            <Sk className="h-4 w-24 rounded" delay={g * 60 + 80} />
            <Sk className="h-4 w-20 rounded" delay={g * 60 + 120} />
          </div>
        </div>
      ))}
      <Sk className="h-1.5 w-full rounded-full" delay={240} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card skeletons                                                      */
/* ------------------------------------------------------------------ */

/** Mirrors RichTourCard (grid mode): image + meta + title + leader + capacity + price row. */
export function RichTourCardSkeleton({
  index = 0,
  imageClassName = "h-56",
}: {
  index?: number;
  imageClassName?: string;
}) {
  return (
    <div className={CARD}>
      <Sk className={`w-full rounded-none ${imageClassName}`} delay={index * STAGGER_STEP} />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between">
          <Sk className="h-3 w-16 rounded" delay={index * STAGGER_STEP} />
          <Sk className="h-3 w-14 rounded" delay={index * STAGGER_STEP} />
        </div>
        <Sk className="h-5 w-4/5 rounded" delay={index * STAGGER_STEP} />
        <Sk className="mt-1.5 h-5 w-3/5 rounded" delay={index * STAGGER_STEP} />
        <div className="mt-3 flex items-center gap-2">
          <Sk className="h-7 w-7 rounded-full" delay={index * STAGGER_STEP} />
          <div className="flex-1 space-y-1.5">
            <Sk className="h-3 w-24 rounded" delay={index * STAGGER_STEP} />
            <Sk className="h-2.5 w-16 rounded" delay={index * STAGGER_STEP} />
          </div>
          <Sk className="h-3.5 w-10 rounded" delay={index * STAGGER_STEP} />
        </div>
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <Sk className="h-3 w-10 rounded" delay={index * STAGGER_STEP} />
            <Sk className="h-3 w-14 rounded" delay={index * STAGGER_STEP} />
          </div>
          <Sk className="h-1.5 w-full rounded-full" delay={index * STAGGER_STEP} />
        </div>
        <div className="mt-4 flex items-end justify-between border-t pt-3">
          <div className="space-y-1.5">
            <Sk className="h-5 w-24 rounded" delay={index * STAGGER_STEP} />
            <Sk className="h-2.5 w-14 rounded" delay={index * STAGGER_STEP} />
          </div>
          <Sk className="h-8 w-20 rounded-xl" delay={index * STAGGER_STEP} />
        </div>
      </div>
    </div>
  );
}

/** Mirrors EquipmentStoreCard: image + brand/rating + title + خرید/اجاره toggle + price row. */
export function ProductCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className={CARD}>
      <Sk className="h-52 w-full rounded-none" delay={index * STAGGER_STEP} />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between">
          <Sk className="h-3 w-16 rounded" delay={index * STAGGER_STEP} />
          <Sk className="h-3 w-10 rounded" delay={index * STAGGER_STEP} />
        </div>
        <Sk className="h-5 w-4/5 rounded" delay={index * STAGGER_STEP} />
        <Sk className="mt-1.5 h-5 w-1/2 rounded" delay={index * STAGGER_STEP} />
        <div className="mt-3 rounded-xl border p-0.5">
          <div className="flex gap-0.5">
            <Sk className="h-7 flex-1 rounded-lg" delay={index * STAGGER_STEP} />
            <Sk className="h-7 flex-1 rounded-lg" delay={index * STAGGER_STEP} />
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div className="space-y-1.5">
            <Sk className="h-5 w-24 rounded" delay={index * STAGGER_STEP} />
            <Sk className="h-2.5 w-16 rounded" delay={index * STAGGER_STEP} />
          </div>
          <Sk className="h-10 w-10 rounded-xl" delay={index * STAGGER_STEP} />
        </div>
      </div>
    </div>
  );
}

/** Mirrors destination cards: tall image (h-64) + description + stats + CTA. */
export function DestinationCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className={CARD}>
      <div className="relative h-64 overflow-hidden">
        <Sk className="h-full w-full rounded-none" delay={index * STAGGER_STEP} />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <Sk className="mb-2 h-3 w-20 rounded" delay={index * STAGGER_STEP} />
          <Sk className="h-7 w-32 rounded" delay={index * STAGGER_STEP} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Sk className="h-4 w-full rounded" delay={index * STAGGER_STEP} />
        <Sk className="mt-2 h-4 w-2/3 rounded" delay={index * STAGGER_STEP} />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Sk className="h-16 rounded-2xl" delay={index * STAGGER_STEP} />
          <Sk className="h-16 rounded-2xl" delay={index * STAGGER_STEP} />
        </div>
        <Sk className="mt-4 h-11 w-full rounded-2xl" delay={index * STAGGER_STEP} />
      </div>
    </div>
  );
}

/** Mirrors blog grid cards: image h-52 + meta + title + excerpt + CTA. */
export function BlogCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className={CARD}>
      <Sk className="h-52 w-full rounded-none" delay={index * STAGGER_STEP} />
      <div className="flex flex-1 flex-col p-5">
        <Sk className="mb-2 h-3 w-24 rounded" delay={index * STAGGER_STEP} />
        <Sk className="h-5 w-4/5 rounded" delay={index * STAGGER_STEP} />
        <Sk className="mt-1.5 h-5 w-3/5 rounded" delay={index * STAGGER_STEP} />
        <Sk className="mt-2 h-4 w-full rounded" delay={index * STAGGER_STEP} />
        <div className="mt-auto pt-4" />
        <Sk className="h-3.5 w-20 rounded" delay={index * STAGGER_STEP} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page skeletons                                                      */
/* ------------------------------------------------------------------ */

/** /tours — header + toolbar + lg filter sidebar + 3-col grid of 6 tour cards. */
export function ToursPageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="relative min-h-screen pb-32 pt-24 md:pt-28"
    >
      <span className="sr-only">در حال بارگذاری…</span>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Sk className="h-9 w-9 rounded-xl" />
            <Sk className="h-3 w-28 rounded" />
          </div>
          <Sk className="h-9 w-72 max-w-full rounded-xl md:h-12 md:w-[30rem]" delay={40} />
          <Sk className="mt-1.5 h-9 w-56 max-w-full rounded-xl md:h-12" delay={80} />
          <Sk className="mt-3 h-4 w-48 rounded" delay={120} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* Filter sidebar — desktop only (mirrors aside hidden lg:block) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterSidebarSkeleton />
            </div>
          </aside>

          <div>
            {/* Toolbar — sort + grid/list toggle */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 p-3 backdrop-blur">
              <div className="flex items-center gap-2 max-sm:w-full">
                <Sk className="h-4 w-16 rounded" />
                <Sk className="h-9 w-40 rounded-xl max-sm:flex-1" />
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 max-sm:flex-1">
                <Sk className="h-7 w-24 rounded-lg" />
                <Sk className="h-7 w-20 rounded-lg" />
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <RichTourCardSkeleton key={i} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** /equipment — hero + category chips + lg sidebar + 2/3/4-col grid of 8 products. */
export function EquipmentPageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="min-h-screen bg-background pb-24 pt-28">
      <span className="sr-only">در حال بارگذاری…</span>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-6">
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
              <Sk className="h-10 w-10 rounded-2xl" />
              <Sk className="h-3 w-28 rounded" />
            </div>
            <Sk className="h-10 w-72 max-w-full rounded-xl md:h-12 md:w-[30rem]" delay={40} />
            <Sk className="h-4 w-full max-w-2xl rounded" delay={80} />
            <div className="flex flex-wrap items-center gap-4">
              <Sk className="h-4 w-20 rounded" delay={120} />
              <Sk className="h-4 w-20 rounded" delay={160} />
              <Sk className="h-4 w-20 rounded" delay={200} />
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="-mx-4 flex gap-2 overflow-hidden px-4 pb-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Sk
              key={i}
              className="h-11 w-28 shrink-0 rounded-2xl"
              delay={i * 60}
            />
          ))}
        </div>
      </div>

      {/* Main layout — mirrors lg:grid-cols-[280px_1fr] */}
      <div className="mx-auto mt-6 max-w-7xl gap-6 px-4 md:px-6 lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterSidebarSkeleton />
          </div>
        </aside>

        <div className="space-y-5">
          {/* Toolbar — count + search + filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Sk className="h-7 w-24 rounded" />
            <div className="flex items-center gap-2 max-sm:w-full">
              <Sk className="h-9 w-44 rounded-lg md:w-56 max-sm:h-11 max-sm:min-w-0 max-sm:flex-1" />
              <Sk className="h-9 w-24 rounded-xl max-sm:h-11" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 max-sm:gap-3 max-[360px]:grid-cols-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** /destinations — hero + sticky chips/search bar + 3-col grid of 6 tall cards. */
export function DestinationsPageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="bg-background pt-24 md:pt-28">
      <span className="sr-only">در حال بارگذاری…</span>
      {/* Hero */}
      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <PageHeaderSkeleton />
        </div>
      </section>

      {/* Sticky filter bar */}
      <section className="border-y bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-hidden pb-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Sk
                  key={i}
                  className="h-9 w-24 shrink-0 rounded-full"
                  delay={i * 60}
                />
              ))}
            </div>
            <Sk className="h-10 w-full rounded-full md:w-64" delay={120} />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <Sk className="h-4 w-28 rounded" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DestinationCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/** /blog — centered header + featured split card + 3-col grid of 6 posts. */
export function BlogPageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="bg-background pt-28">
      <span className="sr-only">در حال بارگذاری…</span>
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {/* Header — centered */}
          <div className="mb-12 flex flex-col items-center text-center">
            <Sk className="mb-3 h-9 w-28 rounded-full" />
            <Sk className="h-10 w-72 max-w-full rounded-xl md:h-14 md:w-[28rem]" delay={40} />
            <Sk className="mt-4 h-4 w-64 max-w-full rounded md:w-96" delay={80} />
          </div>

          {/* Featured post — mirrors md:grid-cols-2 split card */}
          <div className="mb-12 grid gap-6 overflow-hidden rounded-[2rem] border bg-card shadow-sm md:grid-cols-2">
            <Sk
              className="h-72 w-full rounded-none md:h-full md:min-h-[420px]"
              delay={120}
            />
            <div className="flex flex-col justify-center p-6 md:p-10">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Sk className="h-6 w-20 rounded-full" delay={160} />
                <Sk className="h-3.5 w-16 rounded" delay={160} />
                <Sk className="h-3.5 w-20 rounded" delay={160} />
              </div>
              <Sk className="h-8 w-full rounded md:h-10" delay={160} />
              <Sk className="mt-2 h-8 w-3/4 rounded md:h-10" delay={160} />
              <Sk className="mt-4 h-4 w-full rounded" delay={160} />
              <Sk className="mt-2 h-4 w-5/6 rounded" delay={160} />
              <div className="mt-6 flex items-center gap-3">
                <Sk className="h-10 w-10 rounded-full" delay={160} />
                <div className="space-y-1.5">
                  <Sk className="h-3.5 w-24 rounded" delay={160} />
                  <Sk className="h-3 w-16 rounded" delay={160} />
                </div>
              </div>
              <Sk className="mt-6 h-4 w-20 rounded" delay={160} />
            </div>
          </div>

          {/* Rest grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <BlogCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/** /category/[category] — full-bleed hero banner + stats bar + chips + 3-col grid. */
export function CategoryPageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="bg-background pt-20">
      <span className="sr-only">در حال بارگذاری…</span>
      {/* Hero banner — mirrors h-[50vh] min-h-[380px] with bottom-anchored content */}
      <section className="relative h-[50vh] min-h-[380px] overflow-hidden">
        <Sk className="h-full w-full rounded-none" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest/60 to-transparent pt-16">
          <div className="mx-auto max-w-7xl p-6 md:p-10">
            <div className="mb-4 flex items-center gap-1.5">
              <Sk className="h-3.5 w-10 rounded bg-cream/40" />
              <Sk className="h-3.5 w-1.5 rounded bg-cream/40" />
              <Sk className="h-3.5 w-12 rounded bg-cream/40" />
            </div>
            <div className="mb-3 flex items-center gap-3">
              <Sk className="h-14 w-14 rounded-2xl bg-cream/25" delay={60} />
              <Sk
                className="h-10 w-48 rounded-xl bg-cream/40 md:h-12"
                delay={60}
              />
            </div>
            <Sk className="h-4 w-72 max-w-full rounded bg-cream/25" delay={120} />
          </div>
        </div>
      </section>

      {/* Stats bar — mirrors grid-cols-2 md:grid-cols-4 */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Sk className="h-8 w-16 rounded" delay={i * 60} />
              <Sk className="h-3 w-14 rounded" delay={i * 60} />
            </div>
          ))}
        </div>
      </section>

      {/* Category pills + sort */}
      <section className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-hidden pb-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Sk
                  key={i}
                  className="h-9 w-24 shrink-0 rounded-full"
                  delay={i * 60}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Sk className="h-3.5 w-16 rounded" />
              <Sk className="h-8 w-24 rounded-full" delay={120} />
            </div>
          </div>
        </div>
      </section>

      {/* Tours grid — same card family as /tours, image h-52 */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6">
            <Sk className="h-8 w-44 rounded-xl" />
            <Sk className="mt-2 h-4 w-40 rounded" delay={60} />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RichTourCardSkeleton
                key={i}
                index={i}
                imageClassName="h-52"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/** /tours/[id] — breadcrumb + title + gallery + sticky booking card (lg) + mobile CTA bar hint. */
export function TourDetailSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="relative min-h-screen pb-20 pt-24 max-lg:pb-40 md:pt-28"
    >
      <span className="sr-only">در حال بارگذاری…</span>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-1.5">
          <Sk className="h-3 w-10 rounded" />
          <Sk className="h-3 w-1.5 rounded" />
          <Sk className="h-3 w-10 rounded" />
          <Sk className="h-3 w-1.5 rounded" />
          <Sk className="h-3 w-16 rounded" />
        </div>

        {/* Title block */}
        <div className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Sk className="h-7 w-20 rounded-full" />
            <Sk className="h-7 w-20 rounded-full" />
            <Sk className="h-7 w-32 rounded-full" />
          </div>
          <Sk
            className="h-8 w-80 max-w-full rounded-xl md:h-10 md:w-[30rem]"
            delay={40}
          />
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Sk className="h-4 w-24 rounded" delay={80} />
            <Sk className="h-4 w-20 rounded" delay={120} />
            <Sk className="h-4 w-28 rounded" delay={160} />
            <Sk className="h-4 w-24 rounded" delay={200} />
          </div>
        </div>

        {/* Gallery + Booking — mirrors lg:grid-cols-[1fr_360px] */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Sk className="aspect-[16/10] w-full rounded-3xl" delay={120} />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Sk
                  key={i}
                  className="aspect-[4/3] w-20 rounded-2xl sm:w-24"
                  delay={160 + i * 40}
                />
              ))}
            </div>
            {/* Leader card hint */}
            <div className="rounded-3xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <Sk className="h-14 w-14 rounded-full" delay={200} />
                <div className="flex-1 space-y-2">
                  <Sk className="h-4 w-32 rounded" delay={200} />
                  <Sk className="h-3 w-24 rounded" delay={200} />
                </div>
                <Sk className="h-8 w-20 rounded-xl" delay={200} />
              </div>
            </div>
          </div>

          {/* Booking box — sticky on desktop (mirrors lg:sticky lg:top-24) */}
          <div className="hidden lg:block">
            <div className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-lg backdrop-blur-md lg:sticky lg:top-24">
              <div className="mb-4 flex items-end justify-between">
                <div className="space-y-1.5">
                  <Sk className="h-3 w-16 rounded" delay={120} />
                  <Sk className="h-8 w-32 rounded" delay={120} />
                  <Sk className="h-2.5 w-14 rounded" delay={120} />
                </div>
                <Sk className="h-7 w-16 rounded-full" delay={120} />
              </div>
              <div className="mb-4 flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2">
                <Sk className="h-3 w-24 rounded" delay={160} />
                <Sk className="h-3 w-12 rounded" delay={160} />
              </div>
              <div className="space-y-2.5">
                <Sk className="h-3.5 w-20 rounded" delay={200} />
                <Sk className="h-10 w-full rounded-xl" delay={200} />
                <Sk className="h-3.5 w-16 rounded" delay={240} />
                <Sk className="h-10 w-full rounded-xl" delay={240} />
                <Sk className="h-12 w-full rounded-2xl" delay={280} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs hint */}
        <div className="mt-12">
          <div className="flex flex-wrap gap-1 rounded-2xl bg-secondary/60 p-1.5">
            {[0, 1, 2, 3].map((i) => (
              <Sk key={i} className="h-9 w-24 rounded-xl" delay={i * 60} />
            ))}
          </div>
          <div className="mt-6 space-y-2.5">
            <Sk className="h-4 w-full rounded" />
            <Sk className="h-4 w-11/12 rounded" delay={40} />
            <Sk className="h-4 w-2/3 rounded" delay={80} />
          </div>
        </div>
      </div>

      {/* Mobile sticky booking bar hint — mirrors MobileStickyCTA (lg:hidden, above bottom nav) */}
      <div className="fixed inset-x-0 z-30 border-t border-border/60 bg-background/90 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="shrink-0 space-y-1">
            <Sk className="h-5 w-24 rounded" />
            <Sk className="h-2.5 w-16 rounded" />
          </div>
          <Sk className="h-11 min-h-11 flex-1 rounded-2xl sm:max-w-64" />
        </div>
      </div>
    </div>
  );
}

/** /equipment/[id] — breadcrumb + square gallery + details column + specs grid. */
export function ProductDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" className="min-h-screen bg-background pb-24 pt-24">
      <span className="sr-only">در حال بارگذاری…</span>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6">
        <div className="flex items-center gap-1.5">
          <Sk className="h-3 w-10 rounded" />
          <Sk className="h-3 w-1.5 rounded" />
          <Sk className="h-3 w-12 rounded" />
          <Sk className="h-3 w-1.5 rounded" />
          <Sk className="h-3 w-20 rounded" />
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 md:px-6">
        {/* Gallery + details — mirrors grid-cols-1 gap-8 lg:grid-cols-2 */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <Sk className="aspect-square w-full rounded-3xl" delay={40} />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Sk
                  key={i}
                  className="h-20 w-20 rounded-2xl"
                  delay={80 + i * 40}
                />
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Sk className="h-6 w-20 rounded-full" />
              <Sk className="h-4 w-16 rounded" />
              <Sk className="h-6 w-24 rounded-full" />
            </div>
            <div>
              <Sk className="h-7 w-72 max-w-full rounded-xl md:h-8" delay={40} />
              <Sk className="mt-2 h-7 w-48 rounded-xl md:h-8" delay={80} />
              <div className="mt-3 flex items-center gap-3">
                <Sk className="h-4 w-28 rounded" delay={120} />
                <Sk className="h-4 w-16 rounded" delay={160} />
              </div>
            </div>

            {/* Mode toggle + price */}
            <div className="rounded-3xl border bg-card p-5">
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border p-0.5">
                <Sk className="h-9 rounded-lg" delay={120} />
                <Sk className="h-9 rounded-lg" delay={120} />
              </div>
              <div className="flex items-end justify-between">
                <div className="space-y-1.5">
                  <Sk className="h-3 w-14 rounded" delay={160} />
                  <Sk className="h-7 w-32 rounded" delay={160} />
                  <Sk className="h-2.5 w-16 rounded" delay={160} />
                </div>
                <Sk className="h-12 w-32 rounded-2xl" delay={200} />
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              <Sk className="h-16 rounded-2xl" delay={200} />
              <Sk className="h-16 rounded-2xl" delay={240} />
              <Sk className="h-16 rounded-2xl" delay={280} />
            </div>
          </div>
        </div>

        {/* Description + specs — mirrors mt-12 lg:grid-cols-2 */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[0, 1].map((g) => (
            <div key={g} className="rounded-3xl border bg-card p-6">
              <Sk className="mb-3 h-5 w-32 rounded" delay={g * 80} />
              <div className="space-y-2.5">
                <Sk className="h-4 w-full rounded" delay={g * 80 + 40} />
                <Sk className="h-4 w-11/12 rounded" delay={g * 80 + 80} />
                <Sk className="h-4 w-2/3 rounded" delay={g * 80 + 120} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
