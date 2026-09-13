"use client";

import * as React from "react";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronDown,
  Clock3,
  Info,
} from "lucide-react";
import { addDays, format, isSameDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { JalaliCalendar } from "@/components/common/jalali-calendar";
import { cn } from "@/lib/utils";
import { toFa, toPersianDate, toPersianShortDate } from "@/lib/format";

/**
 * DepartureDatePicker — Jalali (Persian) departure-date picker for the tour
 * BookingBox. Replaces the previous single-option Select with a real RTL
 * Jalali calendar (`react-day-picker/persian`: faIR locale, Persian numerals)
 * in which only the available departure days are enabled.
 *
 * Departures: the tour's real startDate plus two weekly alternates
 * («حرکت‌های پیشِ‌رو»). Default value stays the tour's own startDate, so the
 * previous default behavior is preserved.
 */

export function DepartureDatePicker({
  startDate,
  durationDays,
  value,
  onChange,
  className,
}: {
  startDate: string;
  /** Tour length in days — used to show the planned return date. */
  durationDays: number;
  /** Currently selected departure (ISO `yyyy-MM-dd`). */
  value: string;
  onChange: (iso: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  // The popover is tall (~520px): pick the side with enough room, and cap its
  // height to the chosen slot (internal scroll) so the header never clips —
  // Radix alone leaves both-side overflows unclamped.
  const [placement, setPlacement] = React.useState<"bottom" | "top">("bottom");
  const [slotHeight, setSlotHeight] = React.useState<number | undefined>(undefined);

  const updatePlacement = React.useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect || typeof window === "undefined") return;
    const ESTIMATED = 520;
    const MARGIN = 20;
    const below = window.innerHeight - rect.bottom - MARGIN;
    const above = rect.top - MARGIN;
    if (below >= Math.min(ESTIMATED, 300) || below >= above) {
      setPlacement("bottom");
      setSlotHeight(Math.max(below, 280));
    } else {
      setPlacement("top");
      setSlotHeight(Math.max(above, 280));
    }
  }, []);

  const departures = React.useMemo(() => {
    const base = new Date(startDate);
    return [startDate, format(addDays(base, 7), "yyyy-MM-dd"), format(addDays(base, 14), "yyyy-MM-dd")];
  }, [startDate]);

  const selected = React.useMemo(() => new Date(value), [value]);

  const returnDate = React.useMemo(() => {
    if (!Number.isFinite(selected.getTime())) return null;
    return format(addDays(selected, Math.max(0, durationDays - 1)), "yyyy-MM-dd");
  }, [selected, durationDays]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      // Clicking the already-selected day re-enters single-mode with an
      // “undefined” (deselect) payload — treat it as “confirm & close”.
      setOpen(false);
      return;
    }
    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) updatePlacement();
        setOpen(o);
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "border-input bg-background flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            "h-9 max-sm:h-11",
            open && "border-ring ring-[3px] ring-ring/50",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate font-medium">{toPersianDate(value)}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={placement}
        align="start"
        sideOffset={6}
        collisionPadding={12}
        avoidCollisions={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={{ maxHeight: slotHeight }}
        className="w-auto overflow-y-auto p-0"
      >
        <div className="flex items-center justify-between gap-3 px-3 pt-3">
          <p className="text-xs font-bold">انتخاب تاریخ حرکت</p>
          <span className="flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold text-emerald">
            <Clock3 className="h-3 w-3" />
            {toFa(durationDays)} روزه
          </span>
        </div>
        <JalaliCalendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          disabled={(date) => !departures.some((d) => isSameDay(new Date(d), date))}
          className="pt-2"
        />
        <div className="space-y-2.5 border-t border-border/60 p-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="تاریخ‌های حرکت پیش‌رو">
            {departures.map((dep) => {
              const active = dep === value;
              return (
                <button
                  key={dep}
                  type="button"
                  onClick={() => {
                    onChange(dep);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors max-sm:h-10",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-secondary/60 text-foreground/80 hover:border-primary/50 hover:text-primary"
                  )}
                >
                  <CalendarDays className="h-3 w-3" />
                  {toPersianShortDate(dep)}
                </button>
              );
            })}
          </div>
          <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 text-gold" />
            روزهای روشن در تقویم، تاریخ‌های حرکت این تور هستند.
          </p>
          {returnDate && (
            <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <CalendarCheck2 className="h-3.5 w-3.5 shrink-0 text-emerald" />
              بازگشت برنامه‌ریزی‌شده: {toPersianDate(returnDate)}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
