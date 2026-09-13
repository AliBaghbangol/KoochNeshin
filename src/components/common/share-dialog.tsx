"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Link2,
  Check,
  Send,
  Mail,
  MessageCircle,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";
import { useMounted } from "@/hooks/use-mounted";
import { XLogoIcon } from "@/components/common/x-logo";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url?: string;
}

/**
 * ShareDialog — portal-based so it always renders relative to the *viewport*,
 * not the nearest `backdrop-filter`/`transform` ancestor (the sticky booking
 * box creates one, which used to offset the whole dialog and break the close
 * button hit-area). Locked scroll + Escape + backdrop click to close.
 */
export function ShareDialog({ open, onClose, title, url }: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const mounted = useMounted();
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  // Escape-to-close + body scroll lock
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const copyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        toast.success("لینک کپی شد!");
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const shareOptions: {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    action: () => void;
  }[] = [
    {
      name: "ایکس",
      icon: XLogoIcon,
      // X brand: near-black tile with a white wordmark — readable in BOTH
      // themes (the old white-on-white twitter tile vanished in dark mode).
      color: "bg-neutral-950 text-white ring-1 ring-white/20 hover:bg-neutral-900",
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
      },
    },
    {
      name: "تلگرام",
      icon: Send,
      color: "bg-[#0088cc] text-white hover:bg-[#0088cc]/90",
      action: () => {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
          "_blank"
        );
      },
    },
    {
      name: "واتساپ",
      icon: MessageCircle,
      color: "bg-[#25D366] text-white hover:bg-[#25D366]/90",
      action: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`,
          "_blank"
        );
      },
    },
    {
      name: "ایمیل",
      icon: Mail,
      color: "bg-sunset text-white hover:bg-sunset/90",
      action: () => {
        window.open(
          `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
      },
    },
    {
      name: "فیسبوک",
      icon: Facebook,
      color: "bg-[#1877F2] text-white hover:bg-[#1877F2]/90",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
      },
    },
  ];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-forest/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="اشتراک‌گذاری"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald to-forest p-6 text-cream">
              {/* noise is purely decorative — pointer-events-none so it can
                  never swallow clicks meant for the close button */}
              <div className="pointer-events-none absolute inset-0 bg-noise opacity-10" />
              <button
                onClick={onClose}
                aria-label="بستن"
                className="absolute left-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:rotate-90 hover:bg-white/25"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative">
                <h3 className="text-lg font-extrabold">اشتراک‌گذاری</h3>
                <p className="mt-1 line-clamp-2 text-sm text-cream/70">{title}</p>
              </div>
            </div>

            <div className="p-6">
              {/* Social buttons */}
              <div className="grid grid-cols-5 gap-2">
                {shareOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <motion.button
                      key={opt.name}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        opt.action();
                        toast.success(`اشتراک‌گذاری در ${opt.name}`);
                      }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <span
                        className={`grid h-12 w-12 place-items-center rounded-2xl text-white shadow-md transition ${opt.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {opt.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Copy link */}
              <div className="mt-5">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  لینک مستقیم
                </label>
                <div className="flex items-center gap-2 rounded-2xl border bg-secondary/50 p-1.5">
                  <div className="flex flex-1 items-center gap-2 px-2">
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      readOnly
                      value={shareUrl}
                      className="w-full bg-transparent text-xs text-foreground/70 outline-none"
                      dir="ltr"
                    />
                  </div>
                  <button
                    onClick={copyLink}
                    className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
                      copied
                        ? "bg-emerald text-white"
                        : "bg-primary text-primary-foreground hover:bg-emerald-dark"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        کپی شد
                      </>
                    ) : (
                      "کپی"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
