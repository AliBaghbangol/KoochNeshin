"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Send, CheckCircle2 } from "lucide-react";
import { useReviews } from "@/store/reviews-store";
import { useXP } from "@/store/xp-store";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { toFa, toPersianDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewsModalProps {
  open: boolean;
  onClose: () => void;
  tourId: string;
  tourTitle: string;
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex gap-1.5" dir="ltr">
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
            className="grid h-10 w-10 place-items-center"
            aria-label={`${toFa(s)} ستاره`}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-all",
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

export function ReviewsModal({
  open,
  onClose,
  tourId,
  tourTitle,
}: ReviewsModalProps) {
  const { user, isAuthenticated } = useAuth();
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  const addReview = useReviews((s) => s.addReview);
  const hasReviewed = useReviews((s) => s.hasReviewed);

  const [rating, setRating] = React.useState(0);
  const [name, setName] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setRating(0);
      setComment("");
      setSubmitted(false);
      setName(user?.fullName ?? "");
    }
  }, [open, user]);

  const alreadyReviewed =
    isAuthenticated && user
      ? hasReviewed(tourId, user.fullName)
      : false;

  const submit = () => {
    if (rating === 0) {
      toast.error("لطفاً امتیاز بدهید");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("نظر شما باید حداقل ۱۰ کاراکتر باشد");
      return;
    }
    const authorName = name.trim() || user?.fullName || "مسافر کوچ‌نشین";
    addReview({
      tourId,
      author: authorName,
      rating,
      comment: comment.trim(),
    });
    // XP (v19 بخش ۸): ثبت نظر = رویداد واقعی
    useXP.getState().addEvent("review:created", { tourId });
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
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border bg-background shadow-2xl max-sm:max-h-[92svh] max-sm:overflow-y-auto"
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald to-forest p-6 text-cream">
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
                  ثبت نظر
                </div>
                <h3 className="text-xl font-extrabold">{tourTitle}</h3>
                <p className="mt-1 text-sm text-cream/70">
                  تجربه‌ت از این تور را با دیگران به اشتراک بگذار
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
                      برای این تور یک نظر ثبت کرده‌اید.
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
                    {/* Rating */}
                    <div className="text-center">
                      <p className="mb-2 text-sm font-semibold">
                        امتیاز شما
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
                        placeholder="تجربه‌ت از این تور را بنویس..."
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

export { toPersianDate };
