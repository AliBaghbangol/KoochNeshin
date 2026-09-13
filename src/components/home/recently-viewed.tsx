"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Clock, ArrowLeft, X, History } from "lucide-react";
import { useRecent } from "@/store/recent-store";
import { useGo } from "@/lib/use-go";
import { tours } from "@/mocks/tours";
import { useAllTours } from "@/hooks/use-all-tours";
import {
  toFa,
  formatCurrency,
  toPersianShortDate,
  CATEGORY_LABELS,
} from "@/lib/format";
import { ScrollReveal, StaggerGroup, staggerItem } from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";
import { TiltCard } from "@/components/animations/tilt-card";

export function RecentlyViewed() {
  const tourIds = useRecent((s) => s.tourIds);
  const clear = useRecent((s) => s.clear);
  const go = useGo();
  const allTours = useAllTours();

  const recentTours = tourIds
    .map((id) => allTours.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 4) as typeof tours;

  if (recentTours.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal className="mb-8 flex items-end justify-between max-sm:flex-wrap max-sm:gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/10 text-gold">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold md:text-3xl">
                  دیده‌شده‌های اخیر
                </h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-muted-foreground">
                  {toFa(recentTours.length)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                تورهایی که اخیراً مشاهده کردی
              </p>
            </div>
          </div>
          <button
            onClick={clear}
            className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition max-sm:min-h-11 hover:border-destructive hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            پاک کردن
          </button>
        </ScrollReveal>

        <StaggerGroup className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {recentTours.map((t) => {
            const left = t.capacity - t.reservedCount;
            const finalPrice = t.discountPrice ?? t.price;
            return (
              <motion.div key={t.id} variants={staggerItem}>
                <TiltCard className="h-full" max={8}>
                  <div
                    onClick={() => go("tour-detail", { id: t.id })}
                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-lg"
                  >
                    <div className="relative h-32 overflow-hidden md:h-36">
                      <SmartImage
                        src={t.images[0]}
                        alt={t.title}
                        fallback="tour"
                        fallbackLabel={CATEGORY_LABELS[t.category]}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
                      <span className="absolute right-2 top-2 rounded-full bg-cream/90 px-2 py-0.5 text-[10px] font-bold text-forest backdrop-blur">
                        {CATEGORY_LABELS[t.category]}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <h3 className="line-clamp-2 text-sm font-bold leading-6 transition group-hover:text-primary">
                        {t.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {toFa(t.duration)} روز • {toPersianShortDate(t.startDate)}
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2 max-sm:flex-col max-sm:items-start max-sm:gap-1">
                        <span className="text-xs font-extrabold text-primary">
                          {formatCurrency(finalPrice)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {toFa(left)} نفر باقی
                        </span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </StaggerGroup>

        <div className="mt-6 text-center">
          <button
            onClick={() => go("tours")}
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            مشاهده همه تورها
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
