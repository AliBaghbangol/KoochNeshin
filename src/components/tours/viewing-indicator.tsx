"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Users } from "lucide-react";
import { usePresence } from "@/data/use-presence";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ViewingIndicatorProps {
  tourId: string;
  variant?: "badge" | "inline" | "dot";
  className?: string;
}

export function ViewingIndicator({
  tourId,
  variant = "badge",
  className,
}: ViewingIndicatorProps) {
  const count = usePresence(tourId);

  if (variant === "dot") {
    return (
      <span className={cn("flex items-center gap-1 text-[10px] text-emerald", className)}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
        </span>
        {toFa(count)} نفر در حال مشاهده
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("flex items-center gap-1 text-xs text-emerald", className)}>
        <Users className="h-3.5 w-3.5" />
        {toFa(count)} نفر در حال مشاهده
      </span>
    );
  }

  // badge (default)
  return (
    <AnimatePresence>
      <motion.div
        key={count}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-bold text-emerald backdrop-blur",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
        </span>
        <Eye className="h-3 w-3" />
        {toFa(count)} نفر
      </motion.div>
    </AnimatePresence>
  );
}
