"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Story Bookmarks store — Stories enhancement (spec §6).
 *
 * Lets users bookmark stories to read later. Persisted to localStorage so
 * bookmarks survive refreshes. The bookmarks appear as a filterable
 * section in the stories feed.
 *
 * TODO(backend): sync bookmarks to `POST /api/users/me/bookmarks` so they
 * are available across devices.
 */

interface StoryBookmarksState {
  bookmarkedIds: string[];
  toggleBookmark: (storyId: string) => void;
  isBookmarked: (storyId: string) => boolean;
  clearAll: () => void;
}

export const useStoryBookmarks = create<StoryBookmarksState>()(
  persist(
    (set, get) => ({
      bookmarkedIds: [],
      toggleBookmark: (storyId) =>
        set((s) => ({
          bookmarkedIds: s.bookmarkedIds.includes(storyId)
            ? s.bookmarkedIds.filter((id) => id !== storyId)
            : [...s.bookmarkedIds, storyId],
        })),
      isBookmarked: (storyId) => get().bookmarkedIds.includes(storyId),
      clearAll: () => set({ bookmarkedIds: [] }),
    }),
    { name: "koch-story-bookmarks-v1" },
  ),
);
