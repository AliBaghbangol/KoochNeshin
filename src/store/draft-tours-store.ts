"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DraftTour {
  id: string;
  leaderId: string; // ID of the leader who created this draft — used by useMyTours()
  title: string;
  destination: string;
  province: string;
  category: string;
  difficulty: string;
  duration: number;
  capacity: number;
  price: number;
  discountPrice?: number;
  startDate: string;
  description: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  facilities: string[];
  itinerary: {
    day: number;
    title: string;
    description: string;
    elevation?: number;
    distance?: number;
    meals: string[];
  }[];
  status: "draft" | "active";
  createdAt: string;
}

interface DraftToursState {
  tours: DraftTour[];
  addTour: (tour: Omit<DraftTour, "id" | "createdAt">) => string;
  updateTour: (id: string, updates: Partial<DraftTour>) => void;
  removeTour: (id: string) => void;
  clearAll: () => void;
  count: () => number;
}

function genId() {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useDraftTours = create<DraftToursState>()(
  persist(
    (set, get) => ({
      tours: [],
      addTour: (tour) => {
        const id = genId();
        set((s) => ({
          tours: [
            { ...tour, id, createdAt: new Date().toISOString() },
            ...s.tours,
          ],
        }));
        return id;
      },
      updateTour: (id, updates) =>
        set((s) => ({
          tours: s.tours.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      removeTour: (id) =>
        set((s) => ({ tours: s.tours.filter((t) => t.id !== id) })),
      clearAll: () => set({ tours: [] }),
      count: () => get().tours.length,
    }),
    { name: "kochneshin-draft-tours" }
  )
);
