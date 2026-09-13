"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Compass,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import type { TravelDNAScores } from "@/types/dna";
import { toFa } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Match Insights — Travel Buddy enhancement (spec §5).
 *
 * Below the radar chart, shows a textual breakdown of WHY the match score
 * is what it is: which dimensions are aligned, which are complementary,
 * and which are different. This makes the score "explainable" (like Fit
 * Score Explainability for tours).
 *
 * Also includes a "First message suggestion" — a generated opener the
 * user can copy to start a conversation with the candidate based on
 * their strongest alignment dimension.
 *
 * Dimensions:
 *   - explorer (travel style)
 *   - adventurer (experience)
 *   - social (group vs solo)
 *   - natureLover (trip interest)
 *
 * For each dimension: |myScore - theirScore| <= 10 → "aligned",
 *                     |diff| <= 25 → "complementary", else → "different".
 */

type Dimension = keyof TravelDNAScores;

interface DimMeta {
  label: string;
  emoji: string;
  description: string;
  /** قالب پیشنهاد پیام اول بر اساس این بُعد */
  opener: (mine: number, theirs: number) => string;
}

const DIM_META: Record<Dimension, DimMeta> = {
  explorer: {
    label: "سبک سفر",
    emoji: "🔥",
    description: "میزان کشف‌گری و دنبال‌کردن تجربه‌های جدید",
    opener: () => "سلام! دیدم سبک سفرت با من هم‌سوئه — آخرین سفر کجای عجیبی داشتی؟",
  },
  adventurer: {
    label: "ماجراجویی",
    emoji: "🏔️",
    description: "تحمل سختی و چالش‌های فیزیکی سفر",
    opener: (mine, theirs) =>
      mine >= theirs
        ? `سلام! به‌نظر میاد تجربه‌ی ماجراجویی‌مون شبیهه — آخرین صعود سختی که داشتی چی بود؟`
        : "سلام! به‌نظر میاد سطح ماجراجویی‌ت بالاتره — یه تور پیشنهادی برای شروع داری؟",
  },
  social: {
    label: "اجتماعی بودن",
    emoji: "👥",
    description: "ترجیح گروهی یا انفرادی در سفر",
    opener: () => "سلام! چون هر دو به سفر گروهی علاقه‌مندیم، خوشحال میشم با هم هم‌سفر بشیم.",
  },
  natureLover: {
    label: "طبیعت‌دوستی",
    emoji: "🌿",
    description: "علایق مربوط به طبیعت و فضای باز",
    opener: () => "سلام! دیدم عاشق طبیعت هستی مثل خودم — کدوم بخش طبیعت ایران بیشترت رو جذب کرده؟",
  },
};

type Alignment = "aligned" | "complementary" | "different";

function classifyAlignment(diff: number): Alignment {
  const d = Math.abs(diff);
  if (d <= 10) return "aligned";
  if (d <= 25) return "complementary";
  return "different";
}

const ALIGNMENT_META: Record<
  Alignment,
  {
    label: string;
    color: string;
    bg: string;
    icon: typeof TrendingUp;
  }
> = {
  aligned: {
    label: "هم‌سو",
    color: "text-emerald",
    bg: "bg-emerald/10",
    icon: TrendingUp,
  },
  complementary: {
    label: "مکمل",
    color: "text-gold",
    bg: "bg-gold/10",
    icon: Minus,
  },
  different: {
    label: "متفاوت",
    color: "text-sunset",
    bg: "bg-sunset/10",
    icon: TrendingDown,
  },
};

