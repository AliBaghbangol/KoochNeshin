"use client";

import {
  Heart,
  Shield,
  Users,
  Compass,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { Counter } from "@/components/animations/counter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AboutView() {
  return (
    <div className="bg-background pt-28">
      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-emerald/10 blur-3xl" />
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <ScrollReveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-sm">
              <Compass className="h-4 w-4 text-primary" />
              درباره کوچ‌نشین
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              ما به <span className="text-gradient-emerald">سفر</span> باور
              داریم
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              کوچ‌نشین با هدف معرفی زیبایی‌های ایران و توانمندسازی لیدرهای محلی
              متولد شد. ما باور داریم هر سفر، داستانی منحصربه‌فرد است که باید با
              آدم‌های درست تجربه شود.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Heart,
                title: "اشتیاق به طبیعت",
                desc: "هر تور با عشق و دقت طراحی می‌شود تا تجربه‌ای اصیل رقم بخورد.",
                color: "text-sunset bg-sunset/10",
              },
              {
                icon: Shield,
                title: "امنیت و اعتماد",
                desc: "لیدرهای تاییدشده، بیمه مسافر و پشتیبانی ۲۴ ساعته.",
                color: "text-emerald bg-emerald/10",
              },
              {
                icon: Users,
                title: "جامعه محلی",
                desc: "توانمندسازی لیدرهای محلی و حفظ فرهنگ هر منطقه.",
                color: "text-gold bg-gold/10",
              },
            ].map((v, i) => {
              const Icon = v.icon;
              return (
                <ScrollReveal key={v.title} delay={i * 0.1}>
                  <div className="h-full rounded-3xl border bg-card p-8 shadow-sm transition hover:shadow-lg">
                    <div
                      className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${v.color}`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold">{v.title}</h3>
                    <p className="mt-3 leading-7 text-muted-foreground">
                      {v.desc}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { v: 15, l: "مقصد", s: "+" },
              { v: 120, l: "لیدر", s: "+" },
              { v: 8400, l: "مسافر", s: "+" },
              { v: 320, l: "تور", s: "" },
            ].map((s, i) => (
              <ScrollReveal key={s.l} delay={i * 0.1}>
                <div className="rounded-3xl border bg-card p-6 text-center">
                  <div className="text-4xl font-extrabold text-primary md:text-5xl">
                    <Counter to={s.v} suffix={s.s} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.l}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <ScrollReveal>
            <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-emerald to-forest p-8 text-cream md:p-10">
                  <h2 className="text-2xl font-extrabold md:text-3xl">
                    تماس با ما
                  </h2>
                  <p className="mt-3 text-cream/80">
                    سوال یا پیشنهادی داری؟ ما اینجاییم تا کمک کنیم.
                  </p>
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-cream/10">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-cream/60">تلفن</p>
                        {/* Same phone as the footer (single source of truth) */}
                        <a
                          href="tel:09152286636"
                          dir="ltr"
                          className="font-semibold transition hover:text-gold"
                        >
                          09152286636
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-cream/10">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-cream/60">ایمیل</p>
                        <p dir="ltr" className="font-semibold">
                          hello@kochneshin.ir
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-cream/10">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-cream/60">آدرس</p>
                        {/* Same address as the footer (single source of truth) */}
                        <p className="font-semibold">
                          مشهد، بلوار فلاحی، فلاحی ۱، دانشگاه خیام
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8 md:p-10">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      toast.success("پیام شما ارسال شد!", {
                        description: "به‌زودی پاسخ می‌دهیم.",
                      });
                    }}
                    className="space-y-4"
                  >
                    <input
                      placeholder="نام شما"
                      className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                    />
                    <input
                      placeholder="ایمیل"
                      className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                    />
                    <textarea
                      placeholder="پیام شما"
                      rows={4}
                      className="w-full rounded-xl border bg-background p-4 text-sm focus:border-primary focus:outline-none"
                    />
                    <Button
                      type="submit"
                      className="h-11 w-full bg-primary text-primary-foreground"
                    >
                      ارسال پیام
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
