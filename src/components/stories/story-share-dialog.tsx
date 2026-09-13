"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Copy,
  Check,
  X,
  Twitter,
  Facebook,
  Send,
  Mail,
  Link2,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TravelStory } from "@/types/story";
import { toFa, toPersianDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Story Share Dialog — Stories enhancement (spec §6).
 *
 * A modal that previews what the story will look like when shared on
 * social media (OG-image-style card) + offers multiple share options:
 * copy link, native share (Web Share API), Twitter, Facebook, Telegram,
 * Email.
 *
 * Falls back to copy-link when Web Share API is unavailable (e.g., desktop
 * browsers without HTTPS).
 *
 * Privacy: respects the story's `visibility` setting. If the story is
 * "private" or "followers", shows a warning that the share link will
 * not be accessible to non-authorized users.
 */

interface Props {
  story: TravelStory | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function StoryShareDialog({ story, open, onOpenChange }: Props) {
  const [copied, setCopied] = React.useState(false);

  // Build the share URL — in production this would be the actual story
  // detail page URL. For the demo we use the current origin + path.
  const shareUrl = React.useMemo(() => {
    if (typeof window === "undefined" || !story) return "";
    return `${window.location.origin}/stories/${story.id}`;
  }, [story]);

  const shareText = React.useMemo(() => {
    if (!story) return "";
    return `داستان سفر «${story.location ?? story.tourTitle ?? "کوچ‌نشین"}» را در کوچ‌نشین بخوانید`;
  }, [story]);

  function copyLink() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("کپی لینک در دسترس نیست.");
      return;
    }
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("لینک کپی شد!");
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      toast.info("اشتراک‌گذاری بومی در این مرورگر پشتیبانی نمی‌شود — از لینک کپی استفاده کن.");
      return;
    }
    try {
      await navigator.share({
        title: story?.tourTitle ?? "داستان سفر کوچ‌نشین",
        text: shareText,
        url: shareUrl,
      });
    } catch {
      /* user cancelled — silent */
    }
  }

  function openShareUrl(provider: "twitter" | "facebook" | "telegram" | "email") {
    if (!story) return;
    const u = encodeURIComponent(shareUrl);
    const t = encodeURIComponent(shareText);
    const urls: Record<typeof provider, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      telegram: `https://t.me/share/url?url=${u}&text=${t}`,
      email: `mailto:?subject=${encodeURIComponent(story.tourTitle ?? "داستان سفر")}&body=${t}%0A${u}`,
    };
    window.open(urls[provider], "_blank", "noopener,noreferrer");
  }

  function downloadCover() {
    if (!story) return;
    // Create a temporary link and trigger download
    const a = document.createElement("a");
    a.href = story.coverImageUrl;
    a.download = `story-${story.id}.jpg`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("در حال دانلود عکس کاور...");
  }

  if (!story) return null;

  const isPublic = story.visibility === "public";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald" />
            اشتراک‌گذاری داستان
          </DialogTitle>
          <DialogDescription>
            این داستان را با دوستانت به اشتراک بگذار
          </DialogDescription>
        </DialogHeader>

        {/* OG preview card */}
        <div className="overflow-hidden rounded-2xl border shadow-sm">
          <div className="relative aspect-video bg-muted">
            <img
              src={story.coverImageUrl}
              alt={story.caption}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-3 bottom-3">
              <p className="text-[10px] font-bold text-white/80">
                kochneshin.ir
              </p>
              <p className="text-sm font-black text-white line-clamp-2 drop-shadow">
                {story.location ?? story.tourTitle ?? "داستان سفر"}
              </p>
              <p className="mt-0.5 text-[10px] text-white/70 line-clamp-1">
                {story.caption}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-card p-2.5">
            <Avatar className="h-6 w-6">
              <AvatarImage src={story.authorAvatar} alt={story.authorName} />
              <AvatarFallback>{story.authorName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground">
              توسط {story.authorName} · {toFa(story.likesCount)} پسند
            </span>
          </div>
        </div>

        {/* privacy warning for non-public stories */}
        {!isPublic && (
          <div className="rounded-xl bg-gold/10 p-2 text-[10px] text-gold">
            ⚠️ این داستان با دیدگاه «{visibilityLabel(story.visibility)}» منتشر شده.
            لینک اشتراک‌گذاری فقط برای کاربران مجاز قابل‌مشاهده خواهد بود.
          </div>
        )}

        {/* share buttons grid */}
        <div className="grid grid-cols-4 gap-2">
          <ShareButton
            icon={Link2}
            label="کپی لینک"
            tone={copied ? "bg-emerald/15 text-emerald" : "bg-muted text-muted-foreground"}
            onClick={copyLink}
            active={copied}
            activeIcon={Check}
          />
          <ShareButton
            icon={Send}
            label="اشتراک"
            tone="bg-blue-500/10 text-blue-500"
            onClick={nativeShare}
          />
          <ShareButton
            icon={Twitter}
            label="توییتر"
            tone="bg-sky-500/10 text-sky-500"
            onClick={() => openShareUrl("twitter")}
          />
          <ShareButton
            icon={Facebook}
            label="فیسبوک"
            tone="bg-blue-600/10 text-blue-600"
            onClick={() => openShareUrl("facebook")}
          />
          <ShareButton
            icon={Send}
            label="تلگرام"
            tone="bg-cyan-500/10 text-cyan-500"
            onClick={() => openShareUrl("telegram")}
          />
          <ShareButton
            icon={Mail}
            label="ایمیل"
            tone="bg-muted text-muted-foreground"
            onClick={() => openShareUrl("email")}
          />
          <ShareButton
            icon={Download}
            label="دانلود کاور"
            tone="bg-emerald/10 text-emerald"
            onClick={downloadCover}
          />
        </div>

        {/* link field */}
        <div className="flex items-center gap-2 rounded-xl border bg-background/40 p-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-muted-foreground outline-none"
            dir="ltr"
          />
          <Button
            size="sm"
            variant={copied ? "outline" : "default"}
            onClick={copyLink}
            className="h-7 shrink-0 gap-1 text-[11px]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                کپی شد
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                کپی
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShareButton({
  icon: Icon,
  label,
  tone,
  onClick,
  active,
  activeIcon: ActiveIcon,
}: {
  icon: typeof Share2;
  label: string;
  tone: string;
  onClick: () => void;
  active?: boolean;
  activeIcon?: typeof Check;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-xl border bg-card p-2 text-center transition hover:shadow-sm"
    >
      <span className={cn("grid h-8 w-8 place-items-center rounded-full", tone)}>
        {active && ActiveIcon ? (
          <ActiveIcon className="h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </span>
      <span className="text-[9px] font-bold text-muted-foreground">
        {active ? "کپی شد" : label}
      </span>
    </motion.button>
  );
}

function visibilityLabel(v: TravelStory["visibility"]): string {
  return {
    public: "عمومی",
    followers: "فقط دنبال‌کنندگان",
    trip_members: "فقط اعضای سفر",
    private: "خصوصی",
  }[v];
}
