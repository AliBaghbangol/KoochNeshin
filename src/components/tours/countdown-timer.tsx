"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Clock, Flame } from "lucide-react";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
  variant?: "full" | "compact";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({
  targetDate,
  className,
  variant = "full",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>(() =>
    calculateTimeLeft(targetDate)
  );
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft(targetDate));
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) {
    return null;
  }

  const isPast = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;
  const isUrgent = timeLeft.days <= 3 && !isPast;

  const units = [
    { label: "روز", value: timeLeft.days },
    { label: "ساعت", value: timeLeft.hours },
    { label: "دقیقه", value: timeLeft.minutes },
    { label: "ثانیه", value: timeLeft.seconds },
  ];

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
          isUrgent ? "bg-accent/15 text-accent" : "bg-emerald/10 text-emerald",
          className
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        {isPast ? (
          "شروع شده"
        ) : (
          <span dir="ltr">
            {toFa(timeLeft.days)}:{toFa(String(timeLeft.hours).padStart(2, "0"))}:
            {toFa(String(timeLeft.minutes).padStart(2, "0"))}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        isUrgent ? "border-accent/30 bg-accent/5" : "border-border bg-card",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        {isUrgent ? (
          <Flame className="h-5 w-5 text-accent" />
        ) : (
          <Clock className="h-5 w-5 text-primary" />
        )}
        <h4
          className={cn(
            "text-sm font-bold",
            isUrgent ? "text-accent" : "text-primary"
          )}
        >
          {isPast
            ? "تور شروع شده"
            : isUrgent
            ? "فرصت محدود!"
            : "زمان تا شروع تور"}
        </h4>
      </div>
      {isPast ? (
        <p className="text-sm text-muted-foreground">
          این تور در حال برگزاری است.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {units.map((unit, _i) => (
            <div
              key={unit.label}
              className="rounded-xl bg-background/60 p-2 text-center"
            >
              <motion.div
                key={unit.value}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "text-2xl font-extrabold tabular-nums",
                  isUrgent ? "text-accent" : "text-primary"
                )}
              >
                {toFa(String(unit.value).padStart(2, "0"))}
              </motion.div>
              <p className="text-[10px] text-muted-foreground">{unit.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
