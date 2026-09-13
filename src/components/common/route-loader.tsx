"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { KochLoader } from "@/components/common/koch-loader";

/**
 * RouteLoader — the themed KochLoader as a real, SEEN page transition.
 *
 * The route-level loading.tsx files only render while a segment is actually
 * suspended; with instant local data they flash by invisibly (user: «روی همه
 * مسیرها نمی‌تونم اینو ببینمش»). This overlay guarantees the nomad-camp scene
 * appears on EVERY client-side navigation for a short, intentional, native-app
 * moment — then fades out onto the ready page.
 */

const SHOW_MS = 900;
const FADE_S = 0.3;

const LABELS: [RegExp, string][] = [
  [/^\/tours/, "در حال کوچ به سراغ تورها…"],
  [/^\/equipment/, "در حال کوچ به سراغ تجهیزات…"],
  [/^\/destinations/, "در حال کوچ به سوی مقاصد…"],
  [/^\/blog/, "در حال کوچ به سوی مجله…"],
  [/^\/dashboard/, "در حال کوچ به اردوگاه تو…"],
  [/^\/checkout/, "در حال بستن چمدون سفر…"],
  [/^\/about/, "در حال کوچ به سوی داستان ما…"],
  [/^(\/leader|\/seller|\/admin)/, "در حال ورود به پنل…"],
  [/^\/$/, "بازگشت به اردوگاه…"],
];

function labelFor(pathname: string): string {
  for (const [re, label] of LABELS) if (re.test(pathname)) return label;
  return "در حال کوچ به مقصد…";
}

// Module scope — survives the per-navigation AppShell remounts.
let lastPath: string | null = null;

export function RouteLoader() {
  const pathname = usePathname() || "";
  const [visible, setVisible] = React.useState(false);
  const [label, setLabel] = React.useState("در حال کوچ به مقصد…");

  React.useEffect(() => {
    // Every page renders its own <AppShell>, so this component REMOUNTS on
    // each navigation — refs reset. A module-level `lastPath` is the only
    // state that survives remounts: null = initial page load (skip), equal =
    // same-route remount (skip), different = real navigation (show).
    if (lastPath === null || lastPath === pathname) {
      lastPath = pathname;
      return;
    }
    lastPath = pathname;
    setLabel(labelFor(pathname));
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="route-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
          exit={{ opacity: 0, transition: { duration: FADE_S, ease: "easeOut" } }}
          role="status"
          aria-live="polite"
          aria-label="بارگذاری صفحه"
          className="fixed inset-0 z-[70] grid place-items-center bg-background/85 backdrop-blur-md"
        >
          <KochLoader label={label} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
