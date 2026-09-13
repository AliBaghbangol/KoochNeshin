"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Dna,
  Sparkles,
  X,
  Flower2,
  Footprints,
  Backpack,
  Mountain,
  Flag,
  Hotel,
  TentTree,
  BedDouble,
  Tent,
  MoonStar,
  User,
  UserPlus,
  UsersRound,
  Users,
  PartyPopper,
  TreePine,
  Sunset,
  Scale,
  Landmark,
  ScrollText,
  Moon,
  AlarmClockOff,
  Coffee,
  Sunrise,
  Bird,
  Feather,
  Wallet,
  Calculator,
  PiggyBank,
  Check,
  GitCompare,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toFa, formatCurrency } from "@/lib/format";
import { computeTravelDNA } from "@/lib/dna/compute-dna";
import { useDnaOnboarding } from "@/store/dna-onboarding-store";
import { useSaveTravelDNA } from "@/data/use-travel-dna";
import { useXP } from "@/store/xp-store";
import { useCompare } from "@/store/compare-store";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { track } from "@/lib/analytics/track";
import { toast } from "sonner";
import { notifyDNACompleted } from "@/lib/notifications/triggers";
import type { TravelDNAAnswers } from "@/types/dna";
import type { TravelDNA } from "@/types/dna";
import { TravelDnaCard } from "./travel-dna-card";
import { tours } from "@/mocks/tours";

/**
 * کوییز ۶ سوالاتی Travel DNA (بخش ۳ سند v19).
 * نسخه v25: ایموجی‌های زشت حذف شدند — هر گزینه یک آیکون برداری با
 * کاشی گرادیانی و انیمیشن انتخاب (spring pop + چک‌مارک) دارد؛ هر سوال
 * رنگ‌تم خودش را دارد. بعد از اتمام، اگر کاربر از صفحه یک تور آمده باشد
 * دکمه طلایی «بازگشت به همان تور و مقایسه» دیده می‌شود.
 */

interface QuizOption {
  icon: LucideIcon;
  label: string;
  value: number;
}

interface QuizQuestion {
  key: keyof TravelDNAAnswers;
  title: string;
  hint: string;
  /** per-question accent (tile gradient + selected ring + progress tint) */
  accent: {
    tile: string; // idle tile bg
    tileSelected: string; // selected tile bg (gradient)
    ring: string; // selected border color
    text: string;
  };
  options: QuizOption[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    key: "adventure",
    title: "چقدر ماجراجویی دوست داری؟",
    hint: "از پیاده‌روی آرام تا صعود قله",
    accent: {
      tile: "bg-emerald/10 text-emerald",
      tileSelected: "bg-gradient-to-br from-emerald to-emerald-dark text-white",
      ring: "border-emerald shadow-[0_0_0_3px_rgba(16,133,90,0.18)]",
      text: "text-emerald",
    },
    options: [
      { icon: Flower2, label: "آرام و بی‌دغدغه", value: 1 },
      { icon: Footprints, label: "پیاده‌روی سبک", value: 2 },
      { icon: Backpack, label: "کمی چالش", value: 3 },
      { icon: Mountain, label: "خیلی چالشی", value: 4 },
      { icon: Flag, label: "تا قله!", value: 5 },
    ],
  },
  {
    key: "campingVsHotel",
    title: "کمپ یا هتل؟",
    hint: "شب را کجا بخوابی؟",
    accent: {
      tile: "bg-gold/15 text-gold",
      tileSelected: "bg-gradient-to-br from-gold to-gold-light text-forest",
      ring: "border-gold shadow-[0_0_0_3px_rgba(212,175,55,0.22)]",
      text: "text-gold",
    },
    options: [
      { icon: Hotel, label: "فقط هتل", value: 1 },
      { icon: TentTree, label: "اقامتگاه بوم‌گردی", value: 2 },
      { icon: BedDouble, label: "فرقی نمی‌کند", value: 3 },
      { icon: Tent, label: "چادر بهتر است", value: 4 },
      { icon: MoonStar, label: "زیر آسمان باز", value: 5 },
    ],
  },
  {
    key: "soloVsGroup",
    title: "تنها یا گروهی؟",
    hint: "سفر با چه حال‌وهوایی برایت بهتر است؟",
    accent: {
      tile: "bg-sunset/10 text-sunset",
      tileSelected: "bg-gradient-to-br from-sunset to-accent text-white",
      ring: "border-sunset shadow-[0_0_0_3px_rgba(232,98,44,0.18)]",
      text: "text-sunset",
    },
    options: [
      { icon: User, label: "کاملاً تنها", value: 1 },
      { icon: UserPlus, label: "با یک همراه", value: 2 },
      { icon: UsersRound, label: "دو سه نفره", value: 3 },
      { icon: Users, label: "خانوادگی/دوستانه", value: 4 },
      { icon: PartyPopper, label: "گروه بزرگ کاروان", value: 5 },
    ],
  },
  {
    key: "viewVsHistory",
    title: "منظره یا تاریخ؟",
    hint: "کدام برایت ارزشمندتر است؟",
    accent: {
      tile: "bg-emerald-light/15 text-emerald-light",
      tileSelected: "bg-gradient-to-br from-emerald-light to-emerald text-white",
      ring: "border-emerald-light shadow-[0_0_0_3px_rgba(52,168,120,0.18)]",
      text: "text-emerald-light",
    },
    options: [
      { icon: TreePine, label: "فقط طبیعت", value: 1 },
      { icon: Sunset, label: "عمدتاً منظره", value: 2 },
      { icon: Scale, label: "۵۰-۵۰", value: 3 },
      { icon: Landmark, label: "عمدتاً تاریخی", value: 4 },
      { icon: ScrollText, label: "فقط تاریخ و فرهنگ", value: 5 },
    ],
  },
  {
    key: "earlyMorning",
    title: "صبح‌ها چطورید؟",
    hint: "ساعت شروع روز در سفر",
    accent: {
      tile: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
      tileSelected: "bg-gradient-to-br from-cyan-400 to-emerald-500 text-white",
      ring: "border-cyan-500 shadow-[0_0_0_3px_rgba(14,165,164,0.18)]",
      text: "text-cyan-600",
    },
    options: [
      { icon: Moon, label: "تا بعدازظهر", value: 1 },
      { icon: AlarmClockOff, label: "دیر بیدار می‌شوم", value: 2 },
      { icon: Coffee, label: "معمولی", value: 3 },
      { icon: Sunrise, label: "سحرخیز", value: 4 },
      { icon: Bird, label: "قبل از طلوع!", value: 5 },
    ],
  },
  {
    key: "budgetSensitivity",
    title: "چقدر به بودجه حساسی؟",
    hint: "ترازوی هزینه در تصمیم‌هایت",
    accent: {
      tile: "bg-accent/10 text-accent",
      tileSelected: "bg-gradient-to-br from-accent to-sunset text-white",
      ring: "border-accent shadow-[0_0_0_3px_rgba(232,98,44,0.15)]",
      text: "text-accent",
    },
    options: [
      { icon: Feather, label: "اصلاً حساب نمی‌کنم", value: 1 },
      { icon: Wallet, label: "زیاد سخت نمی‌گیرم", value: 2 },
      { icon: Scale, label: "متعادل", value: 3 },
      { icon: Calculator, label: "حساب‌کتاب می‌کنم", value: 4 },
      { icon: PiggyBank, label: "اقتصادی‌ترین!", value: 5 },
    ],
  },
];

