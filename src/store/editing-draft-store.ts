"use client";

import { create } from "zustand";

interface EditingState {
  editingId: string | null;
  setEditing: (id: string | null) => void;
}

export const useEditingDraft = create<EditingState>((set) => ({
  editingId: null,
  setEditing: (id) => set({ editingId: id }),
}));
