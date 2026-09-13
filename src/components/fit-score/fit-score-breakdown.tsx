"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Dna, Info, Coins, Mountain, CloudSun, UserRound, Heart, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton as ShadSkeleton } from "@/components/ui/skeleton";
import { toFa } from "@/lib/format";
import { useTourFitScore } from "@/data/use-tour-fit-score";
import { explainFitScore } from "@/lib/fit-score/explain-fit-score";
import { flagOn } from "@/lib/feature-flags";
import { track as trackEvent } from "@/lib/analytics/track";
import { useDnaOnboarding } from "@/store/dna-onboarding-store";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { TravelDnaTest } from "@/components/dna/travel-dna-test";
import type { Tour } from "@/types";

/**
 * نسخه کامل Fit Score در صفحه تور (بخش ۴ سند v19):
 * پنج ردیف breakdown + قانون طلایی «بر اساس ترجیحات فعلی شما».
 * Empty state: بدون DNA → CTA کوچک به کوییز (مخفی‌کردن کامل ممنوع).
 * Error state: fallback محلی (compute کلاینت است؛ خطا = امتیاز عمومی) + دکمه تلاش دوباره.
 */

const ROWS: {
  key: "budget" | "difficulty" | "weather" | "leader" | "preference";
  icon: typeof Coins;
  label: string;
  bar: string;
}[] = [
  { key: "budget", icon: Coins, label: "بودجه", bar: "bg-gold" },
  { key: "difficulty", icon: Mountain, label: "سختی", bar: "bg-sunset" },
  { key: "weather", icon: CloudSun, label: "هوا", bar: "bg-emerald-light" },
  { key: "leader", icon: UserRound, label: "لیدر", bar: "bg-emerald" },
  { key: "preference", icon: Heart, label: "علایق", bar: "bg-accent" },
];

export function FitScoreBreakdown({ tour }: { tour: Tour }) {
  const { score, breakdown, hasDNA, isLoading } = useTourFitScore(tour, {
    latency: 350,
  });
  const setReturnTourId = useDnaOnboarding((s) => s.setReturnTourId);
  const user = useAuth((s) => s.user);
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  const [quizOpen, setQuizOpen] = React.useState(false);

  /** §auth — DNA is personal data: guests must sign in first. */
  function openQuiz() {
    if (!user) {
      trackEvent("dna_quiz_blocked", { tourId: tour.id, reason: "guest" });
      toast.info("اول وارد حساب شو", {
        description: "برای ساخت Travel DNA باید وارد حساب کاربری‌ات شوی.",
      });
      setAuthOpen(true);
      return;
    }
    setReturnTourId(tour.id);
    trackEvent("dna_quiz_started", { tourId: tour.id, source: "fit-score-cta" });
    setQuizOpen(true);
  }

  // §9 — fire a `fit_score_viewed` event once the breakdown actually renders.
  React.useEffect(() => {
    if (!isLoading && hasDNA && breakdown && score !== null) {
      trackEvent("fit_score_viewed", { tourId: tour.id, score });
    }
  }, [isLoading, hasDNA, breakdown, score, tour.id]);

  // The inline quiz dialog must live OUTSIDE the loading/empty/full
  // branches: saving the DNA flips `hasDNA` and re-renders this component
  // into the score card — if the dialog were inside the empty branch it
  // would unmount the moment the quiz finishes, hiding the result + the
  // «بازگشت به تور و مقایسه» CTA before the user sees it.
  const quizDialog = (
    <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-lg overflow-x-hidden overflow-y-auto sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>کوییز DNA سفر</DialogTitle>
          <DialogDescription>۶ سوال کوتاه برای ساخت Travel DNA شما</DialogDescription>
        </DialogHeader>
        <TravelDnaTest
          userId={user?.id ?? "guest"}
          onDismiss={() => setQuizOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <>
        <div className="rounded-3xl border bg-card p-5">
          <ShadSkeleton className="h-5 w-40" />
          <div className="mt-4 space-y-3">
            {ROWS.map((r) => (
              <ShadSkeleton key={r.key} className="h-6 w-full" />
            ))}
          </div>
        </div>
        {quizDialog}
      </>
    );
  }

  // حالت خالی: کاربر DNA ندارد → CTA، نه مخفی‌کردن
  if (!hasDNA || !breakdown || score === null) {
    return (
      <>
        <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-emerald/30 bg-emerald/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald/10 text-emerald">
              <Dna className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-extrabold">
                این تور چقدر به تو می‌آید؟
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                برای دیدن میزان تناسب این تور با تو، Travel DNA بساز — فقط ۶ سوال، همین‌جا.
              </p>
            </div>
          </div>
          {/* CTA — auth-gated (user request): guests get the login modal,
              signed-in users get the quiz INLINE on the tour page. Remembers
              WHICH tour we're on so the result can offer «بازگشت به همان تور
              و مقایسه» (user request #9). */}
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={openQuiz}
          >
            {user ? (
              <Dna className="h-4 w-4" aria-hidden />
            ) : (
              <Lock className="h-4 w-4" aria-hidden />
            )}
            {user ? "ساخت Travel DNA" : "ورود و ساخت Travel DNA"}
          </Button>
        </div>
        {quizDialog}
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border bg-card p-5"
      aria-label="امتیاز تناسب این تور با شما"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="relative grid h-12 w-12 place-items-center">
            <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                strokeWidth="5"
                className="stroke-muted"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                className="stroke-gold"
                strokeDasharray={125.7}
                initial={{ strokeDashoffset: 125.7 }}
                animate={{ strokeDashoffset: 125.7 * (1 - score / 100) }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            <span className="text-sm font-black">{toFa(score)}٪</span>
          </span>
          <div>
            <h3 className="text-base font-extrabold">تناسب این تور با تو</h3>
            <p className="text-[11px] text-muted-foreground">
              بر اساس ترجیحات فعلی شما
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {ROWS.map((r, i) => {
          const v = breakdown[r.key];
          return (
            <div key={r.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold">
                  <r.icon className="h-3.5 w-3.5" aria-hidden /> {r.label}
                </span>
                <span className="font-extrabold text-foreground/80">
                  {toFa(v)}٪
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`h-full rounded-full ${r.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${v}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-5 text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        این امتیاز قطعی نیست و صرفاً بر اساس ترجیحات فعلی شما (Travel DNA)
        تخمین زده شده است.
      </p>

      {flagOn("fitScoreExplainability") && breakdown && score !== null && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-3 rounded-2xl bg-gold/10 px-3 py-2 text-[12px] font-semibold leading-5 text-foreground/90"
          role="note"
        >
          <Sparkles aria-hidden className="ml-1 inline-block h-3.5 w-3.5 text-gold" />
          {explainFitScore({ tourId: tour.id, score, breakdown })}
        </motion.p>
      )}
      </motion.div>
      {quizDialog}
    </>
  );
}