export function TravelDnaTest({
  userId,
  onComplete,
  onDismiss,
  className,
}: {
  userId: string;
  onComplete?: (dna: TravelDNA) => void;
  onDismiss?: () => void;
  className?: string;
}) {
  const { step, draft, returnTourId, setStep, setAnswer, setReturnTourId } =
    useDnaOnboarding();
  const saveDNA = useSaveTravelDNA(userId);
  const addXp = useXP((s) => s.addEvent);
  const [result, setResult] = React.useState<TravelDNA | null>(null);
  const [justSaved, setJustSaved] = React.useState(false);

  const go = useGo();
  const toggleCompare = useCompare((s) => s.toggle);
  const setCompareOpen = useNav((s) => s.setCompareOpen);

  const returnTour = React.useMemo(
    () => tours.find((t) => t.id === returnTourId) ?? null,
    [returnTourId]
  );

  const finish = React.useCallback(() => {
    const dna = computeTravelDNA(userId, draft);
    saveDNA(dna);
    setResult(dna);
    setStep(QUESTIONS.length);
    addXp("dna:completed");
    notifyDNACompleted();
    setJustSaved(true);
    onComplete?.(dna);
  }, [draft, saveDNA, userId, setStep, addXp, onComplete]);

  /** user request: «یک گزینه باشه که مارو صاف ببره توی همون توری که بودیم
   *  و مقایسه بکنه» — jump back to the tour AND stage it in the compare
   *  drawer in one click. */
  function backToTourAndCompare() {
    if (!returnTour) return;
    track("dna_return_to_tour", { tourId: returnTour.id });
    toggleCompare(returnTour.id);
    setCompareOpen(true);
    go("tour-detail", { id: returnTour.id });
    toast.success("آماده مقایسه!", {
      description: `«${returnTour.title}» به مقایسه اضافه شد — امتیاز تازه خودت را ببین.`,
    });
    setReturnTourId(null);
  }

  // مرحله نتیجه
  if (result) {
    return (
      <div className={className}>
        <TravelDnaCard
          dna={result}
          onRebuild={() => {
            setResult(null);
            setStep(0);
          }}
        />

        {justSaved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="mt-3 rounded-2xl border border-gold/30 bg-gold/10 p-3 text-center text-[12px] font-semibold leading-5 text-foreground/90"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-gold" aria-hidden />
              DNA ذخیره شد — از این به بعد امتیاز تناسب هر تور را می‌بینی.
            </span>
          </motion.div>
        )}

        {returnTour && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 220, damping: 20 }}
            className="mt-3 overflow-hidden rounded-2xl border-2 border-gold/40 bg-card shadow-lg shadow-gold/10"
          >
            <div className="flex items-center gap-3 border-b border-gold/20 bg-gold/10 p-3">
              {/* thumb */}
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-gold/40">
                <img
                  src={returnTour.images[0]}
                  alt={returnTour.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-[10px] font-bold text-gold">همان توری که بودی</p>
                <p className="truncate text-sm font-extrabold">{returnTour.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {toFa(returnTour.duration)} روز •{" "}
                  {formatCurrency(returnTour.discountPrice ?? returnTour.price)}
                </p>
              </div>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]">
              <Button
                onClick={backToTourAndCompare}
                className="gap-2 rounded-xl bg-gradient-to-l from-gold to-gold-light font-extrabold text-forest shadow-md shadow-gold/25 transition hover:brightness-105"
              >
                <GitCompare className="h-4 w-4" aria-hidden />
                برو به «{returnTour.destination}» و همین تور را مقایسه کن
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setReturnTourId(null);
                  go("tour-detail", { id: returnTour.id });
                }}
                className="gap-1.5 rounded-xl"
              >
                <Wand2 className="h-4 w-4" aria-hidden />
                فقط بازگشت به تور
              </Button>
            </div>
          </motion.div>
        )}

        <Button className="mt-4 w-full" onClick={onDismiss}>
          <Sparkles className="h-4 w-4" aria-hidden />
          عالیه، ادامه بده
        </Button>
      </div>
    );
  }

  const q = QUESTIONS[step];
  const progress = Math.round((step / QUESTIONS.length) * 100);

  return (
    <div
      className={`relative overflow-x-hidden overflow-y-hidden rounded-3xl border bg-card p-4 shadow-sm sm:p-6 ${className ?? ""}`}
      role="dialog"
      aria-label="کوییز DNA سفر"
    >
      {/* decorative DNA glow that follows the accent of the current question.
          Wrapped in an inset-0 clipping layer so the -left/-top offsets can
          NEVER contribute scrollable overflow to the dialog (RTL: bleed to
          the left = scrollable range → content could shift on focus). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute -left-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-colors duration-500 ${q.accent.tile.split(" ")[0]}`}
          animate={{ opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="relative mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <motion.span
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald/10 text-emerald"
            animate={{ rotate: [0, 6, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Dna className="h-5 w-5" aria-hidden />
          </motion.span>
          <div>
            <h3 className="text-base font-extrabold">DNA سفرت را کشف کن</h3>
            <p className="text-[11px] text-muted-foreground">
              ۶ سوال · کمتر از ۱ دقیقه
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="بعداً"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => {
            onDismiss?.();
          }}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <Progress value={progress} className="h-1.5" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 32 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative mt-5"
        >
          <p className="text-xs text-muted-foreground">
            سوال {toFa(step + 1)} از {toFa(QUESTIONS.length)}
          </p>
          <h4 className="mt-1 text-lg font-extrabold">{q.title}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{q.hint}</p>

          {/* Options — responsive: mobile = full-width comfortable rows
              (icon beside label, no squeeze → no horizontal scroll),
              sm+ = the 5-column icon tiles. */}
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {q.options.map((opt, i) => {
              const selected = draft[q.key] === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswer(q.key, opt.value)}
                  aria-pressed={selected}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.25 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className={`group relative flex items-center gap-3 rounded-2xl border p-3 text-start transition-colors duration-200 sm:min-h-[86px] sm:flex-col sm:items-center sm:justify-center sm:gap-1.5 sm:p-2 sm:text-center ${
                    selected
                      ? `${q.accent.ring} bg-background`
                      : "border-border bg-background hover:border-foreground/20 hover:bg-secondary/40"
                  }`}
                >
                  {/* icon tile — gradient when selected, soft tint idle */}
                  <span
                    className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-300 sm:h-9 sm:w-9 ${
                      selected ? q.accent.tileSelected : q.accent.tile
                    }`}
                  >
                    <motion.span
                      animate={selected ? { scale: [1, 1.35, 1], rotate: [0, -10, 0] } : {}}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="grid place-items-center"
                    >
                      <opt.icon className="h-[18px] w-[18px]" aria-hidden />
                    </motion.span>
                    {/* check badge */}
                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                          className="absolute -left-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-foreground text-background shadow"
                        >
                          <Check className="h-2.5 w-2.5" aria-hidden />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="min-w-0 flex-1 text-[12px] font-bold leading-5 sm:flex-none sm:text-[10px] sm:leading-3">
                    {opt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="relative mt-5 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={step === 0}
          onClick={() => setStep(Math.max(0, step - 1))}
          className="gap-1 text-xs"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
          قبلی
        </Button>
        {step < QUESTIONS.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setStep(step + 1)}
            className="gap-1 text-xs"
          >
            بعدی
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button size="sm" onClick={finish} className="gap-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            ساخت DNA من
          </Button>
        )}
      </div>
    </div>
  );
}
