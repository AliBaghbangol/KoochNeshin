"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Send, CheckCircle2, ThumbsUp } from "lucide-react";
import { useEquipmentReviews } from "@/store/equipment-reviews-store";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EquipmentReviewsModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
}

function StarPicker({
  value,
  onChange,
  size = "h-8 w-8",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: string;
}) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((s) => {
        const active = (hover || value) >= s;
        return (
          <motion.button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="grid h-10 w-10 place-items-center max-sm:h-11 max-sm:w-11"
            aria-label={`${toFa(s)} ستاره`}
          >
            <Star
              className={cn(
                size,
                "transition-all",
                active
                  ? "fill-gold text-gold drop-shadow-[0_0_8px_rgba(217,169,78,0.5)]"
                  : "fill-muted text-muted-foreground/40"
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

const REVIEW_LABELS: Record<number, string> = {
  1: "ضعیف",
  2: "متوسط",
  3: "خوب",
  4: "خیلی خوب",
  5: "عالی!",
};

export function EquipmentReviewsModal({
  open,
  onClose,
  productId,
  productTitle,
}: EquipmentReviewsModalProps) {
  const { user, isAuthenticated } = useAuth();
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  const addReview = useEquipmentReviews((s) => s.addReview);
  const hasReviewed = useEquipmentReviews((s) => s.hasReviewed);

  const [rating, setRating] = React.useState(0);
  const [durability, setDurability] = React.useState(0);
  const [valueForMoney, setValueForMoney] = React.useState(0);
  const [wouldRecommend, setWouldRecommend] = React.useState(true);
  const [name, setName] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setRating(0);
      setDurability(0);
      setValueForMoney(0);
      setWouldRecommend(true);
      setComment("");
      setSubmitted(false);
      setName(user?.fullName ?? "");
    }
  }, [open, user]);

  const alreadyReviewed =
    isAuthenticated && user
      ? hasReviewed(productId, user.fullName)
      : false;

  const submit = () => {
    if (rating === 0) {
      toast.error("لطفاً امتیاز کلی بدهید");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("نظر شما باید حداقل ۱۰ کاراکتر باشد");
      return;
    }
    const authorName = name.trim() || user?.fullName || "مسافر کوچ‌نشین";
    addReview({
      productId,
      author: authorName,
      rating,
      comment: comment.trim(),
      durability: durability || undefined,
      valueForMoney: valueForMoney || undefined,
      wouldRecommend,
    });
    setSubmitted(true);
    toast.success("نظر شما ثبت شد!", {
      description: "ممنون از اشتراک‌گذاری تجربه‌ت.",
    });
    setTimeout(() => onClose(), 1800);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[88] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-forest/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 relative overflow-hidden bg-gradient-to-br from-sunset to-sunset-dark p-6 text-cream">
              <div className="absolute inset-0 bg-noise opacity-10" />
              <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
              <button
                onClick={onClose}
                className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 max-sm:h-11 max-sm:w-11"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative">
                <div className="mb-1 flex items-center gap-2 text-sm text-cream/70">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  ثبت نظر تجهیز
                </div>
                <h3 className="text-xl font-extrabold">{productTitle}</h3>
                <p className="mt-1 text-sm text-cream/70">
                  کیفیت و کارایی این محصول را ارزیابی کن
                </p>
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="grid h-20 w-20 place-items-center rounded-full bg-emerald/15 text-emerald"
                    >
                      <CheckCircle2 className="h-10 w-10" />
                    </motion.div>
                    <div>
                      <p className="text-lg font-extrabold">
                        نظر شما با موفقیت ثبت شد!
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        ممنون از اشتراک‌گذاری تجربه‌ت.
                      </p>
                    </div>
                  </motion.div>
                ) : alreadyReviewed ? (
                  <motion.div
                    key="already"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-8 text-center"
                  >
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-gold/15 text-gold">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <p className="font-bold">شما قبلاً نظر داده‌اید</p>
                    <p className="text-sm text-muted-foreground">
                      برای این محصول یک نظر ثبت کرده‌اید.
                    </p>
                  </motion.div>
                ) : !isAuthenticated ? (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 py-6 text-center"
                  >
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                      <Star className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold">برای ثبت نظر وارد شوید</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        برای اشتراک‌گذاری تجربه‌ت باید وارد حساب کاربری‌ت بشی.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        setAuthOpen(true);
                      }}
                      className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
                    >
                      ورود / ثبت‌نام
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Overall rating */}
                    <div className="text-center">
                      <p className="mb-2 text-sm font-semibold">
                        امتیاز کلی
                      </p>
                      <div className="flex justify-center">
                        <StarPicker value={rating} onChange={setRating} />
                      </div>
                      <AnimatePresence>
                        {rating > 0 && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-2 text-sm font-bold text-gold"
                          >
                            {REVIEW_LABELS[rating]}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Detailed ratings */}
                    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                      <div>
                        <p className="mb-1.5 text-xs font-bold text-muted-foreground">
                          دوام و کیفیت
                        </p>
                        <div className="flex justify-center">
                          <StarPicker
                            value={durability}
                            onChange={setDurability}
                            size="h-5 w-5"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-bold text-muted-foreground">
                          ارزش خرید
                        </p>
                        <div className="flex justify-center">
                          <StarPicker
                            value={valueForMoney}
                            onChange={setValueForMoney}
                            size="h-5 w-5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Would recommend */}
                    <div className="flex items-center justify-between rounded-xl border bg-secondary/30 p-3">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <ThumbsUp className="h-4 w-4 text-emerald" />
                        این محصول را به دیگران پیشنهاد می‌کنی؟
                      </span>
                      <button
                        onClick={() => setWouldRecommend((v) => !v)}
                        className={cn(
                          "relative h-6 w-11 rounded-full transition max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']",
                          wouldRecommend ? "bg-emerald" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                            wouldRecommend ? "left-0.5" : "right-0.5"
                          )}
                        />
                      </button>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold">
                        نام شما
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="نام و نام خانوادگی"
                        className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold">
                        نظر شما
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="کیفیت، کارایی و تجربه‌ات از این محصول را بنویس..."
                        rows={4}
                        className="w-full rounded-xl border bg-background p-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="mt-1 text-left text-xs text-muted-foreground">
                        {toFa(comment.length)} کاراکتر
                      </p>
                    </div>

                    <button
                      onClick={submit}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-emerald-dark"
                    >
                      <Send className="h-4 w-4" />
                      ثبت نظر
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
