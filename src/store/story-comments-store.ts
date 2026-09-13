"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Story Comments store — Stories enhancement (spec §6).
 *
 * Persisted zustand store for story comments. Each story has its own
 * comment list. Seeded with mock comments for the existing seed stories.
 *
 * Likes: each comment carries an optional `likeCount` (seeded) and the
 * store tracks which comments the current user liked (`likedIds`) so the
 * heart button can toggle persistently.
 *
 * Replies (v21.4): comments may carry `replyToId` + `replyToName`. Replies
 * stay flat in storage (append-only, persisted history untouched) and the
 * UI groups them under their parent — one level deep, like a thread.
 *
 * Delete (v21.5): a comment can be removed by its author or by a
 * leader/admin (moderation). Deletion is permanent in storage but the UI
 * offers an instant undo (toast action) that re-inserts the comment at
 * its original index via `restoreComment`. Replies of a deleted parent
 * survive — they simply render as top-level (existing display rule).
 *
 * TODO(backend): replace with `GET /api/stories/:id/comments` +
 * `POST /api/stories/:id/comments` and a server-side like endpoint.
 */

export interface StoryComment {
  id: string;
  storyId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string; // ISO
  /** how many likes the comment has (seeded + client increments) */
  likeCount?: number;
  /** when set, this comment is a reply to another comment on the same story */
  replyToId?: string;
  /** display name of the comment being replied to (denormalized so the tag
   *  renders even if the parent is deleted later) */
  replyToName?: string;
}

interface StoryCommentsState {
  comments: Record<string, StoryComment[]>; // storyId -> comments
  /** comment ids the current user has liked */
  likedIds: string[];
  addComment: (
    storyId: string,
    text: string,
    author?: { name?: string; avatar?: string },
    replyTo?: { id: string; name: string },
  ) => void;
  /** Remove one comment (author or moderator) — returns nothing; UI keeps a
   *  snapshot for the undo toast. */
  deleteComment: (storyId: string, commentId: string) => void;
  /** Re-insert a previously deleted comment at its original index (undo). */
  restoreComment: (storyId: string, comment: StoryComment, index: number) => void;
  toggleLike: (commentId: string) => void;
  isLiked: (commentId: string) => boolean;
  getComments: (storyId: string) => StoryComment[];
}

const ME = {
  id: "me",
  name: "شما",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces&q=80",
};

const SEED_COMMENTS: Record<string, StoryComment[]> = {
  s1: [
    {
      id: "c1",
      storyId: "s1",
      authorId: "hossein",
      authorName: "حسین موسوی",
      authorAvatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=faces&q=80",
      text: "عکس‌های فوق‌العاده‌ای گرفتی! اون لحظه‌ی صبحانه روی ابرها رو منم هیچ‌وقت فراموش نمی‌کنم.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      likeCount: 4,
    },
    {
      id: "c2",
      storyId: "s1",
      authorId: "negin",
      authorName: "نگار محمدی",
      authorAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces&q=80",
      text: "دقیقاً همین تجربه رو برای دماوند داشتم. خستگی آخرش ارزشش رو داشت!",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      likeCount: 2,
    },
  ],
  s2: [
    {
      id: "c3",
      storyId: "s2",
      authorId: "sara",
      authorName: "سارا کریمی",
      authorAvatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces&q=80",
      text: "ستاره‌های کویر لوت واقعاً بی‌نظیرن. ممنون که این تجربه رو به اشتراک گذاشتی.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      likeCount: 3,
    },
  ],
};

function genId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useStoryComments = create<StoryCommentsState>()(
  persist(
    (set, get) => ({
      comments: SEED_COMMENTS,
      likedIds: [],
      addComment: (storyId, text, author, replyTo) =>
        set((s) => {
          const comment: StoryComment = {
            id: genId(),
            storyId,
            authorId: ME.id,
            authorName: author?.name?.trim() ? author.name : ME.name,
            authorAvatar: author?.avatar || ME.avatar,
            text,
            createdAt: new Date().toISOString(),
            likeCount: 0,
            ...(replyTo ? { replyToId: replyTo.id, replyToName: replyTo.name } : {}),
          };
          const prev = s.comments[storyId] ?? [];
          return {
            comments: { ...s.comments, [storyId]: [...prev, comment] },
          };
        }),
      deleteComment: (storyId, commentId) =>
        set((s) => ({
          comments: {
            ...s.comments,
            [storyId]: (s.comments[storyId] ?? []).filter(
              (c) => c.id !== commentId,
            ),
          },
        })),
      restoreComment: (storyId, comment, index) =>
        set((s) => {
          const list = s.comments[storyId] ?? [];
          if (list.some((c) => c.id === comment.id)) return s; // already restored
          const next = [...list];
          next.splice(Math.min(index, next.length), 0, comment);
          return { comments: { ...s.comments, [storyId]: next } };
        }),
      toggleLike: (commentId) =>
        set((s) => {
          const liked = s.likedIds.includes(commentId);
          const likedIds = liked
            ? s.likedIds.filter((id) => id !== commentId)
            : [...s.likedIds, commentId];
          // likeCount lives on the comment itself — update it everywhere
          const comments = Object.fromEntries(
            Object.entries(s.comments).map(([storyId, list]) => [
              storyId,
              list.map((c) =>
                c.id === commentId
                  ? {
                      ...c,
                      likeCount: Math.max(
                        0,
                        (c.likeCount ?? 0) + (liked ? -1 : 1),
                      ),
                    }
                  : c,
              ),
            ]),
          );
          return { likedIds, comments };
        }),
      isLiked: (commentId) => get().likedIds.includes(commentId),
      getComments: (storyId) => get().comments[storyId] ?? [],
    }),
    { name: "koch-story-comments-v1" },
  ),
);
