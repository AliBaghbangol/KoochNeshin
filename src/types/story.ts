// src/types/story.ts
/**
 * Travel Story types — spec §6 of KOCHNESHIN-V19-FRONTEND-DEV-SPEC-PART2.md.
 *
 * Frontend-only for now: image upload is mocked with `URL.createObjectURL`
 * (preview only, no real upload). Backend will provide CDN-backed URLs.
 */

export type StoryVisibility = "public" | "followers" | "trip_members" | "private";

export interface TravelStory {
  id: string;
  tripId?: string;
  tourId?: string;
  tourTitle?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  /** عکس کاور — می‌تواند blob URL یا URL واقعی باشد */
  coverImageUrl: string;
  gallery: string[];
  caption: string;
  location?: string;
  stats?: {
    photosCount: number;
    distanceKm?: number;
    elevationM?: number;
  };
  rating?: number; // 1-5
  visibility: StoryVisibility;
  createdAt: string; // ISO
  likesCount: number;
  commentsCount: number;
  /** آیا کاربر فعلی لایک کرده */
  likedByMe?: boolean;
  /**
   * Emoji reactions — each emoji maps to a count + flag whether the
   * current user has reacted with it.
   * Non-destructive addition: older code without this field still works
   * (treated as no reactions).
   */
  reactions?: Record<string, { count: number; reactedByMe?: boolean }>;
}
