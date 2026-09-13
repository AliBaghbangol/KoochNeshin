"use client";

import { create } from "zustand";
import type { TourCategory, Difficulty } from "@/types";

interface FilterState {
  search: string;
  categories: TourCategory[];
  difficulties: Difficulty[];
  provinces: string[];
  minPrice: number;
  maxPrice: number;
  minDuration: number;
  maxDuration: number;
  sortBy: "popular" | "price-asc" | "price-desc" | "rating" | "duration";
  setSearch: (s: string) => void;
  toggleCategory: (c: TourCategory) => void;
  toggleDifficulty: (d: Difficulty) => void;
  toggleProvince: (p: string) => void;
  setPriceRange: (min: number, max: number) => void;
  setDurationRange: (min: number, max: number) => void;
  setSortBy: (s: FilterState["sortBy"]) => void;
  reset: () => void;
}

export const useFilters = create<FilterState>((set) => ({
  search: "",
  categories: [],
  difficulties: [],
  provinces: [],
  minPrice: 0,
  maxPrice: 50000000,
  minDuration: 0,
  maxDuration: 30,
  sortBy: "popular",
  setSearch: (s) => set({ search: s }),
  toggleCategory: (c) =>
    set((s) => ({
      categories: s.categories.includes(c)
        ? s.categories.filter((x) => x !== c)
        : [...s.categories, c],
    })),
  toggleDifficulty: (d) =>
    set((s) => ({
      difficulties: s.difficulties.includes(d)
        ? s.difficulties.filter((x) => x !== d)
        : [...s.difficulties, d],
    })),
  toggleProvince: (p) =>
    set((s) => ({
      provinces: s.provinces.includes(p)
        ? s.provinces.filter((x) => x !== p)
        : [...s.provinces, p],
    })),
  setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max }),
  setDurationRange: (min, max) => set({ minDuration: min, maxDuration: max }),
  setSortBy: (s) => set({ sortBy: s }),
  reset: () =>
    set({
      search: "",
      categories: [],
      difficulties: [],
      provinces: [],
      minPrice: 0,
      maxPrice: 50000000,
      minDuration: 0,
      maxDuration: 30,
      sortBy: "popular",
    }),
}));
