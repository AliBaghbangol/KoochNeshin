"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { useGo } from "@/lib/use-go";

// Real photos of the actual Iranian destinations — self-hosted (v31)
const SLIDES = [
  {
    url: "/images/hero/damavand.jpg",
    name: "دماوند",
    province: "مازندران",
    caption: "بام ایران",
  },
  {
    url: "/images/hero/abr-forest.jpg",
    name: "جنگل ابر",
    province: "سمنان",
    caption: "بحر مه",
  },
  {
    url: "/images/hero/lut-desert.jpg",
    name: "دشت لوت",
    province: "کرمان",
    caption: "ستاره‌های کویر",
  },
  {
    url: "/images/hero/qeshm-stars-valley.jpg",
    name: "قشم",
    province: "هرمزگان",
    caption: "جزیره خورشید",
  },
] as const;

export function HeroSection() {
  const go = useGo();
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setActive((p) => (p + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  // Prefetch next
  React.useEffect(() => {
    const next = (active + 1) % SLIDES.length;
    const img = new Image();
    img.src = SLIDES[next].url;
  }, [active]);

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-forest md:h-screen">
      {/* ===== Background slideshow — direct <img> for reliable full-bleed ===== */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img
            src={SLIDES[active].url}
            alt={SLIDES[active].name}
            className="h-full w-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Subtle gradient — only top (for navbar) and bottom (for text), keep center clear */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-forest/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-forest via-forest/30 to-transparent" />

      {/* ===== Minimal centered content ===== */}
      {/* v27: max-lg:pb-24 lifts the whole cluster above the fixed bottom
          nav (<1024px) so عنوان و دکمه هرگز با منوی پایین تداخل ندارند */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 pb-24 text-center max-lg:pb-40">
        {/* Slide caption */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/15 bg-forest/30 px-4 py-1.5 text-xs text-cream/80 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-gold" />
              {SLIDES[active].caption}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-[clamp(2.75rem,12vw,3.5rem)] font-extrabold leading-tight text-cream sm:text-6xl md:text-7xl lg:text-8xl"
        >
          کوچ‌نشین
        </motion.h1>

        {/* One-line subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-4 text-base text-cream/70 sm:text-lg"
        >
          سفر به قلب طبیعت ایران
        </motion.p>

        {/* Single CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => go("tours")}
          className="mt-8 flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gold px-8 py-3.5 text-sm font-bold text-forest shadow-2xl shadow-gold/30 transition hover:bg-gold-light sm:w-auto sm:max-w-none sm:justify-start"
        >
          شروع سفر
          <ArrowLeft className="h-4 w-4" />
        </motion.button>
      </div>

      {/* ===== Scroll hint — cinematic ===== */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        onClick={() => {
          const nextSection = document.querySelector("section:nth-of-type(2)");
          nextSection?.scrollIntoView({ behavior: "smooth" });
        }}
        className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 max-lg:bottom-[calc(6.75rem+env(safe-area-inset-bottom))]"
        aria-label="اسکرول کنید"
      >
        <span className="text-[10px] text-cream/40">اسکرول کنید</span>
        <div className="flex h-8 w-5 justify-center rounded-full border border-cream/30 pt-1.5 max-sm:h-6 max-sm:w-4">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1 rounded-full bg-cream/60"
          />
        </div>
      </motion.button>

      {/* ===== Slide indicators ===== */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 max-lg:bottom-[calc(4.25rem+env(safe-area-inset-bottom))] max-lg:gap-1">
        {SLIDES.map((s, i) => (
          <button
            key={s.url}
            onClick={() => setActive(i)}
            aria-label={s.name}
            aria-current={i === active}
            className={
              i === active
                ? "relative h-1.5 w-8 rounded-full bg-gold transition-all duration-500 after:absolute after:-inset-2.5 after:content-['']"
                : "relative h-1.5 w-1.5 rounded-full bg-cream/30 transition-all duration-500 hover:bg-cream/60 after:absolute after:-inset-2.5 after:content-['']"
            }
          />
        ))}
      </div>

      {/* ===== Destination name ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute bottom-8 right-6 z-10 hidden max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:block"
        >
          <div className="text-right">
            <p className="text-2xl font-extrabold text-cream">{SLIDES[active].name}</p>
            <p className="text-xs text-cream/50">{SLIDES[active].province}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
