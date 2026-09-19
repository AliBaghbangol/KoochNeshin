"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mountain, Tent, Palmtree, Landmark, TreePine, ArrowLeft } from "lucide-react";
import { useGo } from "@/lib/use-go";
import { useAllTours } from "@/hooks/use-all-tours";
import { toFa } from "@/lib/format";
import type { TourCategory } from "@/types";
import {
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";
import { cn } from "@/lib/utils";

const CATEGORIES: {
  id: TourCategory;
  label: string;
  icon: typeof Mountain;
  gradient: string;
  accent: string;
  image: string;
}[] = [
  {
    id: "mountain",
    label: "کوهنوردی",
    icon: Mountain,
    gradient: "from-emerald to-emerald-dark",
    accent: "text-gold",
    image: "/images/tours/mountain-2.jpg",
  },
  {
    id: "forest",
    label: "جنگل",
    icon: TreePine,
    gradient: "from-emerald-light to-emerald",
    accent: "text-cream",
    image: "/images/tours/forest-1.jpg",
  },
  {
    id: "desert",
    label: "بیابان‌گردی",
    icon: Tent,
    gradient: "from-sunset to-sunset-dark",
    accent: "text-cream",
    image: "/images/tours/desert-1.jpg",
  },
  {
    id: "coastal",
    label: "ساحلی",
    icon: Palmtree,
    gradient: "from-emerald-light to-sunset",
    accent: "text-cream",
    image: "/images/tours/coastal-1.jpg",
  },
  {
    id: "historical",
    label: "تاریخی",
    icon: Landmark,
    gradient: "from-gold to-sunset",
    accent: "text-forest",
    image: "/images/tours/historical-1.jpg",
  },
];

export function CategoryExplorer() {
  const go = useGo();
  const allTours = useAllTours();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="h-px w-10 bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              دسته‌بندی تورها
            </span>
            <span className="h-px w-10 bg-primary" />
          </div>
          <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">
            سفرت را بر اساس <span className="text-gradient-emerald">علاقه</span> انتخاب کن
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            ۵ دسته متنوع از تجربه‌های سفر در ایران — از صعود قله تا کاوش کویر.
          </p>
        </ScrollReveal>

        <StaggerGroup className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const count = allTours.filter((t) => t.category === c.id).length;
            return (
              <motion.button
                key={c.id}
                variants={staggerItem}
                onClick={() => go("category", { category: c.id })}
                className="group relative aspect-[3/4] overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:shadow-xl"
              >
                <SmartImage
                  src={c.image}
                  alt={c.label}
                  fallback="destination"
                  shimmer={false}
                  aspectClass="absolute inset-0"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className={cn("absolute inset-0 bg-gradient-to-t opacity-80", c.gradient)} />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/50 to-transparent" />

                {/* Icon */}
                <div className={cn("absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-2xl bg-cream/15 backdrop-blur", c.accent)}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-4 text-cream">
                  <h3 className="text-lg font-extrabold max-sm:text-base">{c.label}</h3>
                  <p className="text-[11px] text-cream/80">{toFa(count)} تور فعال</p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-bold opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    مشاهده
                    <ArrowLeft className="h-3 w-3 transition group-hover:-translate-x-1" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
