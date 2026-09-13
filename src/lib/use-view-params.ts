"use client";

import { useParams, useSearchParams } from "next/navigation";

/**
 * Unified hook to read route params from URL.
 * Combines Next.js path params ([id]) and search params (?destination=X).
 *
 * Drop-in replacement for `useNav(s => s.params)`.
 *
 * Robust against:
 *  - `useSearchParams()` returning `null` during SSR / static rendering
 *    (without this guard, calling `.forEach` on null throws a TypeError
 *    that escapes the <Suspense> boundary and crashes the page).
 *  - `useParams()` returning `null` on first client render before Next.js
 *    has hydrated the route context.
 *  - Array params (catch-all routes like `[...slug]`).
 */
export function useViewParams(): Record<string, string> {
  const pathParams = useParams();
  const searchParams = useSearchParams();

  const result: Record<string, string> = {};

  // Path params (e.g., /tours/[id] → { id: "t1" })
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      if (typeof value === "string") {
        result[key] = value;
      } else if (Array.isArray(value)) {
        result[key] = value[0] ?? "";
      }
    });
  }

  // Search params (e.g., /tours?destination=X → { destination: "X" })
  // `useSearchParams()` returns null during static rendering — guard it.
  if (searchParams) {
    searchParams.forEach((value, key) => {
      result[key] = value;
    });
  }

  return result;
}
