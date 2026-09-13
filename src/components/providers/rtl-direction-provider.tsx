"use client";

import * as React from "react";
import { DirectionProvider } from "@radix-ui/react-direction";

/**
 * Global RTL direction for ALL Radix primitives.
 *
 * Without this, Radix defaults to "ltr" (see @radix-ui/react-direction
 * useDirection: localDir || globalDir || "ltr") even though the app is
 * Persian/RTL. That made:
 *   - Sliders grow left→right (opposite of the Persian reading direction)
 *   - Tabs/Accordion/Select roving focus start on the wrong side
 *
 * With dir="rtl" globally:
 *   - Slider: min on the RIGHT, dragging toward the LEFT increases the value
 *   - every Radix widget agrees with the RTL layout.
 */
export function RTLDirectionProvider({ children }: { children: React.ReactNode }) {
  return <DirectionProvider dir="rtl">{children}</DirectionProvider>;
}
