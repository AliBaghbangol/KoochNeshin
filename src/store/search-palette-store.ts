"use client";

import { create } from "zustand";

interface SearchPaletteState {
  open: boolean;
  query: string;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setQuery: (q: string) => void;
}

export const useSearchPalette = create<SearchPaletteState>((set) => ({
  open: false,
  query: "",
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  setQuery: (q) => set({ query: q }),
}));
