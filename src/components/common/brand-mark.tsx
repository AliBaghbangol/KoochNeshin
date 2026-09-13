"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * KochNeshin brand mark (v30 redesign) — the Iranian nomad black tent
 * (سیاه‌چادر) with its glowing hearth, Damavand-like twin peaks and a
 * rising golden sun on the emerald app tile.
 * Mirrors public/logo.svg — that file stays the single raster source
 * (favicons / PWA icons are rendered from it), this inline component is
 * the always-crisp vector twin used across the UI.
 */
export function BrandMark({ className }: { className?: string }) {
  const uid = React.useId().replace(/:/g, "");
  const tile = `k-tile-${uid}`;
  const sun = `k-sun-${uid}`;
  const hearth = `k-hearth-${uid}`;
  const disc = `k-disc-${uid}`;

  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label="لوگوی کوچ‌نشین"
      className={cn("block", className)}
    >
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#158460" />
          <stop offset="0.55" stopColor="#0f6b4a" />
          <stop offset="1" stopColor="#0a4f37" />
        </linearGradient>
        <radialGradient id={sun} cx="0.35" cy="0.35" r="1">
          <stop offset="0" stopColor="#f0cd6d" />
          <stop offset="1" stopColor="#d9a94e" />
        </radialGradient>
        <linearGradient id={hearth} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#e8862c" />
          <stop offset="1" stopColor="#f4c65a" />
        </linearGradient>
        <clipPath id={disc}>
          <circle cx="256" cy="256" r="188" />
        </clipPath>
      </defs>

      {/* app tile */}
      <rect width="512" height="512" rx="118" fill={`url(#${tile})`} />
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="104"
        fill="none"
        stroke="#f7f3ec"
        strokeOpacity="0.14"
        strokeWidth="4"
      />

      {/* cream day-sky disc */}
      <circle cx="256" cy="256" r="188" fill="#f7f3ec" />

      <g clipPath={`url(#${disc})`}>
        {/* rising sun in the col between the peaks */}
        <circle cx="252" cy="164" r="36" fill={`url(#${sun})`} />

        {/* back peak — softer sage */}
        <path d="M28 386 L172 138 L316 386 Z" fill="#b7cfc0" />
        <path d="M172 138 L194 178 L172 168 L150 178 Z" fill="#ffffff" />

        {/* front peak — brand emerald */}
        <path d="M162 386 L330 168 L498 386 Z" fill="#2d8f6f" />
        <path d="M330 168 L354 212 L330 200 L306 212 Z" fill="#ffffff" />

        {/* valley ground — warm sand */}
        <rect x="20" y="378" width="472" height="100" fill="#d4c4a0" />
        <rect x="20" y="378" width="472" height="10" fill="#c3b18b" opacity="0.55" />

        {/* migration trail winding to the hearth */}
        <path
          d="M240 462 C 218 436, 294 424, 264 400"
          fill="none"
          stroke="#b99d68"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* سیاه‌چادر — the nomad black tent, sagging ridge between two poles */}
        <path
          d="M104 396
             L142 292
             C 180 320, 224 334, 264 334
             C 304 334, 348 320, 386 296
             L424 396
             C 350 408, 178 408, 104 396 Z"
          fill="#12241d"
        />
        {/* pole tips */}
        <rect x="138" y="276" width="7" height="22" rx="3.5" fill="#12241d" />
        <rect x="382" y="280" width="7" height="22" rx="3.5" fill="#12241d" />

        {/* glowing hearth at the entrance */}
        <path
          d="M230 398 L230 362 Q264 326 298 362 L298 398 Z"
          fill={`url(#${hearth})`}
        />
      </g>
    </svg>
  );
}
