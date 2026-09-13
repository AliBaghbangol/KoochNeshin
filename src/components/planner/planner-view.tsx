"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanner } from "@/store/planner-store";
import { usePlannerResult } from "@/data/use-planner";
import { useTravelDNA } from "@/data/use-travel-dna";
import { useAuth } from "@/store/auth-store";
import { useXP } from "@/store/xp-store";
import { notifyPlannerTopMatch } from "@/lib/notifications/triggers";
import { PlannerStepper } from "./planner-stepper";
import { PlannerStepBudget } from "./planner-step-budget";
import { PlannerStepDuration } from "./planner-step-duration";
import { PlannerStepStyle } from "./planner-step-style";
import { PlannerStepDifficulty } from "./planner-step-difficulty";
import { PlannerStepDate } from "./planner-step-date";
import { PlannerStepSocial } from "./planner-step-social";
import { PlannerResultView } from "./planner-result";
import { useAllTours } from "@/hooks/use-all-tours";
import type { TripPlannerInput } from "@/types/planner";
import type { Tour } from "@/types";

const STEP_LABELS = ["بودجه", "مدت", "سبک", "سختی", "زمان", "همراهان"];
const RESULT_STEP = STEP_LABELS.length; // 6

/**
 * نمای برنامه‌ریز هوشمند سفر (بخش ۶ سند v19):
 * فرم چندمرحله‌ای + موتور رتبه‌بندی rule-based + نتیجه با itinerary واقعی تور.
 * اگر Travel DNA موجود باشد، مراحل سختی/همراهان/کمپ از آن پیش‌پر می‌شود.
 */
export function PlannerView() {
  const store = usePlanner();
  const user = useAuth((s) => s.user);
  const { data: dna } = useTravelDNA(user?.id);
  const tours = useAllTours();
  const addXp = useXP((s) => s.addEvent);
  const events = useXP((s) => s.events);
  const prefillDone = React.useRef(false);

  const [input, setInput] = React.useState<TripPlannerInput | null>(null);
  const resultQuery = usePlannerResult(input, store.hasResult);

  // پیش‌پرکردن از DNA — فقط یک‌بار، اگر کاربر هنوز چیزی انتخاب نکرده باشد
  React.useEffect(() => {
    if (prefillDone.current || !dna) return;
    prefillDone.current = true;
    const s = usePlanner.getState();
    if (s.step === 0 && !s.hasResult) {
      s.setDifficulty(
        dna.scores.adventurer >= 70 ? "hard" : dna.scores.adventurer >= 40 ? "medium" : "easy"
      );
      s.setSocialMode(
        dna.scores.social >= 70 ? "group" : dna.scores.social >= 40 ? "friends" : "solo"
      );
      if (dna.answers.campingVsHotel >= 4) s.setCamping(true);
    }
  }, [dna]);

  const step = store.step;
  const atResult = store.hasResult && step === RESULT_STEP;

  const goNext = () => store.setStep(Math.min(RESULT_STEP - 1, step + 1));
  const goPrev = () => store.setStep(Math.max(0, step - 1));

  const generate = React.useCallback(() => {
    const built = usePlanner.getState().buildInput();
    setInput(built);
    store.markResult(true);
    store.setStep(RESULT_STEP);
    // XP فقط بار اول (idempotent)
    if (!events.some((e) => e.type === "planner:first-use")) {
      addXp("planner:first-use");
    }
  }, [store, events, addXp]);

  // نوتیف بهترین مچ — فقط وقتی نتیجه واقعا آمد و اولین بار است
  const notifiedRef = React.useRef(false);
  React.useEffect(() => {
    if (!resultQuery.data || notifiedRef.current) return;
    notifiedRef.current = true;
    const top = resultQuery.data.matches[0];
    const tour = tours.find((t) => t.id === top?.tourId);
    if (tour) notifyPlannerTopMatch(tour.title, top.score);
  }, [resultQuery.data, tours]);

  const restart = () => {
    store.markResult(false);
    store.setStep(0);
    setInput(null);
    notifiedRef.current = false;
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-24 md:pt-28">
      {/* پس‌زمینه تزئینی */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald/10 to-transparent" />

      <div className="relative mx-auto max-w-3xl px-4 md:px-6">
        {/* هدر */}
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald text-cream shadow-lg shadow-emerald/20">
            <Wand2 className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-black md:text-3xl">برنامه‌ریز هوشمند سفر</h1>
            <p className="text-xs text-muted-foreground">
              ۶ انتخاب ساده → بهترین تور و برنامه روزبه‌روز، از بین همه تورهای واقعی کوچ‌نشین
            </p>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
          <PlannerStepper current={atResult ? RESULT_STEP : step} labels={STEP_LABELS} />

          <div className="mt-6 min-h-[300px]">
            <AnimatePresence mode="wait">
              {atResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {resultQuery.isPending ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                      <Loader2 className="h-10 w-10 animate-spin text-emerald" aria-hidden />
                      <p className="text-sm font-bold">داریم برنامه سفرت را می‌چینیم…</p>
                      <div className="w-full max-w-md space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ) : resultQuery.isError ? (
                    <div className="py-14 text-center">
                      <p className="text-sm font-bold text-destructive">
                        خطا در ساخت برنامه — دوباره تلاش کن.
                      </p>
                      <Button variant="outline" className="mt-3" onClick={() => resultQuery.refetch()}>
                        تلاش دوباره
                      </Button>
                    </div>
                  ) : resultQuery.data ? (
                    <PlannerResultView
                      result={resultQuery.data}
                      tours={tours as Tour[]}
                      onRestart={restart}
                    />
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 28 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  {step === 0 && <PlannerStepBudget />}
                  {step === 1 && <PlannerStepDuration />}
                  {step === 2 && <PlannerStepStyle />}
                  {step === 3 && <PlannerStepDifficulty />}
                  {step === 4 && <PlannerStepDate />}
                  {step === 5 && <PlannerStepSocial />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ناوبری مراحل */}
          {!atResult && (
            <div className="mt-6 flex items-center justify-between gap-2 border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                disabled={step === 0}
                onClick={goPrev}
                className="gap-1 text-xs"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
                قبلی
              </Button>

              {step < RESULT_STEP - 1 ? (
                <div className="flex items-center gap-2">
                  {/* مراحل اجباری: بودجه و مدت — بدون رد شدن */}
                  {step !== 0 && step !== 1 && (
                    <Button variant="ghost" size="sm" onClick={goNext} className="text-xs text-muted-foreground">
                      رد کردن
                    </Button>
                  )}
                  <Button onClick={goNext} className="gap-1.5 rounded-2xl">
                    بعدی
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={generate}
                  className="gap-2 rounded-2xl bg-gradient-to-l from-gold to-sunset text-forest hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  ساخت برنامه سفر
                </Button>
              )}
            </div>
          )}
        </div>

        {/* نکته لینک برگشت */}
        {atResult && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <ArrowLeft className="h-3 w-3" aria-hidden />
            برنامه بر اساس تورهای واقعی موجود ساخته شده — با تغییر انتخاب‌ها می‌توانی دوباره بسازی.
          </p>
        )}
      </div>
    </div>
  );
}
