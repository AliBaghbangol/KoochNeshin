"use client";

/**
 * Stories store — spec §6.
 * Holds the local stories feed + draft composer state. Persisted so the
 * user's own published stories survive a refresh.
 *
 * TODO(backend): replace seed + add/publish with real API calls:
 *   - GET  /api/stories?tour=...&page=...
 *   - POST /api/stories            (publish)
 *   - POST /api/stories/:id/like
 *   - POST /api/stories/:id/report
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TravelStory, StoryVisibility } from "@/types/story";

interface StoriesState {
  stories: TravelStory[];
  draft: {
    tourId?: string;
    tourTitle?: string;
    coverImageUrl?: string;
    gallery: string[];
    caption: string;
    location?: string;
    rating?: number;
    visibility: StoryVisibility;
  };
  setDraft: (patch: Partial<StoriesState["draft"]>) => void;
  resetDraft: () => void;
  publishDraft: (author: { id: string; name: string; avatar?: string }) => TravelStory;
  toggleLike: (id: string) => void;
  toggleReaction: (id: string, emoji: string) => void;
}

const SEED: TravelStory[] = [
  {
    id: "s1",
    tourId: "t1",
    tourTitle: "صعود فصلی قله دماوند",
    authorId: "sara",
    authorName: "سارا کریمی",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&h=600&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&h=600&fit=crop&q=80",
    ],
    caption:
      "صبحانه روی ابرها. بالاخره به قله رسیدیم — خستگی‌ام را فراموش کردم.",
    location: "دماوند، مازندران",
    stats: { photosCount: 14, distanceKm: 8.2, elevationM: 1940 },
    rating: 5,
    visibility: "public",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    likesCount: 142,
    commentsCount: 12,
  },
  {
    id: "s2",
    tourId: "t9",
    tourTitle: "کویر دشت لوت — کمپینگ ستاره‌ای",
    authorId: "hossein",
    authorName: "حسین موسوی",
    authorAvatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=faces&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1532978879514-6cae1cdf5458?w=800&h=600&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1532978879514-6cae1cdf5458?w=800&h=600&fit=crop&q=80",
    ],
    caption: "شبی پر از ستاره در قلب کویر لوت. صحنه‌ای که با هیچ دوربینی نمی‌گنجد.",
    location: "دشت لوت، کرمان",
    stats: { photosCount: 22, distanceKm: 14, elevationM: 280 },
    rating: 5,
    visibility: "public",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    likesCount: 89,
    commentsCount: 5,
  },
  {
    id: "s3",
    tourId: "t4",
    tourTitle: "جنگل ابر — طبیعت‌گردی مه‌آلود",
    authorId: "negin",
    authorName: "نگار محمدی",
    authorAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces&q=80",
    coverImageUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop&q=80",
    ],
    caption: "مه بین درخت‌ها مثل فیلم بود. یک روز کامل گشتیم.",
    location: "جنگل ابر، گلستان",
    stats: { photosCount: 9, distanceKm: 4.5, elevationM: 350 },
    rating: 4,
    visibility: "public",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    likesCount: 56,
    commentsCount: 3,
  },
];

const EMPTY_DRAFT: StoriesState["draft"] = {
  gallery: [],
  caption: "",
  visibility: "public",
};

function genId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useStories = create<StoriesState>()(
  persist(
    (set, get) => ({
      stories: SEED,
      draft: { ...EMPTY_DRAFT },
      setDraft: (patch) =>
        set((s) => ({ draft: { ...s.draft, ...patch } })),
      resetDraft: () => set({ draft: { ...EMPTY_DRAFT } }),
      publishDraft: (author) => {
        const d = get().draft;
        const story: TravelStory = {
          id: genId(),
          tourId: d.tourId,
          tourTitle: d.tourTitle,
          authorId: author.id,
          authorName: author.name,
          authorAvatar: author.avatar,
          coverImageUrl:
            d.coverImageUrl ?? d.gallery[0] ?? "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80",
          gallery: d.gallery,
          caption: d.caption,
          location: d.location,
          stats: {
            photosCount: d.gallery.length,
          },
          rating: d.rating,
          visibility: d.visibility,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          commentsCount: 0,
        };
        set((s) => ({
          stories: [story, ...s.stories],
          draft: { ...EMPTY_DRAFT },
        }));
        return story;
      },
      toggleLike: (id) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === id
              ? {
                  ...st,
                  likedByMe: !st.likedByMe,
                  likesCount: st.likesCount + (st.likedByMe ? -1 : 1),
                }
              : st,
          ),
        })),
      toggleReaction: (id, emoji) =>
        set((s) => ({
          stories: s.stories.map((st) => {
            if (st.id !== id) return st;
            const prev = st.reactions ?? {};
            const entry = prev[emoji] ?? { count: 0, reactedByMe: false };
            const nextEntry = entry.reactedByMe
              ? { count: Math.max(0, entry.count - 1), reactedByMe: false }
              : { count: entry.count + 1, reactedByMe: true };
            const next = { ...prev, [emoji]: nextEntry };
            if (nextEntry.count === 0) delete next[emoji];
            return { ...st, reactions: next };
          }),
        })),
    }),
    {
      name: "koch-stories-v1",
      partialize: (s) => ({ stories: s.stories }),
    },
  ),
);
