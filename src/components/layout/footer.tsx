"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Send,
  Youtube,
  ChevronLeft,
} from "lucide-react";
import { useGo } from "@/lib/use-go";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { XLogoIcon } from "@/components/common/x-logo";
import { BrandMark } from "@/components/common/brand-mark";
import { toast } from "sonner";

const FOOTER_LINKS = [
  {
    title: "کاوش کنید",
    links: [
      { label: "همه تورها", view: "tours" as const },
      { label: "تجهیزات کمپینگ", view: "equipment" as const },
      { label: "مجله سفر", view: "blog" as const },
      { label: "درباره کوچ‌نشین", view: "about" as const },
    ],
  },
  {
    title: "حساب کاربری",
    links: [
      { label: "داشبورد من", view: "user-dashboard" as const },
      { label: "پنل لیدر", view: "leader-dashboard" as const },
      { label: "تماس با ما", view: "contact" as const },
      { label: "قوانین و مقررات", view: "about" as const },
    ],
  },
];

export function Footer() {
  const go = useGo();
  const [email, setEmail] = React.useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("عضو خبرنامه شدید!", {
      description: "جدیدترین تورها را زودتر از همه دریافت می‌کنید.",
    });
    setEmail("");
  };

  return (
    <footer className="relative overflow-hidden bg-forest pb-[env(safe-area-inset-bottom)] text-cream max-lg:pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-sunset/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        {/* Newsletter CTA */}
        <ScrollReveal>
          <div className="grid gap-8 border-b border-cream/10 py-14 md:grid-cols-2 md:items-center">
            <div>
              <h3 className="text-3xl font-extrabold text-cream md:text-4xl">
                خبرنامه سفر را دنبال کن
              </h3>
              <p className="mt-3 text-cream/70">
                جدیدترین تورها، تخفیف‌های ویژه و راهنماهای سفر را مستقیم در
                ایمیلت دریافت کن.
              </p>
            </div>
            <form onSubmit={subscribe} className="flex gap-2 max-sm:flex-col max-sm:gap-3">
              <div className="relative flex-1">
                <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cream/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ایمیل شما"
                  className="h-14 w-full rounded-2xl border border-cream/15 bg-cream/5 pr-12 pl-4 text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gold px-6 font-bold text-forest shadow-lg shadow-gold/20"
              >
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">عضویت</span>
                <span className="sm:hidden">عضویت در خبرنامه</span>
              </motion.button>
            </form>
          </div>
        </ScrollReveal>

        {/* Main footer */}
        <div className="grid gap-10 py-14 max-sm:grid-cols-2 max-sm:gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <button onClick={() => go("home")} className="flex items-center gap-2">
              <BrandMark className="h-11 w-11 shadow-lg" />
              <div className="text-right">
                <div className="text-xl font-extrabold text-cream">کوچ‌نشین</div>
                <div className="text-[11px] text-cream/60">سفرهای تجربی ایران</div>
              </div>
            </button>
            <p className="mt-5 max-w-md text-sm leading-7 text-cream/70">
              کوچ‌نشین پلتفرمی است که سفر را به تجربه‌ای اصیل و به‌یادماندنی
              تبدیل می‌کند. لیدرهای محلی حرفه‌ای، تورهای رقابتی و تجهیزات
              گردشگری در یک جای شما.
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Youtube, XLogoIcon].map((Icon, i) => (
                <button
                  key={i}
                  aria-label={["اینستاگرام", "یوتیوب", "ایکس"][i]}
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/70 transition hover:border-gold hover:bg-gold/10 hover:text-gold"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => go(link.view)}
                      className="group flex items-center gap-1 text-sm text-cream/70 transition hover:text-cream"
                    >
                      <ChevronLeft className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact info bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-cream/10 py-6 text-sm text-cream/70 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-5">
            <a
              href="tel:09152286636"
              className="flex items-center gap-1.5 transition hover:text-gold"
              dir="ltr"
            >
              <Phone className="h-4 w-4" />
              09152286636
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              مشهد، بلوار فلاحی، فلاحی ۱، دانشگاه خیام
            </span>
          </div>
        </div>

        {/* Bottom bar — fully centered stack (user request):
            line 1 = maker credit, line 2 = copyright */}
        <div className="flex flex-col items-center justify-center gap-2 border-t border-cream/10 py-6 text-center text-sm text-cream/50">
          <div className="flex items-center gap-1.5">
            ساخته شده با
            <span className="text-sunset" aria-hidden>
              ♥
            </span>
            توسط
            <span className="font-bold text-gold">Charlix</span>
          </div>
          <div>© ۱۴۰۵ کوچ‌نشین — تمام حقوق محفوظ است.</div>
        </div>
      </div>
    </footer>
  );
}
