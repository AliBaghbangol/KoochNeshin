"use client";

import * as React from "react";
import { HeroSection } from "@/components/home/hero-section";
import { SnapScroll } from "@/components/common/snap-scroll";
import { HorizontalDestinations } from "@/components/home/horizontal-destinations";
import { HotTours } from "@/components/home/hot-tours";
import { PopularEquipment } from "@/components/home/popular-equipment";
import { StatsSection } from "@/components/home/stats-section";
import { IranMapExplorer } from "@/components/home/iran-map-explorer";
import { Testimonials } from "@/components/home/testimonials";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { CategoryExplorer } from "@/components/home/category-explorer";
import { CommunityFeaturesSection } from "@/components/home/community-features-section";
import { Footer } from "@/components/layout/footer";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { Mountain, ArrowLeft, Wand2 } from "lucide-react";
import { MagneticButton } from "@/components/animations/magnetic-button";

function PlannerBanner() {
  const go = useGo();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6">
      <button
        onClick={() => go("planner")}
        className="group relative block w-full overflow-hidden rounded-[2rem] bg-gradient-to-l from-forest via-emerald-dark to-emerald p-6 text-right text-cream transition-shadow hover:shadow-2xl hover:shadow-emerald/20 md:p-8"
        aria-label="برنامه‌ریز هوشمند سفر"
      >
        <div className="absolute inset-0 bg-noise opacity-10" />
        <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 right-1/3 h-40 w-40 rounded-full bg-sunset/15 blur-3xl" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Wand2 className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-black md:text-2xl">
                برنامه‌ریز هوشمند سفر
              </h2>
              <p className="mt-1 max-w-lg text-sm text-cream/75">
                بودجه، مدت و سبک را بگو — موتور کوچ‌نشین از بین همه تورها بهترین
                گزینه را با برنامه روزبه‌روز پیشنهاد می‌دهد.
              </p>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-2 rounded-full bg-cream/10 px-5 py-2.5 text-sm font-bold backdrop-blur transition-colors group-hover:bg-cream/20">
            ساخت برنامه
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden />
          </span>
        </div>
      </button>
    </section>
  );
}

function FinalCTA() {
  const go = useGo();
  const setAuthOpen = useNav((s) => s.setAuthOpen);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forest">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald via-emerald-dark to-forest p-10 text-center text-cream md:p-16">
          <div className="absolute inset-0 bg-noise opacity-10" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sunset/20 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-cream/10 backdrop-blur">
              <Mountain className="h-8 w-8 text-gold" />
            </div>
            <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">
              آماده‌ای کوله‌پشتیت را ببندی؟
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/80">
              همین حالا عضو شو و تخفیف ۱۰٪ اولین سفرت را بگیر. ماجراجویی
              منتظر توست!
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <MagneticButton
                onClick={() => setAuthOpen(true)}
                className="h-13 items-center gap-2 rounded-full bg-gold px-8 py-3.5 font-bold text-forest shadow-xl shadow-gold/30 transition hover:bg-gold-light"
              >
                عضویت رایگان
                <ArrowLeft className="h-5 w-5" />
              </MagneticButton>
              <MagneticButton
                onClick={() => go("tours")}
                className="h-13 items-center gap-2 rounded-full border-2 border-cream/30 px-8 py-3.5 font-bold text-cream backdrop-blur transition hover:bg-cream/10"
              >
                کاوش تورها
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeView() {
  return (
    <SnapScroll>
      <HeroSection />
      <HorizontalDestinations />
      <PlannerBanner />
      <HotTours />
      <CommunityFeaturesSection />
      <CategoryExplorer />
      <RecentlyViewed />
      <PopularEquipment />
      <StatsSection />
      <IranMapExplorer />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </SnapScroll>
  );
}
