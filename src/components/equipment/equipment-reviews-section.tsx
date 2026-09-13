"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Star,
  Quote,
  ThumbsUp,
  PenLine,
  User,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEquipmentReviews } from "@/store/equipment-reviews-store";
import { useReviewVotes } from "@/store/review-votes-store";
import { toFa, toPersianShortDate } from "@/lib/format";
import {
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/animations/scroll-reveal";
import { EquipmentReviewsModal } from "@/components/equipment/equipment-reviews-modal";
import { cn } from "@/lib/utils";

interface EquipmentReviewsSectionProps {
  productId: string;
  productTitle: string;
  baseRating: number;
  baseReviewsCount: number;
}

function StarRow({
  rating,
  size = 12,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i < Math.round(rating)
              ? "fill-gold text-gold"
              : "fill-muted text-muted-foreground/30"
          }
        />
      ))}
    </div>
  );
}

function ReviewHelpfulButton({
  reviewId,
  baseCount,
}: {
  reviewId: string;
  baseCount: number;
}) {
  const toggleHelpful = useReviewVotes((s) => s.toggleHelpful);
  const hasVoted = useReviewVotes((s) => s.hasVoted(reviewId));
  const getHelpful = useReviewVotes((s) => s.getHelpful);
  const count = getHelpful(reviewId, baseCount);

  return (
    <button
      onClick={() => toggleHelpful(reviewId)}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
        hasVoted
          ? "bg-emerald/15 text-emerald"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <ThumbsUp className={cn("h-3.5 w-3.5", hasVoted && "fill-current")} />
      مفید بود
      <span className="font-bold">{toFa(count)}</span>
    </button>
  );
}

