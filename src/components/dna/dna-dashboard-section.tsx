"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/store/auth-store";
import { useTravelDNA } from "@/data/use-travel-dna";
import { LS_KEYS } from "@/data/mock-adapter";
import { TravelDnaTest } from "./travel-dna-test";
import { TravelDnaCard } from "./travel-dna-card";

/**
 * بخش Travel DNA در داشبورد کاربر (بخش ۳ سند v19):
 * - اگر DNA ندارد → کوییز دعوت‌کننده به‌صورت بنر (نه modal اجباری) + «بعداً»
 * - اگر DNA دارد → کارت نتیجه با دکمه «دوباره بساز»
 * dismiss در localStorage ذخیره می‌شود تا تا وقتی DNA نساخته دیگر بالا نیاید.
 */
export function DnaDashboardSection() {
  const user = useAuth((s) => s.user);
  const userId = user?.id;
  const { data: dna, isLoading } = useTravelDNA(userId);
  const [dismissed, setDismissed] = React.useState(true); // تا بعد از mount تصمیم بگیریم (SSR-safe)
  const [rebuilding, setRebuilding] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    setDismissed(
      localStorage.getItem(LS_KEYS.dnaBannerDismissed(userId)) === "1"
    );
  }, [userId]);

  const handleDismiss = React.useCallback(() => {
    setDismissed(true);
    if (userId) {
      localStorage.setItem(LS_KEYS.dnaBannerDismissed(userId), "1");
    }
  }, [userId]);

  if (!userId || isLoading) return null;

  if (dna && !rebuilding) {
    return (
      <TravelDnaCard dna={dna} onRebuild={() => setRebuilding(true)} className="mb-8" />
    );
  }

  if (dna && rebuilding) {
    return (
      <div className="mb-8">
        <TravelDnaTest
          userId={userId}
          onComplete={() => setRebuilding(false)}
          onDismiss={() => setRebuilding(false)}
        />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-8"
        >
          <TravelDnaTest userId={userId} onDismiss={handleDismiss} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
