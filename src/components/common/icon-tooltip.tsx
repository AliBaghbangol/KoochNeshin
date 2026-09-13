"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

/**
 * IconTooltip — a thin wrapper around Radix Tooltip for icon-only buttons.
 *
 * Usage:
 *   <IconTooltip label="افزودن به علاقه‌مندی">
 *     <button>...<Heart/></button>
 *   </IconTooltip>
 *
 * The child must be a focusable element (button, a, etc.) for keyboard
 * users to trigger the tooltip. The tooltip appears on hover and focus.
 *
 * Styling is inherited from `TooltipContent` (forest glassmorphism with
 * gold border + cream text + arrow). Override via `contentClassName` if
 * a different look is needed (e.g. on dark backgrounds).
 */
export function IconTooltip({
  label,
  side = "top",
  align = "center",
  children,
  contentClassName,
  delayDuration,
}: {
  label: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  children: React.ReactElement;
  contentClassName?: string;
  delayDuration?: number;
}) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={contentClassName}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
