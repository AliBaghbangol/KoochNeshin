"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Star,
  Users,
  MoreVertical,
  UserPlus,
  Check,
  X,
  Shield,
  Flag,
  MessageSquare,
  BadgeCheck,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TravelBuddyCandidate } from "@/types/travel-buddy";
import type { TravelDNAScores } from "@/types/dna";
import { useTravelBuddy } from "@/store/travel-buddy-store";
import { LazyDnaRadarChart } from "./lazy-dna-radar-chart";
import { CompareCheckbox } from "./compare-candidates";
import { track } from "@/lib/analytics/track";
import { toast } from "sonner";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Buddy candidate card — spec §5 layout + enhancements:
 *   - Match score badge prominently placed near name (color-coded ring)
 *   - Verified badge for high-rated travelers (rating >= 4.8)
 *   - "Last active" pill (mock — varies by candidate)
 *   - Expandable DNA radar view via chevron toggle
 *   - Hover lift + micro-interactions on the buttons
 */
export function BuddyCandidateCard({
  candidate,
  index = 0,
  myDna,
  onMatched,
  compareSelected = false,
  onToggleCompare,
}: {
  candidate: TravelBuddyCandidate;
  index?: number;
  /** کاربر فعلی DNA — برای overlay روی radar chart */
  myDna?: TravelDNAScores;
  onMatched?: (c: TravelBuddyCandidate) => void;
  compareSelected?: boolean;
  onToggleCompare?: (userId: string) => void;
}) {
  const sendRequest = useTravelBuddy((s) => s.sendRequest);
  const simulateAccept = useTravelBuddy((s) => s.simulateAccept);
  const block = useTravelBuddy((s) => s.block);

  function handleRequest() {
    sendRequest(candidate.userId);
    track("buddy_request_sent", { to: candidate.userId });
    toast.success("درخواست هم‌سفری ارسال شد.");

    // For the demo, simulate the other side accepting after 2.5s
    window.setTimeout(() => {
      simulateAccept(candidate.userId);
      track("buddy_match_created", { with: candidate.userId });
      toast.success("🎉 تطابق ایجاد شد! می‌توانید وارد اتاق سفر شوید.");
      onMatched?.(candidate);
    }, 2500);
  }

  function handleBlock() {
    block(candidate.userId);
    toast.info("این کاربر بلاک شد.");
  }

  function handleReport() {
    // TODO(backend): POST /api/buddies/:id/report
    toast.success("گزارش ثبت شد.");
  }

  const tone =
    candidate.matchScore >= 85
      ? {
          text: "text-emerald",
          bg: "bg-emerald/10",
          ring: "ring-emerald/30",
          label: "تطابق عالی",
          glow: "shadow-emerald/20",
        }
      : candidate.matchScore >= 70
        ? {
            text: "text-gold",
            bg: "bg-gold/10",
            ring: "ring-gold/30",
            label: "تطابق خوب",
            glow: "shadow-gold/20",
          }
        : {
            text: "text-muted-foreground",
            bg: "bg-muted",
            ring: "ring-border",
            label: "تطابق متوسط",
            glow: "",
          };

  // Verified badge: high rating + many trips
  const isVerified = candidate.rating >= 4.8 && candidate.tripsCount >= 10;
  // "Last active" mock — deterministic per candidate
  const lastActivePill =
    candidate.tripsCount % 3 === 0
      ? "آنلاین"
      : candidate.tripsCount % 3 === 1
        ? "اخیراً فعال"
        : "فعال در ۲۴ ساعت";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02] transition hover:shadow-md",
        tone.ring,
      )}
    >
      {/* decorative score badge in top-left */}
      <div
        className={cn(
          "absolute left-3 top-3 grid h-14 w-14 place-items-center rounded-2xl text-center ring-1",
          tone.bg,
          tone.ring,
        )}
      >
        <div>
          <div className={cn("text-base font-black leading-none", tone.text)}>
            {toFa(candidate.matchScore)}٪
          </div>
          <div className="text-[8px] font-bold text-muted-foreground">تطابق</div>
        </div>
      </div>

      <div className="flex items-start justify-between pr-16">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-background">
              <AvatarImage src={candidate.avatar} alt={candidate.name} />
              <AvatarFallback>{candidate.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            {candidate.matchScore >= 85 && (
              <span className="absolute -bottom-0.5 -left-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-card bg-gold text-white">
                <Zap className="h-2.5 w-2.5 fill-white" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold">{candidate.name}</p>
              {isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 text-emerald" aria-label="تأیید شده" />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-gold text-gold" />
                {toFa(candidate.rating.toFixed(1))}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {toFa(candidate.tripsCount)} سفر
              </span>
            </div>
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
              {lastActivePill}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:scale-105"
              aria-label="گزینه‌ها"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleReport}>
              <Flag className="h-3.5 w-3.5" />
              گزارش
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleBlock}
              className="text-destructive focus:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
              بلاک
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidate.highlights.map((h) => (
          <span
            key={h}
            className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold text-emerald"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Lazy DNA radar toggle + chart (lazy-loaded recharts bundle) */}
      {myDna && (
        <div className="mt-3">
          <LazyDnaRadarChart
            myDna={myDna}
            theirDna={candidate.dna}
            matchScore={candidate.matchScore}
            candidateName={candidate.name}
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className={cn("rounded-xl px-2 py-1 text-[10px] font-bold", tone.bg, tone.text)}>
          {tone.label}
        </div>

        {candidate.requestStatus === "none" && (
          <Button
            size="sm"
            onClick={handleRequest}
            className="bg-gradient-to-br from-emerald to-emerald-dark shadow-sm transition hover:shadow-md"
          >
            <UserPlus className="h-3.5 w-3.5" />
            درخواست هم‌سفری
          </Button>
        )}
        {candidate.requestStatus === "pending" && (
          <Button size="sm" variant="outline" disabled>
            <Shield className="h-3.5 w-3.5 animate-pulse" />
            در انتظار پاسخ...
          </Button>
        )}
        {candidate.requestStatus === "matched" && (
          <Button size="sm" variant="outline" className="text-emerald">
            <Check className="h-3.5 w-3.5" />
            هم‌سفر شدید
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        )}
        {candidate.requestStatus === "declined" && (
          <Button size="sm" variant="ghost" disabled>
            رد شد
          </Button>
        )}
      </div>

      {/* compare checkbox */}
      {onToggleCompare && (
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <CompareCheckbox
              selected={compareSelected}
              onToggle={() => onToggleCompare(candidate.userId)}
            />
            افزودن به مقایسه
          </label>
          {compareSelected && (
            <span className="rounded-full bg-emerald/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald">
              ✓ انتخاب‌شده
            </span>
          )}
        </div>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground">
        🔒 شماره تماس تنها پس از تطابق متقابل و با رضایت طرفین به اشتراک گذاشته
        می‌شود.
      </p>
    </motion.article>
  );
}
