"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, TrendingDown, AlertTriangle } from "lucide-react";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StockCountdownProps {
  stock: number;
  className?: string;
  variant?: "full" | "compact";
}

// Hook that simulates real-time stock depletion
function useLiveStock(initialStock: number) {
  const [stock, setStock] = React.useState(initialStock);
  const [lastChange, setLastChange] = React.useState<"none" | "down">("none");

  React.useEffect(() => {
    if (initialStock <= 0) return;
    // Simulate stock decreasing every 30-90s (only when stock is low)
    const interval = setInterval(() => {
      if (initialStock <= 5 && typeof document !== "undefined" && document.visibilityState === "visible") {
        setStock((s) => {
          if (s <= 1) return s;
          setLastChange("down");
          setTimeout(() => setLastChange("none"), 2000);
          return s - 1;
        });
      }
    }, 45000 + Math.random() * 45000);
    return () => clearInterval(interval);
  }, [initialStock]);

  return { stock, lastChange };
}

export function StockCountdown({ stock, className, variant = "full" }: StockCountdownProps) {
  const { stock: liveStock, lastChange } = useLiveStock(stock);

  if (stock > 10) return null;

  const isCritical = liveStock <= 3;

  if (variant === "compact") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={liveStock}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
            isCritical ? "bg-accent/15 text-accent" : "bg-sunset/15 text-sunset",
            className
          )}
        >
          <Flame className="h-3 w-3" />
          تنها {toFa(liveStock)} عدد
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-4",
        isCritical
          ? "border-accent/40 bg-accent/5"
          : "border-sunset/30 bg-sunset/5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={isCritical ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1, repeat: isCritical ? Infinity : 0 }}
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            isCritical ? "bg-accent/15 text-accent" : "bg-sunset/15 text-sunset"
          )}
        >
          {isCritical ? <AlertTriangle className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
        </motion.div>
        <div className="flex-1">
          <p className={cn("text-sm font-bold", isCritical ? "text-accent" : "text-sunset")}>
            {isCritical ? "فرصت محدود!" : "موجودی در حال اتمام"}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={liveStock}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                className="text-2xl font-extrabold tabular-nums"
              >
                {toFa(liveStock)}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs text-muted-foreground">عدد باقی‌مانده</span>
            {lastChange === "down" && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-0.5 text-[10px] font-bold text-accent"
              >
                <TrendingDown className="h-3 w-3" />
                همین الان خرید شد!
              </motion.span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>موجودی</span>
          <span>{toFa(Math.round((liveStock / stock) * 100))}٪ باقی‌مانده</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${(liveStock / stock) * 100}%` }}
            transition={{ duration: 0.5 }}
            className={cn(
              "h-full rounded-full",
              isCritical ? "bg-accent" : "bg-sunset"
            )}
          />
        </div>
      </div>

      {isCritical && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-[10px] font-bold text-accent"
        >
          ⚡ ۳ نفر در حال مشاهده این محصول هستند — همین الان خرید کن!
        </motion.p>
      )}
    </div>
  );
}
