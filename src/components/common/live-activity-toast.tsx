"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Tag, X } from "lucide-react";
import { tours } from "@/mocks/tours";
import { equipment } from "@/mocks/equipment";
import { toFa } from "@/lib/format";
import { useGo } from "@/lib/use-go";

/**
 * Discount notification toast.
 *
 * Shows two kinds of promotions pulled from real catalog data:
 *  1. Tours that have a `discountPrice` — computed discount % + remaining
 *     capacity ("🔥 تور {title} با {X}٪ تخفیف — تنها {N} ظرفیت باقی‌مانده!").
 *  2. Equipment bundle deals derived from real categories present in the
 *     equipment catalog ("🏷 پکیج کمپینگ با ۱۵٪ تخفیف ویژه").
 *
 * Same UX as the previous social-proof toast: bottom-right, auto-dismisses
 * after 6s, dismissible (persists dismissal in localStorage), and uses the
 * same Framer Motion animation.
 */

interface Activity {
  id: number;
  type: "tour-discount" | "bundle-deal";
  title: string;
  refId: string;
  discountPercent?: number;
  remainingCapacity?: number;
  time: string;
}

// Pre-compute tours that actually have a discounted price.
const DISCOUNT_TOURS = tours.filter(
  (t) => typeof t.discountPrice === "number" && t.discountPrice > 0
);

// Persian labels for the equipment categories we promote as bundles.
const EQUIPMENT_CATEGORY_LABELS: Record<string, string> = {
  mountaineering: "کوهنوردی",
  camping: "کمپینگ",
  clothing: "پوشاک",
  "travel-gear": "تجهیزات سفر",
};

// Build bundle deals only from categories that actually exist in the
// equipment catalog so the message always references real stock.
const EQUIPMENT_BUNDLES = (
  [
    { category: "camping", discountPercent: 15 },
    { category: "mountaineering", discountPercent: 12 },
    { category: "clothing", discountPercent: 18 },
    { category: "travel-gear", discountPercent: 10 },
  ] as const
)
  .filter((b) => equipment.some((e) => e.category === b.category))
  .map((b) => ({
    title: `پکیج ${EQUIPMENT_CATEGORY_LABELS[b.category] ?? b.category}`,
    discountPercent: b.discountPercent,
  }));

const FALLBACK_BUNDLE = {
  title: "پکیج کمپینگ",
  discountPercent: 15,
};

function generateActivity(): Activity {
  // 70% tour discount, 30% equipment bundle deal.
  if (Math.random() < 0.7 && DISCOUNT_TOURS.length > 0) {
    const tour =
      DISCOUNT_TOURS[Math.floor(Math.random() * DISCOUNT_TOURS.length)];
    const discountPercent = Math.round(
      ((tour.price - (tour.discountPrice ?? tour.price)) / tour.price) * 100
    );
    const remainingCapacity = Math.max(
      0,
      tour.capacity - tour.reservedCount
    );
    return {
      id: Date.now(),
      type: "tour-discount",
      title: tour.title,
      refId: tour.id,
      discountPercent,
      remainingCapacity,
      time: "همین الان",
    };
  }

  const bundle =
    EQUIPMENT_BUNDLES.length > 0
      ? EQUIPMENT_BUNDLES[Math.floor(Math.random() * EQUIPMENT_BUNDLES.length)]
      : FALLBACK_BUNDLE;

  return {
    id: Date.now(),
    type: "bundle-deal",
    title: bundle.title,
    refId: "equipment",
    discountPercent: bundle.discountPercent,
    time: "همین الان",
  };
}

function ActivityContent({ activity }: { activity: Activity }) {
  const go = useGo();
  const Icon = activity.type === "tour-discount" ? Flame : Tag;

  const text =
    activity.type === "tour-discount"
      ? `🔥 تور ${activity.title} با ${toFa(activity.discountPercent ?? 0)}٪ تخفیف — تنها ${toFa(activity.remainingCapacity ?? 0)} ظرفیت باقی‌مانده!`
      : `🏷 ${activity.title} با ${toFa(activity.discountPercent ?? 0)}٪ تخفیف ویژه`;

  const subtitle =
    activity.type === "tour-discount"
      ? activity.title
      : "تخفیف‌های ویژه کوچ‌نشین";

  return (
    <motion.button
      layout
      onClick={() =>
        activity.type === "tour-discount"
          ? go("tour-detail", { id: activity.refId })
          : go("equipment")
      }
      className="group flex w-full items-center gap-3 rounded-2xl border bg-card/95 p-3 text-right shadow-2xl backdrop-blur transition hover:border-primary/40"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{text}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
        {activity.time}
      </span>
    </motion.button>
  );
}

export function LiveActivityToast() {
  const [current, setCurrent] = React.useState<Activity | null>(null);
  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    // Check if user dismissed
    try {
      if (localStorage.getItem("kochneshin-activity-dismissed")) {
        setEnabled(false);
        return;
      }
    } catch {
      // ignore
    }

    // First toast after 8s, then every 18-30s
    const firstDelay = 8000;
    let timeout: ReturnType<typeof setTimeout>;

    const show = () => {
      setCurrent(generateActivity());
      // Auto-hide after 6s
      timeout = setTimeout(() => {
        setCurrent(null);
        // Schedule next
        const next = 18000 + Math.random() * 12000;
        timeout = setTimeout(show, next);
      }, 6000);
    };

    timeout = setTimeout(show, firstDelay);
    return () => clearTimeout(timeout);
  }, []);

  const dismiss = () => {
    setCurrent(null);
    setEnabled(false);
    try {
      localStorage.setItem("kochneshin-activity-dismissed", "1");
    } catch {
      // ignore
    }
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[55] w-80 max-w-[calc(100vw-3rem)] max-sm:bottom-[max(4.75rem,calc(4.75rem+env(safe-area-inset-bottom)))] max-sm:right-4 max-sm:max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative"
          >
            <ActivityContent activity={current} />
            <button
              onClick={dismiss}
              aria-label="بستن"
              className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-forest text-cream shadow-md transition hover:bg-emerald-dark max-sm:after:absolute max-sm:after:-inset-2.5 max-sm:after:content-['']"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
