"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FloatingAlert — a global, elegant, auto-dismissing alert that appears
 * at the top-center of the screen with a glassmorphism style.
 *
 * Usage:
 *   import { showFloatingAlert } from "@/components/common/floating-alert";
 *   showFloatingAlert("لطفاً یک کد تخفیف وارد کنید", "error");
 *
 * Mount <FloatingAlertHost /> once in AppShell (near other overlays).
 */

interface FloatingAlertState {
  message: string;
  type: "error" | "success";
}

// Simple global event system (no Zustand needed — not persisted)
let listeners: ((s: FloatingAlertState | null) => void)[] = [];

export function showFloatingAlert(
  message: string,
  type: "error" | "success" = "error"
) {
  listeners.forEach((l) => l({ message, type }));
}

export function FloatingAlertHost() {
  const [state, setState] = React.useState<FloatingAlertState | null>(null);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  React.useEffect(() => {
    if (!state) return;
    const t = setTimeout(() => setState(null), 3000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[200] flex justify-center px-4">
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-2xl border px-5 py-3 shadow-2xl backdrop-blur-md",
              state.type === "error"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-emerald/30 bg-emerald/10 text-emerald"
            )}
          >
            {state.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <span className="text-sm font-bold">{state.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
