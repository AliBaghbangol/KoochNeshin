"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ViewName } from "@/store/nav-store";

/**
 * Maps a view name + params to a URL path.
 * This is the single source of truth for URL structure.
 */
export function viewToPath(view: string, params?: Record<string, string>): string {
  switch (view as ViewName) {
    case "home":
      return "/";
    case "tours": {
      const sp = new URLSearchParams();
      if (params?.destination) sp.set("destination", params.destination);
      if (params?.province) sp.set("province", params.province);
      if (params?.category) sp.set("category", params.category);
      const qs = sp.toString();
      return qs ? `/tours?${qs}` : "/tours";
    }
    case "tour-detail":
      return `/tours/${params?.id ?? ""}`;
    case "equipment":
      return "/equipment";
    case "product-detail":
      return `/equipment/${params?.id ?? ""}`;
    case "leader-profile":
      return `/leader/${params?.id ?? ""}`;
    case "leader-dashboard":
      return "/leader/dashboard";
    case "seller-dashboard":
      return "/seller/dashboard";
    case "admin-dashboard":
      return "/admin/dashboard";
    case "checkout":
      return "/checkout";
    case "user-dashboard":
      // Optional tab deep-link: go("user-dashboard", { tab: "settings" })
      return params?.tab
        ? `/dashboard?tab=${encodeURIComponent(params.tab)}`
        : "/dashboard";
    case "blog":
      return "/blog";
    case "blog-detail":
      return `/blog/${params?.id ?? ""}`;
    case "about":
    case "contact":
      return "/about";
    case "destinations":
      return "/destinations";
    case "category":
      return `/category/${params?.category ?? ""}`;
    case "planner":
      return "/planner";
    case "trip-room":
      return `/trips/${params?.bookingId ?? ""}/room`;
    case "live-trip":
      return `/trips/${params?.bookingId ?? ""}/live`;
    case "stories":
      return "/stories";
    case "story-detail":
      return `/stories/${params?.id ?? ""}`;
    case "safety-center":
      return `/safety`;
    case "buddies":
      return `/buddies`;
    default:
      return "/";
  }
}

/**
 * Drop-in replacement for `useNav().go()`.
 * Uses Next.js router for real URL-based navigation.
 *
 * Usage:
 *   const go = useGo();
 *   go("tour-detail", { id: "t1" });  // navigates to /tours/t1
 */
export function useGo() {
  const router = useRouter();
  return useCallback(
    (view: string, params?: Record<string, string>) => {
      const path = viewToPath(view, params);
      router.push(path);
    },
    [router]
  );
}
