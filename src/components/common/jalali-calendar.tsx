"use client";

import * as React from "react";
import { DayButton as RdpDayButton, getDefaultClassNames } from "react-day-picker";
import { DayPicker as PersianDayPicker } from "react-day-picker/persian";
import "react-day-picker/style.css";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * JalaliCalendar — the platform's shared true-Persian (Jalali) RTL calendar.
 *
 * Wraps `react-day-picker/persian` (faIR Jalali locale, Eastern-Arabic
 * numerals, RTL) with the shadcn visual language and the platform fixes:
 *  - selected day rendered via inline style (react-day-picker's unlayered
 *    stylesheet would otherwise override any @layer utility background)
 *  - data-selected-single attributes (v9 sets no `aria-selected` on buttons)
 *  - RTL nav chevron rotation, 32px cells on desktop / 44px touch cells on
 *    mobile (max-sm)
 *
 * All DayPicker props (mode, selected, onSelect, disabled, defaultMonth,
 * modifiers, modifiersClassNames, …) pass through.
 */

const DAY_CELL = String.raw`[--cell-size:--spacing(8)] max-sm:[--cell-size:--spacing(11)]`;
// react-day-picker auto-rotates nav chevrons under RTL via its own stylesheet —
// so we must NOT rotate them again (a second rotate-180 would flip them back
// and put the month arrows on the wrong sides — the «فلش چپ/راست اشتباهه» bug).
// Its stylesheet is UNLAYERED (beats any @layer utility), so the brand colors
// (--rdp-accent-color: blue!) are overridden via inline style on the root —
// the same trick the selected-day styling already uses.
const RDP_THEME_VARS = {
  "--rdp-accent-color": "var(--primary)",
  "--rdp-accent-background-color": "color-mix(in srgb, var(--primary) 12%, transparent)",
  "--rdp-today-color": "var(--primary)",
} as React.CSSProperties;

/**
 * Day button with shadcn-style data attributes — react-day-picker v9 does not
 * set `aria-selected` on day buttons, so selected styling targets
 * `data-[selected-single]` (same approach as the shadcn ui/calendar wrapper).
 *
 * react-day-picker's DayButton type omits `ref`, but at runtime (React 19)
 * a ref flows through as a prop and lands on the rendered <button> — our
 * focus effect and the rdp internal focus effect are equivalent, so taking
 * over the ref is safe. The cast below makes that contract explicit.
 */
const RdpDayButtonWithRef = RdpDayButton as React.FC<
  React.ComponentProps<typeof RdpDayButton> & {
    ref?: React.Ref<HTMLButtonElement>;
  }
>;

export function SelectedAwareDayButton({
  className,
  style,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof RdpDayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  // Selected styling must be inline: react-day-picker's own stylesheet is
  // unlayered and would otherwise override any @layer utility background.
  const selectedStyle: React.CSSProperties | undefined = modifiers.selected
    ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }
    : undefined;
  return (
    <RdpDayButtonWithRef
      ref={ref}
      day={day}
      modifiers={modifiers}
      data-selected-single={modifiers.selected ? "true" : "false"}
      style={{ ...style, ...selectedStyle }}
      className={cn(
        className,
        "data-[selected-single=true]:font-bold data-[selected-single=true]:opacity-100"
      )}
      {...props}
    />
  );
}

type JalaliCalendarProps = React.ComponentProps<typeof PersianDayPicker>;

export function JalaliCalendar({
  className,
  classNames,
  components,
  ...props
}: JalaliCalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <PersianDayPicker
      dir="rtl"
      style={RDP_THEME_VARS}
      className={cn("p-3 pt-2", DAY_CELL, className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col", defaultClassNames.months),
        month: cn("flex w-full flex-col", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        caption_label: cn("select-none text-sm font-bold", defaultClassNames.caption_label),
        month_grid: cn("mt-3 w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 select-none rounded-md text-[0.75rem] font-medium text-muted-foreground",
          defaultClassNames.weekday
        ),
        week: cn("mt-1.5 flex w-full", defaultClassNames.week),
        day: cn("relative aspect-square h-full w-full select-none p-0 text-center", defaultClassNames.day),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-(--cell-size) p-0 text-sm font-normal text-foreground hover:bg-accent hover:text-accent-foreground",
          defaultClassNames.day_button
        ),
        today: cn("rounded-md underline decoration-gold decoration-2 underline-offset-2", defaultClassNames.today),
        outside: cn("text-muted-foreground/50", defaultClassNames.outside),
        disabled: cn("text-muted-foreground/40 line-through decoration-transparent", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{ DayButton: SelectedAwareDayButton, ...components }}
      {...props}
    />
  );
}
