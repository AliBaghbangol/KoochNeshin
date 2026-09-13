"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Lock, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTravelBuddy } from "@/store/travel-buddy-store";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { useGo } from "@/lib/use-go";
import { track } from "@/lib/analytics/track";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Buddy opt-in toggle for the tour detail page — spec §5.
 *
 * Default OFF. Only when the user opts in can they see candidates (symmetry
 * rule). Provides a direct CTA to /buddies once opted-in.
 *
 * Visual polish (v2): animated icon swap (Lock ↔ Users), motion on toggle,
 * decorative gradient when optedIn, sparkle when toggling on.
 */
export function BuddyOptInToggle({ tourId }: { tourId: string }) {
  const optedIn = useTravelBuddy((s) => s.optedIn);
  const setOptedIn = useTravelBuddy((s) => s.setOptedIn);
  const setTour = useTravelBuddy((s) => s.setTour);
  const user = useAuth((s) => s.user);
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  const go = useGo();

  React.useEffect(() => {
    setTour(tourId, null);
  }, [tourId, setTour]);

  /** §auth — هم‌سفریابی بدون لاگین کار نمی‌کند (درخواست کاربر). */
  function requireLogin(): boolean {
    if (user) return false;
    toast.info("اول وارد حساب شو", {
      description: "هم‌سفریابی فقط برای کاربران وارد‌شده فعال می‌شود.",
    });
    setAuthOpen(true);
    return true;
  }

  function handleToggle(v: boolean) {
    if (v && requireLogin()) return;
    setOptedIn(v, tourId);
    if (v) {
      track("buddy_opted_in", { tourId });
      toast.success("حاضر باش! می‌توانی هم‌سفر پیدا کنی.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border p-4 transition sm:flex-row sm:items-center sm:justify-between",
        optedIn
          ? "border-emerald/30 bg-gradient-to-l from-emerald/10 to-transparent"
          : "bg-card",
      )}
    >
      {/* decorative glow when optedIn */}
      {optedIn && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-emerald/20 blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <motion.span
            key={optedIn ? "on" : "off"}
            initial={{ scale: 0.5, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-2xl",
              optedIn ? "bg-emerald/15 text-emerald" : "bg-muted text-muted-foreground",
            )}
          >
            {optedIn ? <Users className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </motion.span>
          <div>
            <p className="text-sm font-bold">
              {optedIn ? "هم‌سفریابی فعال است" : "می‌خوای هم‌سفر پیدا کنی؟"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {optedIn
                ? "پروفایلت برای مسافران هم‌سفر قابل‌مشاهده است."
                : "با روشن کردن، مسافران سازگار را می‌بینی و خودت هم دیده می‌شوی."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {optedIn && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (requireLogin()) return;
                    go("buddies");
                  }}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  مشاهده هم‌سفرها
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <Switch checked={optedIn} onCheckedChange={handleToggle} aria-label="اشتراک هم‌سفریابی" />
        </div>
      </div>
    </motion.div>
  );
}

