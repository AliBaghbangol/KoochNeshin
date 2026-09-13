"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Trash2,
  Tag,
  CalendarCheck,
  Star,
  Info,
  Users,
  X,
  Sparkles,
} from "lucide-react";
import { useNotifications, type NotificationType } from "@/store/notifications-store";
import { RealtimeStatusChip, simulateLiveEvent } from "@/components/layout/notification-realtime";
import { useGo } from "@/lib/use-go";
import { useRouter } from "next/navigation";
import { toFa, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useHeroScrolled } from "@/hooks/use-scroll-state";
import { IconTooltip } from "@/components/common/icon-tooltip";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Tag; color: string; bg: string }
> = {
  discount: { icon: Tag, color: "text-sunset", bg: "bg-sunset/10" },
  booking: { icon: CalendarCheck, color: "text-emerald", bg: "bg-emerald/10" },
  review: { icon: Star, color: "text-gold", bg: "bg-gold/10" },
  system: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
  social: { icon: Users, color: "text-emerald-light", bg: "bg-emerald-light/10" },
};

function NotificationItem({
  notification,
  onClose,
}: {
  notification: ReturnType<typeof useNotifications.getState>["notifications"][number];
  onClose: () => void;
}) {
  const { markRead, remove } = useNotifications();
  const go = useGo();
  const cfg = TYPE_CONFIG[notification.type];
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notification.read) markRead(notification.id);
    if (notification.actionView) {
      go(notification.actionView as never);
      onClose();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      role="button"
      tabIndex={0}
      aria-label={notification.title}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-2xl border p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        notification.read
          ? "border-border/40 bg-card/50"
          : "border-primary/20 bg-primary/5 hover:bg-primary/10"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            cfg.bg,
            cfg.color
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold leading-5">{notification.title}</p>
            {!notification.read && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sunset shadow-glow-gold" />
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {notification.body}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {timeAgo(notification.time)}
            </span>
            {notification.actionLabel && (
              <span className="text-[10px] font-bold text-primary">
                {notification.actionLabel} ←
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            remove(notification.id);
          }}
          className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive group-hover:opacity-100 max-sm:opacity-100 max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
          aria-label="حذف"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

export function NotificationCenter({
  variant = "navbar",
}: {
  /**
   * navbar — bell lives in the top bar; panel drops DOWN below it.
   *   v27 fix: on <1024px the panel previously flipped UPWARD
   *   (max-lg:bottom-12) and opened outside the viewport — now it is
   *   pinned under the navbar and always fully visible.
   * sheet — bell lives in the slide-in menu; panel opens as a
   *   viewport-anchored bottom sheet so it can never be clipped.
   */
  variant?: "navbar" | "sheet";
}) {
  const [open, setOpen] = React.useState(false);
  // v21.9.2: the badge shows the PERSISTED unread count — on the server the
  // store still holds the seed (count ۲), on the client localStorage may hold
  // a different number → recoverable hydration mismatch (dev overlay).
  // Gate the badge on mount exactly like the wishlist badge in the navbar.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // FIX (v25): the bell previously flipped to its dark "scrolled" color at
  // just 24px of scroll, while the rest of the navbar waits for the hero
  // fold (50vh) — so on desktop the icon turned black over the dark hero
  // while every other icon stayed cream. Now it shares the SAME
  // useHeroScrolled threshold as theme/cart/wishlist buttons.
  const scrolled = useHeroScrolled();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const count = unreadCount();
  const ref = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );

  return (
    <div className="relative" ref={ref}>
      <IconTooltip label="اعلان‌ها" side="bottom">
        <button
          aria-label="اعلان‌ها"
          title="اعلان‌ها"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "relative grid h-9 w-9 place-items-center rounded-full transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "max-sm:h-11 max-sm:w-11",
            variant === "sheet" || scrolled
              ? "text-foreground/70 hover:bg-primary/10 hover:text-primary"
              : "text-cream/70 hover:bg-cream/10 hover:text-cream"
          )}
        >
        <Bell className={cn("h-5 w-5 transition", open && "text-primary")} />
        <AnimatePresence>
          {mounted && count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0, y: -6 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sunset px-1 text-[10px] font-bold text-white shadow-md"
            >
              {toFa(count)}
            </motion.span>
          )}
        </AnimatePresence>
        {mounted && count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-4 w-4 animate-ping rounded-full bg-sunset/40" />
        )}
        </button>
      </IconTooltip>

      <AnimatePresence>
        {open && (
          <>
            {/* Invisible overlay to catch outside clicks reliably */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: variant === "sheet" ? 24 : -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: variant === "sheet" ? 24 : -10, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "z-50 overflow-hidden rounded-3xl border border-border/60 bg-background shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-black/5",
                variant === "sheet"
                  ? // Menu sheet → viewport bottom-sheet, always fully visible
                    "fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] w-auto"
                  : // Top navbar → dropdown below the bell. v27: on <1024px it
                    // used to flip ABOVE the bell and leave the viewport —
                    // now it is pinned just under the top bar, centered.
                    "absolute left-0 top-12 w-[min(22rem,calc(100vw-1rem))] max-lg:fixed max-lg:inset-x-4 max-lg:top-[4.75rem] max-lg:w-auto"
              )}
            >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold">اعلان‌ها</h3>
                <RealtimeStatusChip />
                {count > 0 && (
                  <span className="rounded-full bg-sunset/15 px-2 py-0.5 text-[10px] font-bold text-sunset">
                    {toFa(count)} خوانده‌نشده
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const ok = simulateLiveEvent();
                    if (!ok) {
                      import("@/components/common/floating-alert").then(
                        ({ showFloatingAlert }) =>
                          showFloatingAlert("اتصال زنده برقرار نیست", "error")
                      );
                    }
                  }}
                  className="relative grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                  title="شبیه‌سازی اعلان زنده"
                  aria-label="شبیه‌سازی اعلان زنده"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
                {count > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllRead();
                    }}
                    className="relative grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-emerald max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                    title="همه را خوانده‌شده علامت بزن"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAll();
                    }}
                    className="relative grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
                    title="پاک کردن همه"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="custom-scroll max-h-[60vh] space-y-2 overflow-y-auto p-2">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary">
                    <Bell className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="text-sm font-semibold">اعلانی نیست</p>
                  <p className="text-xs">اعلان‌های جدید اینجا نمایش داده می‌شوند.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {sorted.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t p-2 text-center">
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/dashboard");
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  مشاهده همه در داشبورد
                </button>
              </div>
            )}
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
