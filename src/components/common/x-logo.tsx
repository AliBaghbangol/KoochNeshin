"use client";

import { cn } from "@/lib/utils";

/**
 * The X (formerly Twitter) logo as an inline SVG — lucide-react still ships
 * the old bird, so we draw the real X wordmark ourselves.
 */
export function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 1227"
      fill="currentColor"
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
    >
      <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.163 519.284Zm-144.998 168.544-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.828Z" />
    </svg>
  );
}
