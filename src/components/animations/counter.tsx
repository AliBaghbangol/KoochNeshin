"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { toFa } from "@/lib/format";

interface CounterProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
  suffix?: string;
  prefix?: string;
  /**
   * تعداد رقم اعشاری که در طول و انتهای انیمیشن نگه داشته می‌شود.
   * پیش‌فرض ۰ است — یعنی همیشه عدد صحیح نمایش داده می‌شود (شمارنده‌های
   * کاربر/سفارش/بازدید نباید وسط انیمیشن اعشار بگیرند). فقط آمارهایی مثل
   * «امتیاز میانگین» صریحاً decimals={1} می‌گذارند.
   */
  decimals?: number;
}

export function Counter({
  to,
  from = 0,
  className,
  format = (n) => toFa(n),
  suffix = "",
  prefix = "",
  decimals = 0,
}: CounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(from);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  // Round to `decimals` places BEFORE formatting so intermediate spring
  // values never leak fractional digits into integer counters.
  const text = useTransform(spring, (v) => {
    const p = 10 ** decimals;
    const rounded = Math.round(v * p) / p;
    return `${prefix}${format(rounded)}${suffix}`;
  });

  React.useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);

  return <motion.span ref={ref} className={className}>{text}</motion.span>;
}
