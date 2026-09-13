"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Lock, LogIn } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTravelBuddy, MY_DEFAULT_DNA } from "@/store/travel-buddy-store";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { BuddyCandidateCard } from "@/components/travel-buddy/buddy-candidate-card";
import { CompatibilityMatrix } from "@/components/travel-buddy/compatibility-matrix";
import {
  CompareCandidatesDialog,
  CompareFloatingBar,
} from "@/components/travel-buddy/compare-candidates";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { tours } from "@/mocks/tours";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { flagOn } from "@/lib/feature-flags";
import { track } from "@/lib/analytics/track";
import { toast } from "sonner";
import { toFa } from "@/lib/format";

/**
 * Buddies view — spec §5.
 * URL: /buddies
 *
 * Symmetry rule (mandatory): if `!optedIn`, the candidate list is hidden —
 * the user must opt-in first before they can see or be seen.
 */
export function BuddiesView() {
  const optedIn = useTravelBuddy((s) => s.optedIn);
  const setOptedIn = useTravelBuddy((s) => s.setOptedIn);
  const setTour = useTravelBuddy((s) => s.setTour);
  const tourId = useTravelBuddy((s) => s.tourId);
  const visibleCandidates = useTravelBuddy((s) => s.visibleCandidates);
  const user = useAuth((s) => s.user);
  const setAuthOpen = useNav((s) => s.setAuthOpen);

  const effectiveTourId = tourId ?? tours[0].id;

  React.useEffect(() => {
    setTour(effectiveTourId, null);
  }, [effectiveTourId, setTour]);

  // compare candidates state
  const [compareSelected, setCompareSelected] = React.useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = React.useState(false);

  function toggleCompare(userId: string) {
    setCompareSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        if (next.size >= 3) {
          toast.info("حداکثر ۳ هم‌سفر را می‌توانید مقایسه کنید.");
          return prev;
        }
        next.add(userId);
      }
      return next;
    });
  }

  function clearCompare() {
    setCompareSelected(new Set());
  }

  function handleToggle(v: boolean) {
    setOptedIn(v, effectiveTourId);
    if (v) {
      track("buddy_opted_in", { tourId: effectiveTourId });
      toast.success("حاضر باش! دیگر مسافران هم‌سفر را می‌توانند پیدا کنند.");
    } else {
      toast.info("اشتراک‌گذاری پروفایل هم‌سفریابی خاموش شد.");
    }
  }

  if (!flagOn("travelBuddy")) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center p-6 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-muted text-muted-foreground">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold">هم‌سفریابی فعلاً غیرفعال است</h2>
        </div>
      </div>
    );
  }

  // §auth — buddy matching exposes your profile to others: login required.
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-3xl border border-dashed bg-card/60 p-8">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-emerald/10 text-emerald">
            <Lock className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="text-lg font-black">هم‌سفریابی مخصوص حساب‌های کاربری است</h1>
          <p className="mx-auto mt-2 max-w-xs text-[12px] leading-6 text-muted-foreground">
            برای پیدا کردن هم‌سفر باید وارد حسابت شوی تا پروفایل تو به شکل
            امن به مسافران تأییدشده نشان داده شود.
          </p>
          <Button
            onClick={() => setAuthOpen(true)}
            className="mt-5 gap-2 rounded-xl bg-gradient-to-l from-emerald to-emerald-dark font-extrabold text-white shadow-md shadow-emerald/20"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            ورود | ثبت‌نام
          </Button>
        </div>
      </div>
    );
  }

  const candidates = visibleCandidates();
  const matchedCount = candidates.filter(
    (c) => c.requestStatus === "matched",
  ).length;
  const compareCandidates = candidates.filter((c) => compareSelected.has(c.userId));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <ScrollReveal>
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald/10 text-emerald">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-black">هم‌سفریابی</h1>
            <p className="text-[12px] text-muted-foreground">
              مسافران این تور را که راحت با تو سازگارند ببین و درخواست بده.
            </p>
          </div>
        </div>

        {/* opt-in toggle */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-3xl border bg-card p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-10 w-10 place-items-center rounded-2xl ${
                  optedIn ? "bg-emerald/15 text-emerald" : "bg-muted text-muted-foreground"
                }`}
              >
                {optedIn ? <UserCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-sm font-bold">
                  {optedIn ? "پروفایلت برای هم‌سفریابی فعال است" : "می‌خوای هم‌سفر پیدا کنی؟"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {optedIn
                    ? "سایر مسافران تأییدشده می‌توانند تو را ببینند و درخواست بدهند."
                    : "با روشن کردن این گزینه، پروفایلت برای مسافران هم‌سفر قابل‌مشاهده می‌شود."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {optedIn ? "روشن" : "خاموش"}
              </span>
              <Switch checked={optedIn} onCheckedChange={handleToggle} />
            </div>
          </div>

          <div className="mt-4 border-t pt-3">
            <label className="mb-1 block text-[11px] font-bold">تور هدف</label>
            <Select
              value={effectiveTourId}
              onValueChange={(v) => setTour(v, null)}
            >
              <SelectTrigger className="w-full sm:max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tours.slice(0, 12).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* symmetry gate */}
        {!optedIn ? (
          <div className="grid place-items-center rounded-3xl border border-dashed bg-card/50 p-10 text-center">
            <Lock className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-bold">برای دیدن هم‌سفرها، ابتدا opt-in کن</p>
            <p className="mt-1 max-w-sm text-[11px] text-muted-foreground">
              حریم خصوصی متقابل: کسی که خودش اشتراک نگذاشته نمی‌تواند دیگران را
              ببیند. این قانون تقارن است.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground">
                {toFa(candidates.length)} هم‌سفر بالقوه
              </p>
              {matchedCount > 0 && (
                <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[11px] font-bold text-emerald">
                  {toFa(matchedCount)} تطابق
                </span>
              )}
            </div>
            {/* CompatibilityMatrix owns its own responsive card grid —
                it must NOT be wrapped in another grid (that squeezed
                every card into one column: the «کارت‌ها عرض ندارند» bug). */}
            <CompatibilityMatrix
              candidates={candidates}
              myDna={MY_DEFAULT_DNA}
              compareSelected={compareSelected}
              onToggleCompare={toggleCompare}
            />

            {/* floating compare bar */}
            <CompareFloatingBar
              count={compareSelected.size}
              onCompare={() => setCompareOpen(true)}
              onClear={clearCompare}
            />
          </>
        )}
      </ScrollReveal>

      {/* compare dialog */}
      <CompareCandidatesDialog
        candidates={compareCandidates}
        open={compareOpen}
        onOpenChange={setCompareOpen}
      />
    </div>
  );
}
