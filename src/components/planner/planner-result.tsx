"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Bell, ShoppingBag, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SmartImage } from "@/components/common/smart-image";
import { ItineraryCard } from "./itinerary-card";
import { useGo } from "@/lib/use-go";
import { useCart } from "@/store/cart-store";
import { toFa, formatCurrency, CATEGORY_LABELS } from "@/lib/format";
import type { PlannerResult } from "@/types/planner";
import type { Tour } from "@/types";

/**
 * نتیجه برنامه‌ریز (بخش ۶ سند v19):
 * برنامه پیشنهادی (روزهای itinerary تور برتر) + امتیاز تناسب + اکشن‌ها.
 * Edge cases سند: تور پر → گزینه بعدی + «اطلاع بده»؛ مچ ناقص → ذکر دلایل.
 */
export function PlannerResultView({
  result,
  tours,
  onRestart,
}: {
  result: PlannerResult;
  tours: Tour[];
  onRestart: () => void;
}) {
  const go = useGo();
  const addTour = useCart((s) => s.addTour);
  const [notifyRequested, setNotifyRequested] = React.useState<Set<string>>(new Set());

  const byId = React.useMemo(
    () => new Map(tours.map((t) => [t.id, t])),
    [tours]
  );
  const matches = result.matches
    .map((m) => ({ match: m, tour: byId.get(m.tourId) }))
    .filter((x): x is { match: (typeof result.matches)[number]; tour: Tour } => !!x.tour);

  const top = matches[0];
  const others = matches.slice(1, 4);

  if (!top) {
    return (
      <div className="rounded-3xl border bg-card p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-sunset" aria-hidden />
        <h3 className="mt-3 text-lg font-extrabold">تور مناسبی پیدا نشد</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          گزینه‌هایت را کمی بازتر کن (بودجه یا سبک) و دوباره امتحان کن.
        </p>
        <Button variant="outline" onClick={onRestart} className="mt-4">
          ویرایش انتخاب‌ها
        </Button>
      </div>
    );
  }

  const isTopFull = top.tour.status === "full";
  const showTop = !isTopFull ? top : matches.find((m) => m.tour.status === "active") ?? top;

  const handleAddToCart = (tour: Tour) => {
    addTour({
      refId: tour.id,
      title: tour.title,
      image: tour.images[0],
      unitPrice: tour.discountPrice ?? tour.price,
      quantity: 1,
      meta: { participants: 1, startDate: tour.startDate },
    });
    toast.success("تور به سبد خرید اضافه شد");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      {/* برنامه پیشنهادی */}
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div className="relative">
          <div className="relative h-44 overflow-hidden sm:h-56">
            <SmartImage
              src={showTop.tour.images[0]}
              alt={showTop.tour.title}
              fallback="tour"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-gold text-forest">
                  <Target className="h-3.5 w-3.5" aria-hidden />
                  امتیاز تناسب: {toFa(showTop.match.score)}٪
                </Badge>
                <Badge variant="outline" className="rounded-full border-cream/40 text-cream">
                  {CATEGORY_LABELS[showTop.tour.category]}
                </Badge>
              </div>
              <h2 className="mt-2 text-xl font-black text-cream sm:text-2xl">
                {showTop.tour.title}
              </h2>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="font-extrabold">
                {formatCurrency(showTop.tour.discountPrice ?? showTop.tour.price)}
                <span className="mr-1 text-xs font-normal text-muted-foreground">
                  / هر نفر
                </span>
              </span>
              <span className="text-muted-foreground">
                {toFa(showTop.tour.duration)} روز · لیدر {showTop.tour.leader.fullName}
              </span>
            </div>

            {/* دلایل مچ ناقص */}
            {showTop.match.missReasons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {showTop.match.missReasons.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-sunset/10 px-2.5 py-1 text-[11px] font-bold text-sunset"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}

            {/* برنامه روزها */}
            {showTop.tour.itinerary.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-extrabold">برنامه پیشنهادی</h3>
                <ItineraryCard days={showTop.tour.itinerary.slice(0, 4)} />
              </div>
            )}

            {/* اکشن‌ها */}
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Button
                className="flex-1 gap-2 rounded-2xl bg-emerald text-cream hover:bg-emerald-dark"
                onClick={() => go("tour-detail", { id: showTop.tour.id })}
              >
                مشاهده تور
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-2xl"
                onClick={() => handleAddToCart(showTop.tour)}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                افزودن به سبد
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* اگر تور برتر پر بود */}
      {isTopFull && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-3xl border border-sunset/30 bg-sunset/5 p-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-sunset">
            گزینه برتر شما («{top.tour.title}») فعلاً تکمیل ظرفیت است — بهترین
            گزینه فعال را بالاتر ببینید.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={notifyRequested.has(top.tour.id)}
            onClick={() => {
              setNotifyRequested((s) => new Set(s).add(top.tour.id));
              toast.success("خبرت می‌کنیم وقتی ظرفیت باز شد 🔔");
            }}
            className="shrink-0 gap-1.5"
          >
            <Bell className="h-4 w-4" aria-hidden />
            {notifyRequested.has(top.tour.id) ? "ثبت شد" : "اطلاع بده وقتی ظرفیت باز شد"}
          </Button>
        </div>
      )}

      {/* سایر گزینه‌های نزدیک */}
      {others.length > 0 && (
        <div className="rounded-3xl border bg-card p-5">
          <h3 className="mb-3 text-sm font-extrabold">نزدیک‌ترین گزینه‌های دیگر</h3>
          <div className="space-y-2.5">
            {others.map(({ match, tour }) => (
              <button
                key={tour.id}
                onClick={() => go("tour-detail", { id: tour.id })}
                className="flex w-full items-center gap-3 rounded-2xl border bg-background p-2.5 text-right transition-colors hover:border-emerald/40"
              >
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <SmartImage
                    src={tour.images[0]}
                    alt={tour.title}
                    fallback="tour"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{tour.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {toFa(tour.duration)} روز · {formatCurrency(tour.discountPrice ?? tour.price)}
                    {match.missReasons[0] ? ` · ${match.missReasons[0]}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald/10 px-2.5 py-1 text-xs font-black text-emerald">
                  {toFa(match.score)}٪
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button variant="ghost" onClick={onRestart} className="w-full">
        ویرایش انتخاب‌ها و ساخت برنامه جدید
      </Button>
    </motion.div>
  );
}