export function EquipmentReviewsSection({
  productId,
  productTitle,
  baseRating,
  baseReviewsCount,
}: EquipmentReviewsSectionProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const userReviews = useEquipmentReviews((s) => s.reviews);
  const productUserReviews = React.useMemo(
    () => userReviews.filter((r) => r.productId === productId),
    [userReviews, productId]
  );

  const distribution = React.useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    // Add some mock distribution based on baseRating
    const mockCount = baseReviewsCount;
    dist[4] = Math.round(mockCount * (baseRating / 5) * 0.6);
    dist[3] = Math.round(mockCount * 0.25);
    dist[2] = Math.round(mockCount * 0.1);
    dist[1] = Math.round(mockCount * 0.04);
    dist[0] = mockCount - dist[1] - dist[2] - dist[3] - dist[4];

    productUserReviews.forEach((r) => {
      const idx = Math.min(4, Math.max(0, Math.round(r.rating) - 1));
      dist[idx]++;
    });
    return dist.reverse(); // 5 → 1
  }, [productUserReviews, baseRating, baseReviewsCount]);

  const total = baseReviewsCount + productUserReviews.length;

  // Calculate averages for durability + value
  const avgDurability = React.useMemo(() => {
    const reviewed = productUserReviews.filter((r) => r.durability);
    if (reviewed.length === 0) return 0;
    return reviewed.reduce((s, r) => s + (r.durability ?? 0), 0) / reviewed.length;
  }, [productUserReviews]);

  const avgValue = React.useMemo(() => {
    const reviewed = productUserReviews.filter((r) => r.valueForMoney);
    if (reviewed.length === 0) return 0;
    return reviewed.reduce((s, r) => s + (r.valueForMoney ?? 0), 0) / reviewed.length;
  }, [productUserReviews]);

  const recommendRate = React.useMemo(() => {
    if (productUserReviews.length === 0) return 95;
    const recommended = productUserReviews.filter((r) => r.wouldRecommend).length;
    return Math.round((recommended / productUserReviews.length) * 100);
  }, [productUserReviews]);

  // Mock reviews based on rating
  const mockReviews = React.useMemo(() => {
    const reviews: Array<{
      id: string;
      author: string;
      rating: number;
      comment: string;
      date: string;
      wouldRecommend: boolean;
    }> = [];
    const names = ["علی ر.", "سارا ک.", "محمد ج.", "زهرا ا."];
    const comments = [
      "کیفیت ساخت بسیار خوب، بعد از چند بار استفاده همچنان مثل روز اول کار می‌کند.",
      "ارزش خرید داره، قیمتش نسبت به کیفیتش منصفانه است.",
      "سبک و کاربردی، برای سفرهای کوتاه عالیه.",
      "پیشنهاد می‌کنم، مطابق توضیحات بود.",
    ];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (i + 1) * 12);
      reviews.push({
        id: `mock_${productId}_${i}`,
        author: names[i % names.length],
        rating: i === 0 ? 5 : 4,
        comment: comments[i % comments.length],
        date: d.toISOString(),
        wouldRecommend: true,
      });
    }
    return reviews;
  }, [productId]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <ScrollReveal>
        <div className="grid grid-cols-1 gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-l">
            <p className="text-5xl font-extrabold text-gradient-sunset">
              {toFa(baseRating)}
            </p>
            <StarRow rating={baseRating} size={18} />
            <p className="mt-1 text-xs text-muted-foreground">
              از {toFa(total)} نظر
            </p>
          </div>
          <div className="space-y-2">
            {distribution.map((count, i) => {
              const stars = 5 - i;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="flex w-12 items-center gap-1 text-xs font-bold">
                    {toFa(stars)}
                    <Star className="h-3 w-3 fill-gold text-gold" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-l from-gold to-sunset"
                    />
                  </div>
                  <span className="w-8 text-left text-xs text-muted-foreground">
                    {toFa(count)}
                  </span>
                </div>
              );
            })}
            {/* CTA */}
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground max-sm:py-3"
            >
              <PenLine className="h-4 w-4" />
              نظر بده
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Stats row */}
      {(avgDurability > 0 || avgValue > 0 || productUserReviews.length > 0) && (
        <ScrollReveal>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-2xl font-extrabold text-emerald">
                {toFa(avgDurability > 0 ? avgDurability.toFixed(1) : "۴.۵")}
              </p>
              <p className="text-[10px] text-muted-foreground">دوام</p>
            </div>
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-2xl font-extrabold text-gold">
                {toFa(avgValue > 0 ? avgValue.toFixed(1) : "۴.۳")}
              </p>
              <p className="text-[10px] text-muted-foreground">ارزش خرید</p>
            </div>
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-2xl font-extrabold text-primary">
                {toFa(recommendRate)}٪
              </p>
              <p className="text-[10px] text-muted-foreground">پیشنهاد می‌کنند</p>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* User-submitted reviews */}
      {productUserReviews.length > 0 && (
        <StaggerGroup className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald">
            <Sparkles className="h-4 w-4" />
            نظرات شما
          </div>
          {productUserReviews.map((r) => (
            <motion.div
              key={r.id}
              variants={staggerItem}
              className="rounded-2xl border-2 border-emerald/30 bg-emerald/5 p-4 md:p-5"
            >
              <div className="mb-3 flex items-center gap-3 max-sm:flex-wrap">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald/15 text-emerald ring-2 ring-emerald/20">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="flex items-center gap-1.5 font-bold">
                    {r.author}
                    <span className="rounded-full bg-emerald/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald">
                      شما
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRow rating={r.rating} size={12} />
                    <span className="text-[10px] text-muted-foreground">
                      {toPersianShortDate(r.date)}
                    </span>
                  </div>
                </div>
                {r.wouldRecommend && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-1 text-[10px] font-bold text-emerald">
                    <ThumbsUp className="h-3 w-3" />
                    پیشنهاد می‌کنم
                  </span>
                )}
              </div>
              <p className="text-sm leading-7 text-foreground/80">{r.comment}</p>
              {(r.durability || r.valueForMoney) && (
                <div className="mt-3 flex gap-4 border-t pt-3 text-xs">
                  {r.durability && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald" />
                      دوام: {toFa(r.durability)}/۵
                    </span>
                  )}
                  {r.valueForMoney && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      ارزش: {toFa(r.valueForMoney)}/۵
                    </span>
                  )}
                </div>
              )}
              <ReviewHelpfulButton reviewId={r.id} baseCount={Math.floor(r.rating * 2)} />
            </motion.div>
          ))}
        </StaggerGroup>
      )}

      {/* Mock reviews list */}
      <StaggerGroup className="space-y-4">
        {mockReviews.map((r) => (
          <motion.div
            key={r.id}
            variants={staggerItem}
            className="rounded-2xl border bg-card p-4 md:p-5"
          >
            <div className="mb-3 flex items-center gap-3 max-sm:flex-wrap">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold">{r.author}</p>
                <div className="flex items-center gap-2">
                  <StarRow rating={r.rating} size={12} />
                  <span className="text-[10px] text-muted-foreground">
                    {toPersianShortDate(r.date)}
                  </span>
                </div>
              </div>
              <Quote className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm leading-7 text-foreground/80">{r.comment}</p>
            <ReviewHelpfulButton reviewId={r.id} baseCount={Math.floor(r.rating * 3)} />
          </motion.div>
        ))}
      </StaggerGroup>

      <EquipmentReviewsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={productId}
        productTitle={productTitle}
      />
    </div>
  );
}
