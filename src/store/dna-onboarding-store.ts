"use client";

import { create } from "zustand";
import type { TravelDNAAnswers } from "@/types/dna";

/**
 * UI-state کوییز Travel DNA — فقط state موقت فرم (بخش ۳ سند v19).
 * persist نمی‌شود؛ نتیجه نهایی در localStorage از طریق data-layer ذخیده می‌شود.
 */

interface DnaOnboardingState {
  open: boolean;
  step: number; // 0..5 (۶ سوال) — 6 = نمایش نتیجه
  draft: TravelDNAAnswers;
  /** the tour the user was viewing when they started the quiz — lets the
   *  result screen offer «بازگشت به همان تور و مقایسه» (user request). */
  returnTourId: string | null;
  openQuiz: () => void;
  closeQuiz: () => void;
  setStep: (step: number) => void;
  setAnswer: (key: keyof TravelDNAAnswers, value: number) => void;
  setReturnTourId: (id: string | null) => void;
  reset: () => void;
}

const EMPTY_ANSWERS: TravelDNAAnswers = {
  earlyMorning: 3,
  adventure: 3,
  campingVsHotel: 3,
  soloVsGroup: 3,
  viewVsHistory: 3,
  budgetSensitivity: 3,
};

export const useDnaOnboarding = create<DnaOnboardingState>((set) => ({
  open: false,
  step: 0,
  draft: { ...EMPTY_ANSWERS },
  returnTourId: null,
  openQuiz: () => set({ open: true, step: 0, draft: { ...EMPTY_ANSWERS } }),
  closeQuiz: () => set({ open: false }),
  setStep: (step) => set({ step }),
  setAnswer: (key, value) =>
    set((s) => ({ draft: { ...s.draft, [key]: value } })),
  setReturnTourId: (id) => set({ returnTourId: id }),
  reset: () => set({ open: false, step: 0, draft: { ...EMPTY_ANSWERS } }),
}));
