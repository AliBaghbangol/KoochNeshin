"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import type { Tour } from "@/types";
import {
  toFa,
  formatCurrency,
  DIFFICULTY_LABELS,
  CATEGORY_LABELS,
} from "@/lib/format";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/animations/scroll-reveal";

export function TourFAQ({ tour }: { tour: Tour }) {
  const faqs = React.useMemo(
    () => [
      {
        q: "این تور برای چه سطحی از تجربه مناسب است؟",
        a: `این تور با سطح سختی «${DIFFICULTY_LABELS[tour.difficulty]}» در دسته «${CATEGORY_LABELS[tour.category]}» طراحی شده است. ${
          tour.difficulty === "easy"
            ? "برای مبتدی‌ها و خانواده‌ها کاملاً مناسب است و نیاز به تجربه قبلی ندارد."
            : tour.difficulty === "medium"
            ? "برای شرکت‌کنندگانی با تجربه متوسط توصیه می‌شود. آمادگی جسمانی متوسط لازم است."
            : "برای افراد با تجربه و آمادگی جسمانی بالا طراحی شده است. تجهیزات تخصصی ضروری است."
        }`,
      },
      {
        q: "هزینه شامل چه مواردی است؟",
        a: `قیمت ${formatCurrency(tour.discountPrice ?? tour.price)} شامل ${
          tour.facilities.length > 0
            ? tour.facilities.slice(0, 3).join("، ")
            : "راهنمای تور، بیمه مسافر"
        } است. هزینه حمل‌ونقل از مبدا، اقامت و وعده‌های غذایی طبق برنامه روزانه در قیمت گنجانده شده است.`,
      },
      {
        q: "سیاست لغو و بازگشت وجه چگونه است؟",
        a: "لغو تا ۷ روز قبل از شروع تور: بازگشت ۱۰۰٪ وجه. لغو ۳ تا ۷ روز قبل: بازگشت ۵۰٪. لغو کمتر از ۳ روز: بدون بازگشت وجه. در شرایط جوی نامساعد، تور ممکن است با هماهنگی مسافران به تعویق بیفتد.",
      },
      {
        q: "تجهیزات شخصی چه چیزی باید همراه داشته باشم؟",
        a: `بر اساس دسته‌بندی «${CATEGORY_LABELS[tour.category]}»، تجهیزات ضروری شامل کفش مناسب، لباس لایه‌ای، کیسه خواب، و بطری آب است. لیست کامل تجهیزات پس از ثبت‌نام برای شما ارسال می‌شود. امکان اجاره تجهیزات از فروشگاه کوچ‌نشین نیز وجود دارد.`,
      },
      {
        q: "چگونه می‌توانم رزرو کنم؟",
        a: `برای رزرو این تور، تعداد نفرات و تاریخ مورد نظر را انتخاب کرده و دکمه «افزودن به سبد» را بزنید. پس از تکمیل فرآیند پرداخت، بلیت تور در داشبورد شما قابل مشاهده خواهد بود. ظرفیت باقی‌مانده: ${toFa(tour.capacity - tour.reservedCount)} نفر از ${toFa(tour.capacity)} نفر.`,
      },
      {
        q: "آیا امکان تغییر تاریخ رزرو وجود دارد؟",
        a: "بله، تا ۵ روز قبل از شروع تور می‌توانید تاریخ رزرو خود را به تاریخ دیگری از همان تور تغییر دهید (در صورت وجود ظرفیت). این تغییر رایگان است.",
      },
    ],
    [tour]
  );

  return (
    <section className="mt-12">
      <ScrollReveal>
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/10 text-gold">
            <HelpCircle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-extrabold md:text-2xl">
              سوالات متداول
            </h3>
            <p className="text-xs text-muted-foreground">
              پاسخ به پرسش‌های رایج درباره این تور
            </p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="space-y-3"
        >
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="overflow-hidden rounded-2xl border bg-card px-4 data-[state=open]:border-primary/40 data-[state=open]:shadow-sm"
            >
              <AccordionTrigger className="py-4 text-right text-sm font-bold hover:no-underline md:text-base">
                <span className="flex flex-1 items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                    {toFa(i + 1)}
                  </span>
                  {faq.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pr-8 text-sm leading-7 text-foreground/80">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>

      {/* Still have questions CTA */}
      <ScrollReveal delay={0.2}>
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">سوال دیگری داری؟</p>
              <p className="text-sm text-muted-foreground">
                تیم پشتیبانی ما ۲۴ ساعته آماده پاسخگویی است.
              </p>
            </div>
          </div>
          <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-emerald-dark">
            تماس با پشتیبانی
          </button>
        </div>
      </ScrollReveal>
    </section>
  );
}
