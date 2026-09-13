"use client";

import { create } from "zustand";
import type { TripPlannerInput, SocialMode, WeatherPreference } from "@/types/planner";
import type { TourCategory, Difficulty } from "@/types";

/**
 * UI state فرم برنامه‌ریز (بخش ۶ سند v19) — فقط state موقت؛
 * نتیجه از data-layer (use-planner) می‌آید.
 */

interface PlannerState {
  step: number; // 0..5 (۶ مرحله فرم) — نتیجه با hasResult کنترل می‌شود
  hasResult: boolean;
  budgetMin: number;
  budgetMax: number;
  durationDays: number;
  categories: TourCategory[];
  difficulty?: Difficulty;
  dateFrom?: string;
  socialMode: SocialMode;
  camping: boolean;
  weatherPreference: WeatherPreference;
  text: string;
  setStep: (s: number) => void;
  setBudget: (min: number, max: number) => void;
  setDurationDays: (d: number) => void;
  toggleCategory: (c: TourCategory) => void;
  setDifficulty: (d?: Difficulty) => void;
  setDateFrom: (iso?: string) => void;
  setSocialMode: (m: SocialMode) => void;
  setCamping: (v: boolean) => void;
  setWeatherPreference: (w: WeatherPreference) => void;
  setText: (t: string) => void;
  buildInput: () => TripPlannerInput;
  markResult: (v: boolean) => void;
  reset: () => void;
}

const BUDGET_FLOOR = 500_000;
const BUDGET_CEIL = 100_000_000;

const initial = {
  step: 0,
  hasResult: false,
  budgetMin: 1_500_000,
  budgetMax: 3_000_000,
  durationDays: 3,
  categories: [] as TourCategory[],
  difficulty: undefined as Difficulty | undefined,
  dateFrom: undefined as string | undefined,
  socialMode: "group" as SocialMode,
  camping: false,
  weatherPreference: "any" as WeatherPreference,
  text: "",
};

export const usePlanner = create<PlannerState>((set, get) => ({
  ...initial,
  setStep: (step) => set({ step }),
  setBudget: (budgetMin, budgetMax) => set({ budgetMin, budgetMax }),
  setDurationDays: (durationDays) => set({ durationDays }),
  toggleCategory: (c) =>
    set((s) => ({
      categories: s.categories.includes(c)
        ? s.categories.filter((x) => x !== c)
        : [...s.categories, c],
    })),
  setDifficulty: (difficulty) => set({ difficulty }),
  setDateFrom: (dateFrom) => set({ dateFrom }),
  setSocialMode: (socialMode) => set({ socialMode }),
  setCamping: (camping) => set({ camping }),
  setWeatherPreference: (weatherPreference) => set({ weatherPreference }),
  setText: (text) => set({ text }),
  buildInput: () => {
    const s = get();
    return {
      budgetMin: s.budgetMin,
      budgetMax: s.budgetMax,
      durationDays: s.durationDays,
      categories: s.categories,
      difficulty: s.difficulty,
      dateFrom: s.dateFrom,
      socialMode: s.socialMode,
      camping: s.camping,
      weatherPreference: s.weatherPreference,
      text: s.text.trim() || undefined,
    };
  },
  markResult: (hasResult) => set({ hasResult }),
  reset: () => set({ ...initial }),
}));

export { BUDGET_FLOOR, BUDGET_CEIL };
