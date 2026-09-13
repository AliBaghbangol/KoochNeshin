"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Activity,
  Dumbbell,
  Clock,
  Footprints,
  Apple,
  Droplet,
  Moon,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { Tour } from "@/types";
import { DIFFICULTY_LABELS } from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

interface FitnessTip {
  icon: typeof Heart;
  title: string;
  description: string;
  duration: string;
  color: string;
  bg: string;
}

const FITNESS_TIPS: Record<Tour["difficulty"], FitnessTip[]> = {
  easy: [
    {
      icon: Footprints,
      title: "پیاده‌روی روزانه",
      description: "۳۰ دقیقه پیاده‌روی سبک روزانه برای آمادگی عمومی.",
      duration: "۱ هفته قبل",
      color: "text-emerald",
      bg: "bg-emerald/10",
    },
    {
      icon: Droplet,
      title: "هیدراته ماندن",
      description: "روزانه ۲ لیتر آب بنوشید، مخصوصاً در روزهای گرم.",
      duration: "همیشه",
      color: "text-blue",
      bg: "bg-blue/10",
    },
    {
      icon: Apple,
      title: "تغذیه سبک",
      description: "وعده‌های سبک و پرانرژی مثل خرما، مغزها و میوه.",
      duration: "روز سفر",
      color: "text-gold",
      bg: "bg-gold/10",
    },
  ],
  medium: [
    {
      icon: Dumbbell,
      title: "تمرینات قدرتی",
      description: "۳ روز در هفته تمرینات پا و هسته بدن (اسکات، لانگز).",
      duration: "۳ هفته قبل",
      color: "text-sunset",
      bg: "bg-sunset/10",
    },
    {
      icon: Activity,
      title: "کاردیو متوسط",
      description: "۴۵ دقیقه دویدن یا دوچرخه‌سواری، ۳ روز در هفته.",
      duration: "۲ هفته قبل",
      color: "text-emerald",
      bg: "bg-emerald/10",
    },
    {
      icon: Footprints,
      title: "پیاده‌روی با کوله",
      description: "پیاده‌روی با کوله ۵ کیلویی برای سازگاری پا.",
      duration: "۱ هفته قبل",
      color: "text-gold",
      bg: "bg-gold/10",
    },
    {
      icon: Moon,
      title: "استراحت کافی",
      description: "حداقل ۷ ساعت خواب در شب قبل از سفر.",
      duration: "شب قبل",
      color: "text-blue",
      bg: "bg-blue/10",
    },
  ],
  hard: [
    {
      icon: Dumbbell,
      title: "برنامه تمرینی جدی",
      description: "۵ روز در هفته تمرینات قدرتی + کاردیو شدید. مشورت با مربی توصیه می‌شود.",
      duration: "۲ ماه قبل",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      icon: Activity,
      title: "کاردیو شدید",
      description: "۶۰ دقیقه دویدن طولانی یا کوهپیمایی، ۴ روز در هفته.",
      duration: "۶ هفته قبل",
      color: "text-sunset",
      bg: "bg-sunset/10",
    },
    {
      icon: Footprints,
      title: "صعود تمرینی",
      description: "حداقل ۲ صعود تمرینی به قله‌های بالای ۳۰۰۰ متر.",
      duration: "۴ هفته قبل",
      color: "text-emerald",
      bg: "bg-emerald/10",
    },
    {
      icon: Heart,
      title: "چکاپ پزشکی",
      description: "معاینه قلب و فشار خون قبل از شروع برنامه.",
      duration: "۲ ماه قبل",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      icon: Droplet,
      title: "آب‌رسانی مداوم",
      description: "روزانه ۳-۴ لیتر آب در طول تمرین و صعود.",
      duration: "همیشه",
      color: "text-blue",
      bg: "bg-blue/10",
    },
    {
      icon: Moon,
      title: "استراحت و بازیابی",
      description: "خواب کافی (۸ ساعت) + استراحت بین تمرینات.",
      duration: "همیشه",
      color: "text-blue",
      bg: "bg-blue/10",
    },
  ],
};

const WARNING_TEXTS: Record<Tour["difficulty"], string[]> = {
  easy: [
    "برای افراد با مشکلات قلبی، مشورت با پزشک توصیه می‌شود.",
    "کفش مناسب پیاده‌روی ضروری است.",
  ],
  medium: [
    "اگر سابقه کمردرد یا زانودرد دارید، از کفش طبی استفاده کنید.",
    "در صورت احساس سرگیجه یا تپش قلب، فعالیت را متوقف کنید.",
    "کرم ضدآفتاب و کلاه فراموش نشود.",
  ],
  hard: [
    "بدون آمادگی کافی صعود نکنید — خطر سلامتی جدی!",
    "تجهیزات اضطراری (کیت اولیه، اکسیژن) همیشه همراه داشته باشید.",
    "در ارتفاع بالا، سرعت صعود را کاهش دهید و استراحت کنید.",
    "اگر سابقه بیماری قلبی یا تنفسی دارید، حتماً با پزشک مشورت کنید.",
    "هیچ‌گاه تنها صعود نکنید — همیشه با تیم همراه باشید.",
  ],
};

export function FitnessTips({ tour }: { tour: Tour }) {
  const tips = FITNESS_TIPS[tour.difficulty];
  const warnings = WARNING_TEXTS[tour.difficulty];

  return (
    <ScrollReveal>
      <section className="mt-12">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sunset/10 text-sunset">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-extrabold md:text-2xl">
              راهنمای آمادگی جسمانی
            </h3>
            <p className="text-xs text-muted-foreground">
              سطح سختی: {DIFFICULTY_LABELS[tour.difficulty]} — برنامه آمادگی پیشنهادی
            </p>
          </div>
        </div>

        {/* Tips grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip, i) => {
            const TipIcon = tip.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-2xl border bg-card p-4 transition hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl",
                      tip.bg,
                      tip.color
                    )}
                  >
                    <TipIcon className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {tip.duration}
                  </span>
                </div>
                <h4 className="text-sm font-bold">{tip.title}</h4>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {tip.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div
            className={cn(
              "mt-6 rounded-2xl border-2 p-5",
              tour.difficulty === "hard"
                ? "border-destructive/30 bg-destructive/5"
                : "border-gold/30 bg-gold/5"
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  tour.difficulty === "hard" ? "text-destructive" : "text-gold"
                )}
              />
              <h4
                className={cn(
                  "font-bold",
                  tour.difficulty === "hard" ? "text-destructive" : "text-gold"
                )}
              >
                هشدارهای مهم
              </h4>
            </div>
            <div className="space-y-2">
              {warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      tour.difficulty === "hard" ? "text-destructive" : "text-gold"
                    )}
                  />
                  <span className="leading-6 text-foreground/80">{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training timeline */}
        <div className="mt-6 rounded-2xl border bg-card p-5">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-bold">
            <Clock className="h-4 w-4 text-primary" />
            جدول زمانی پیشنهادی
          </h4>
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {toFa(i + 1)}
                </span>
                <span className="flex-1 font-semibold">{tip.title}</span>
                <span className="text-muted-foreground">{tip.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
