"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  ImagePlus,
  Star,
  Eye,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStories } from "@/store/stories-store";
import { useBookings } from "@/store/bookings-store";
import { findBooking, MOCK_BOOKINGS } from "@/lib/bookings/mock-bookings";
import { track } from "@/lib/analytics/track";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StoryVisibility } from "@/types/story";

const MAX_FILES = 8;
const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const VISIBILITY_LABEL: Record<StoryVisibility, string> = {
  public: "عمومی — همه می‌بینند",
  followers: "فقط دنبال‌کنندگان",
  trip_members: "فقط اعضای سفر",
  private: "خصوصی — فقط من",
};

/**
 * Story composer — multi-step form (spec §6).
 *
 * Steps:
 *   1. pick linked tour (optional)
 *   2. upload photos (mock preview with URL.createObjectURL)
 *   3. caption + star rating
 *   4. visibility
 *   5. preview → publish
 *
 * File validation (spec §6 anti-abuse): type + size enforced *before* the
 * mock upload, so the UX matches the eventual real backend behavior.
 */
export function StoryComposer({ onDone }: { onDone?: () => void }) {
  const draft = useStories((s) => s.draft);
  const setDraft = useStories((s) => s.setDraft);
  const resetDraft = useStories((s) => s.resetDraft);
  const publishDraft = useStories((s) => s.publishDraft);
  const userBookings = useBookings((s) => s.bookings);
  const allBookings = [...userBookings, ...MOCK_BOOKINGS];

  const [step, setStep] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);

  function pickFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    const next: string[] = [];
    for (const f of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError("فقط فرمت‌های JPEG / PNG / WEBP مجاز است.");
        continue;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`حجم هر عکس حداکثر ${MAX_SIZE_MB} مگابایت.`);
        continue;
      }
      if (draft.gallery.length + next.length >= MAX_FILES) {
        setError(`حداکثر ${MAX_FILES} عکس می‌توانی آپلود کنی.`);
        break;
      }
      // object URL — mock preview only, no real upload
      next.push(URL.createObjectURL(f));
    }
    if (next.length > 0) {
      const gallery = [...draft.gallery, ...next];
      setDraft({
        gallery,
        coverImageUrl: draft.coverImageUrl ?? gallery[0],
      });
    }
  }

  function removeImage(idx: number) {
    const gallery = draft.gallery.filter((_, i) => i !== idx);
    setDraft({
      gallery,
      coverImageUrl: gallery[0],
    });
  }

  function publish() {
    if (!draft.caption.trim()) {
      setError("کپشن خالی است.");
      setStep(3);
      return;
    }
    if (draft.gallery.length === 0) {
      setError("حداقل یک عکس اضافه کن.");
      setStep(2);
      return;
    }
    const story = publishDraft({
      id: "me",
      name: "شما",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces&q=80",
    });
    track("story_created", { storyId: story.id });
    track("story_published", { storyId: story.id, visibility: story.visibility });
    toast.success("داستان سفرت منتشر شد! 🎉");
    resetDraft();
    setStep(1);
    onDone?.();
  }

  const steps = [
    { n: 1, label: "سفر مرتبط" },
    { n: 2, label: "عکس‌ها" },
    { n: 3, label: "کپشن و امتیاز" },
    { n: 4, label: "مخاطب" },
    { n: 5, label: "پیش‌نمایش" },
  ];

  return (
    <div className="rounded-3xl border bg-card p-5">
      {/* stepper */}
      <ol className="mb-5 flex items-center gap-1 text-[10px]">
        {steps.map((s, i) => (
          <li key={s.n} className="flex flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => setStep(s.n)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 font-bold transition",
                step === s.n
                  ? "bg-emerald text-white"
                  : step > s.n
                    ? "bg-emerald/10 text-emerald"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step > s.n ? <Check className="h-3 w-3" /> : <span>{s.n}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <ChevronLeft className="h-3 w-3 text-muted-foreground/40" />
            )}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 1 — pick tour */}
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold">سفر مرتبط (اختیاری)</h3>
              <p className="text-[11px] text-muted-foreground">
                این داستان را به یکی از سفرهایت وصل کن تا در صفحه‌ی تور هم نمایش داده شود.
              </p>
              <Select
                value={draft.tourId ?? "none"}
                onValueChange={(v) => {
                  if (v === "none") {
                    setDraft({ tourId: undefined, tourTitle: undefined });
                  } else {
                    const b = findBooking(userBookings, v);
                    setDraft({ tourId: v, tourTitle: b?.tourTitle });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="یک سفر انتخاب کن..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— بدون سفر مرتبط —</SelectItem>
                  {allBookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.tourTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2 — photos */}
          {step === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold">عکس‌های سفر</h3>
              <label
                htmlFor="story-file"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background/50 p-6 text-center text-[11px] text-muted-foreground hover:border-emerald/40 hover:bg-emerald/5"
              >
                <ImagePlus className="h-6 w-6" />
                کلیک کن یا فایل را بکش و رها کن
                <span className="text-[10px]">
                  حداکثر {MAX_FILES} عکس · هر کدام تا {MAX_SIZE_MB}MB · JPEG/PNG/WEBP
                </span>
                <input
                  id="story-file"
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  multiple
                  className="hidden"
                  onChange={(e) => pickFiles(e.target.files)}
                />
              </label>
              {error && (
                <p className="text-[11px] text-destructive">{error}</p>
              )}
              {draft.gallery.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {draft.gallery.map((url, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square overflow-hidden rounded-xl"
                    >
                      <img src={url} alt="" className="size-full object-cover" />
                      {url === draft.coverImageUrl && (
                        <span className="absolute right-1 top-1 rounded-full bg-emerald px-1.5 py-0.5 text-[8px] font-bold text-white">
                          کاور
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/50 text-white opacity-100 transition group-hover:opacity-100 sm:h-6 sm:w-6 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="حذف عکس"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — caption + rating */}
          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold">کپشن و امتیاز</h3>
              <Textarea
                value={draft.caption}
                onChange={(e) => setDraft({ caption: e.target.value })}
                rows={4}
                placeholder="چی感じ داشتی؟ بهترین لحظه‌ی سفرت کی بود؟"
                className="text-sm"
              />
              <Input
                value={draft.location ?? ""}
                onChange={(e) => setDraft({ location: e.target.value })}
                placeholder="موقعیت (مثلاً دماوند، مازندران)"
                className="text-sm"
              />
              <div>
                <label className="mb-1 block text-[11px] font-bold">امتیاز سفر</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDraft({ rating: n })}
                      className="p-1"
                      aria-label={`${n} ستاره`}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition",
                          n <= (draft.rating ?? 0)
                            ? "fill-gold text-gold"
                            : "text-muted-foreground/30 hover:text-gold",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — visibility */}
          {step === 4 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold">چه کسی ببیند؟</h3>
              <div className="grid gap-2">
                {(Object.keys(VISIBILITY_LABEL) as StoryVisibility[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraft({ visibility: v })}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border p-3 text-right text-[12px] transition",
                      draft.visibility === v
                        ? "border-emerald/40 bg-emerald/5"
                        : "hover:bg-muted/40",
                    )}
                  >
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      {VISIBILITY_LABEL[v]}
                    </span>
                    {draft.visibility === v && (
                      <Check className="h-4 w-4 text-emerald" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — preview */}
          {step === 5 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold">پیش‌نمایش</h3>
              <div className="overflow-hidden rounded-3xl border">
                <div className="relative aspect-[4/3]">
                  <img
                    src={draft.coverImageUrl ?? draft.gallery[0]}
                    alt=""
                    className="size-full object-cover"
                  />
                  {draft.tourTitle && (
                    <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                      {draft.tourTitle}
                    </span>
                  )}
                  <div className="absolute inset-x-3 bottom-3">
                    <h4 className="text-sm font-black text-white">
                      {draft.location ?? draft.tourTitle ?? "سفر بدون نام"}
                    </h4>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[12px] leading-5">{draft.caption || "کپشن..."}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < (draft.rating ?? 0)
                              ? "fill-gold text-gold"
                              : "text-muted-foreground/30",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {VISIBILITY_LABEL[draft.visibility].split(" — ")[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && step !== 2 && (
        <p className="mt-3 text-[11px] text-destructive">{error}</p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (step > 1 ? setStep(step - 1) : onDone?.())}
        >
          <ChevronRight className="h-4 w-4" />
          {step > 1 ? "قبلی" : "انصراف"}
        </Button>
        {step < 5 ? (
          <Button size="sm" onClick={() => setStep(step + 1)}>
            بعدی
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={publish}>
            <Upload className="h-4 w-4" />
            انتشار داستان
          </Button>
        )}
      </div>
    </div>
  );
}
