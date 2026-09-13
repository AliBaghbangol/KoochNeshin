"use client";

import * as React from "react";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Star } from "lucide-react";

import { useGo } from "@/lib/use-go";
import { toFa, CATEGORY_LABELS } from "@/lib/format";

// Top 5 destinations — different from hero slides
const TOP_5 = [
  {
    id: "d2",
    name: "کندوان",
    province: "آذربایجان شرقی",
    image: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=1920&h=1080&fit=crop&q=85",
    description: "روستای صخره‌ای هزاران ساله با معماری منحصربه‌فرد، خانه‌هایی کنده شده در کوه.",
    category: "historical" as const,
    rating: 4.7,
    toursCount: 5,
  },
  {
    id: "d6",
    name: "تخت جمشید",
    province: "فارس",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1920&h=1080&fit=crop&q=85",
    description: "پایتخت باشکوه هخامنشیان، نماد شکوه و تمدن ایران باستان.",
    category: "historical" as const,
    rating: 4.9,
    toursCount: 5,
  },
  {
    id: "d7",
    name: "ماسوله",
    province: "گیلان",
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1920&h=1080&fit=crop&q=85",
    description: "روستای پلکانی سرسبز در دل جنگل‌های هیرکانی، با معماری بومی زیبا.",
    category: "forest" as const,
    rating: 4.7,
    toursCount: 4,
  },
  {
    id: "d8",
    name: "کویر مرنجاب",
    province: "اصفهان",
    image: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1920&h=1080&fit=crop&q=85",
    description: "سیاه‌کوه‌ها و ریگ‌های طلایی کنار کاروانسرای تاریخی صفوی.",
    category: "desert" as const,
    rating: 4.6,
    toursCount: 6,
  },
  {
    id: "d5",
    name: "جزیره قشم",
    province: "هرمزگان",
    image: "https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=1920&h=1080&fit=crop&q=85",
    description: "جزیره زمین‌شناسی با دره ستارگان، جنگل حرا و فرهنگ دریانوردان.",
    category: "coastal" as const,
    rating: 4.9,
    toursCount: 7,
  },
];

export function HorizontalDestinations() {
  const go = useGo();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const slides = TOP_5.length;

  React.useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      const idx = Math.min(slides - 1, Math.floor(v * slides));
      setActiveIndex(idx);
    });
  }, [scrollYProgress, slides]);

  const current = TOP_5[activeIndex] ?? TOP_5[0];

  // Each destination = exactly 100vh. SnapScroll will create sub-snap-points
  // at each viewport boundary, so scrolling inside this section goes
  // destination-by-destination, NOT jumping past the whole section.
  return (
    <section
      ref={containerRef}
      className="relative bg-forest"
      style={{ height: `${slides * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden max-lg:h-[100dvh]">
        {/* Full-bleed image — direct <img> for reliability */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img
              src={current.image}
              alt={current.name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>

        {/* Subtle gradients — keep image visible but text readable */}
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-forest via-forest/40 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l from-forest/60 to-transparent" />

        {/* Header */}
        <div className="absolute inset-x-0 top-0 z-20 p-6 md:p-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-2">
              <span className="h-px w-10 bg-gold" />
              <span className="text-xs font-bold uppercase tracking-widest text-gold">
                مقاصد پیشنهادی
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-cream md:text-3xl">
              ۵ مقصد برتر ایران
            </h2>
          </div>
        </div>

        {/* Content — bottom right (raised below lg so it never sits under
            the fixed bottom nav — v27 tablet fix) */}
        <div className="absolute bottom-0 right-0 z-20 p-6 max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-10">
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1 text-xs font-bold text-forest backdrop-blur">
                  {CATEGORY_LABELS[current.category]}
                </span>

                <div className="mb-1 flex items-center gap-1.5 text-sm text-cream/80">
                  <MapPin className="h-4 w-4" />
                  {current.province}
                </div>

                <h3 className="text-4xl font-extrabold text-cream md:text-6xl">
                  {current.name}
                </h3>

                <p className="mt-3 text-base leading-8 text-cream/80 md:text-lg">
                  {current.description}
                </p>

                <div className="mt-4 flex items-center gap-4 text-sm text-cream/90">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-gold text-gold" />
                    {toFa(current.rating)}
                  </span>
                  <span className="h-3 w-px bg-cream/30" />
                  <span>{toFa(current.toursCount)} تور فعال</span>
                  <span className="h-3 w-px bg-cream/30" />
                  <span className="font-mono text-cream/50">
                    {toFa(activeIndex + 1).padStart(2, "۰")} / {toFa(slides).padStart(2, "۰")}
                  </span>
                </div>

                <button
                  onClick={() => go("tours", { destination: current.name })}
                  className="mt-5 flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-forest transition hover:bg-gold-light"
                >
                  مشاهده تورهای {current.name}
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Horizontal indicators — bottom center, dots only, no text */}
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 max-lg:bottom-[calc(4.25rem+env(safe-area-inset-bottom))]">
          {TOP_5.map((d, i) => (
            <button
              key={d.id}
              onClick={() => {
                const targetScroll = (i / slides) * (slides * window.innerHeight);
                const containerTop = containerRef.current?.offsetTop ?? 0;
                window.scrollTo({ top: targetScroll + containerTop, behavior: "smooth" });
              }}
              aria-label={d.name}
              className={
                "max-lg:relative max-lg:after:absolute max-lg:after:-inset-3 max-lg:after:content-[''] " +
                (i === activeIndex
                  ? "h-1.5 w-8 rounded-full bg-gold transition-all duration-500"
                  : "h-1.5 w-1.5 rounded-full bg-cream/30 transition-all duration-500 hover:bg-cream/60")
              }
            />
          ))}
        </div>

        {/* Progress bar */}
        <motion.div
          style={{ scaleX: scrollYProgress }}
          className="absolute bottom-0 right-0 z-20 h-1 w-full origin-right bg-gradient-to-l from-gold via-sunset to-emerald"
        />

      </div>
    </section>
  );
}
