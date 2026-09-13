"use client";

import * as React from "react";
import { Star, Quote } from "lucide-react";
import { testimonials } from "@/mocks/testimonials";
import { toFa } from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";

function TestimonialCard({
  t,
}: {
  t: (typeof testimonials)[number];
}) {
  return (
    <div className="mx-3 w-80 shrink-0 rounded-3xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SmartImage
            src={t.avatar}
            alt={t.author}
            fallback="avatar"
            shimmer={false}
            aspectClass="h-12 w-12 shrink-0 rounded-full ring-2 ring-gold/30"
            className="h-full w-full object-cover"
          />
          <div>
            <p className="font-bold">{t.author}</p>
            <p className="text-xs text-muted-foreground">{t.role}</p>
          </div>
        </div>
        <Quote className="h-8 w-8 text-primary/15" />
      </div>
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              i < t.rating
                ? "h-4 w-4 fill-gold text-gold"
                : "h-4 w-4 text-muted-foreground/30"
            }
          />
        ))}
      </div>
      <p className="text-sm leading-7 text-foreground/80">{t.text}</p>
      <p className="mt-4 text-xs font-semibold text-primary">— {t.tour}</p>
    </div>
  );
}

export function Testimonials() {
  // Duplicate for seamless marquee
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal className="mb-12 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="h-px w-10 bg-gold" />
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              صدای مسافران
            </span>
            <span className="h-px w-10 bg-gold" />
          </div>
          <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">
            تجربه‌های واقعی، خاطره‌های ماندگار
          </h2>
        </ScrollReveal>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent md:w-40" />

        <div className="flex w-max animate-marquee gap-0 hover:[animation-play-state:paused]">
          {doubled.map((t, i) => (
            <TestimonialCard key={`${t.id}-${i}`} t={t} />
          ))}
        </div>
      </div>

      {/* Summary rating */}
      <ScrollReveal className="mx-auto mt-14 max-w-md">
        <div className="flex items-center justify-center gap-6 rounded-3xl border bg-card p-6 text-center shadow-sm">
          <div>
            <p className="text-4xl font-extrabold text-gradient-gold">
              {toFa(4.8)}
            </p>
            <div className="mt-1 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">میانگین امتیاز</p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div>
            <p className="text-4xl font-extrabold text-primary">{toFa("۲۴۰۰")}</p>
            <p className="mt-1 text-xs text-muted-foreground">نظر ثبت شده</p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