export function MatchInsights({
  myDna,
  theirDna,
  matchScore,
  candidateName,
}: {
  myDna: TravelDNAScores;
  theirDna: TravelDNAScores;
  matchScore: number;
  candidateName?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const dims = Object.keys(DIM_META) as Dimension[];
  const rows = dims.map((d) => {
    const mine = myDna[d];
    const theirs = theirDna[d];
    const diff = mine - theirs;
    return {
      dim: d,
      meta: DIM_META[d],
      mine,
      theirs,
      diff,
      alignment: classifyAlignment(diff),
    };
  });

  // Top reason = highest absolute diff (the dimension that pulls the score
  // down most) + the most aligned dimension (the one that lifts it up).
  const sortedByDiffAbs = rows.slice().sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const topDifferent = sortedByDiffAbs[0];
  const topAligned = sortedByDiffAbs
    .slice()
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0];

  // Generate a first-message suggestion based on the strongest alignment.
  const opener = topAligned.meta.opener(topAligned.mine, topAligned.theirs);

  function copyOpener() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("کپی در دسترس نیست.");
      return;
    }
    navigator.clipboard.writeText(opener).then(() => {
      setCopied(true);
      toast.success("پیشنهاد پیام کپی شد!");
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  const summary =
    matchScore >= 85
      ? `شما و ${candidateName ?? "این هم‌سفر"} در اکثر ابعاد هم‌سو هستید — بهترین جفت ممکن!`
      : matchScore >= 70
        ? `تناسب خوبی با ${candidateName ?? "این هم‌سفر"} دارید با چند نقطه‌ی مکمل که می‌تونه سفر را پربارتر کنه.`
        : `تفاوت‌های موجود می‌تونه فرصتی برای تجربه‌های جدید باشه — با گفتگو شفاف کنید.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mt-2 space-y-2 rounded-2xl border bg-background/40 p-3"
    >
      <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-emerald">
        <Sparkles className="h-3.5 w-3.5" />
        تحلیل تطابق
      </h4>

      {/* summary */}
      <p className="text-[11px] leading-5 text-foreground/85">{summary}</p>

      {/* per-dimension rows */}
      <ul className="space-y-1.5">
        {rows.map((r, i) => {
          const meta = ALIGNMENT_META[r.alignment];
          const Icon = meta.icon;
          return (
            <motion.li
              key={r.dim}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="flex items-center gap-2 rounded-xl bg-card p-1.5 shadow-sm"
            >
              <span className="text-base" aria-hidden>
                {r.meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold">{r.meta.label}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                      meta.bg,
                      meta.color,
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {meta.label}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                  <span>تو: {toFa(r.mine)}</span>
                  <span>·</span>
                  <span>او: {toFa(r.theirs)}</span>
                  <span>·</span>
                  <span className={cn("font-bold", meta.color)}>
                    {r.diff > 0 ? "+" : ""}
                    {toFa(r.diff)}
                  </span>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>

      {/* top picks */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-2">
          <p className="flex items-center gap-1 text-[9px] font-bold text-emerald">
            <Heart className="h-2.5 w-2.5" />
            بهترین تطابق
          </p>
          <p className="mt-0.5 text-[11px] font-bold">
            {topAligned.meta.emoji} {topAligned.meta.label}
          </p>
          <p className="text-[9px] text-muted-foreground">
            اختلاف {toFa(Math.abs(topAligned.diff))} امتیاز
          </p>
        </div>
        <div className="rounded-xl border border-sunset/30 bg-sunset/5 p-2">
          <p className="flex items-center gap-1 text-[9px] font-bold text-sunset">
            <Compass className="h-2.5 w-2.5" />
            نیاز به گفتگو
          </p>
          <p className="mt-0.5 text-[11px] font-bold">
            {topDifferent.meta.emoji} {topDifferent.meta.label}
          </p>
          <p className="text-[9px] text-muted-foreground">
            اختلاف {toFa(Math.abs(topDifferent.diff))} امتیاز
          </p>
        </div>
      </div>

      {/* First message suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-xl border border-emerald/30 bg-gradient-to-l from-emerald/5 to-transparent p-2.5"
      >
        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-emerald">
          <MessageCircle className="h-3 w-3" />
          پیشنهاد پیام اول
        </p>
        <p className="text-[11px] leading-5 text-foreground/90">«{opener}»</p>
        <button
          type="button"
          onClick={copyOpener}
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold transition",
            copied
              ? "bg-emerald/15 text-emerald"
              : "bg-muted text-muted-foreground hover:bg-muted/70",
          )}
        >
          {copied ? (
            <>
              <Check className="h-2.5 w-2.5" />
              کپی شد
            </>
          ) : (
            <>
              <Copy className="h-2.5 w-2.5" />
              کپی پیام
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

