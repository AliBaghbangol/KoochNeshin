"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Mountain, Users, MapPin, CalendarCheck, Sparkles } from "lucide-react";
import { Counter } from "@/components/animations/counter";
import { formatNumber } from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";

const STATS = [
  {
    icon: MapPin,
    value: 15,
    label: "مقصد فعال",
    color: "text-emerald",
    bg: "bg-emerald/10",
    suffix: "+",
  },
  {
    icon: Mountain,
    value: 120,
    label: "لیدر حرفه‌ای",
    color: "text-sunset",
    bg: "bg-sunset/10",
    suffix: "+",
  },
  {
    icon: Users,
    value: 8400,
    label: "مسافر راضی",
    color: "text-gold",
    bg: "bg-gold/10",
    suffix: "+",
    format: (n: number) => formatNumber(Math.round(n)),
  },
  {
    icon: CalendarCheck,
    value: 320,
    label: "تور برگزار شده",
    color: "text-primary",
    bg: "bg-primary/10",
    suffix: "",
  },
];

export function StatsSection() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 150, damping: 20 });
  const sy = useSpring(my, { stiffness: 150, damping: 20 });

  const onMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMove}
      className="relative overflow-hidden bg-forest py-24 text-cream"
    >
      {/* Cursor-follow glow */}
      <motion.div
        style={{
          left: useTransform(sx, (v) => `${v}%`),
          top: useTransform(sy, (v) => `${v}%`),
        }}
        className="pointer-events-none absolute h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
      />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-10" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/5 px-4 py-1.5 text-sm text-cream/80 backdrop-blur">
            <Sparkles className="h-4 w-4 text-gold" />
            چرا کوچ‌نشین؟
          </div>
          <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">
            عددها حرف می‌زنند
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-cream/70">
            اعتماد هزاران مسافر، ما را به یکی از معتبرترین پلتفرم‌های گردشگری
            ایران تبدیل کرده است.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-3xl border border-cream/10 bg-cream/5 p-6 text-center backdrop-blur transition max-sm:p-4 hover:border-gold/40 hover:bg-cream/10"
              >
                <div
                  className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl ${s.bg} ${s.color}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div className="text-4xl font-extrabold max-sm:text-3xl md:text-5xl">
                  <Counter
                    to={s.value}
                    suffix={s.suffix}
                    format={s.format}
                    className="text-gradient-gold"
                  />
                </div>
                <p className="mt-2 text-sm text-cream/70">{s.label}</p>

                {/* Hover line */}
                <div className="absolute inset-x-0 bottom-0 h-0.5 origin-right scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
              </motion.div>
            );
          })}
        </div>

        {/* Feature bullets */}
        <ScrollReveal className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "تورهای رقابتی",
              desc: "چند لیدر، یک مقصد — بهترین قیمت و کیفیت را انتخاب کن.",
            },
            {
              title: "لیدرهای تایید‌شده",
              desc: "همه لیدرها احراز هویت شده‌اند و تخصصشان تایید شده.",
            },
            {
              title: "اجاره تجهیزات",
              desc: "به جای خرید، تجهیزات را برای هر سفر اجاره بزن.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-cream/10 bg-cream/5 p-6 backdrop-blur"
            >
              <div className="mb-2 h-1 w-10 rounded-full bg-gold" />
              <h3 className="text-lg font-bold text-cream">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-cream/70">{f.desc}</p>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
