"use client";

import * as React from "react";
import { CalendarDays, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { JalaliCalendar } from "@/components/common/jalali-calendar";
import { usePlanner } from "@/store/planner-store";
import { toPersianShortDate } from "@/lib/format";

/** مرحله ۵ — زمان ترجیحی (تاریخ حرکت تقریبی — قابل رد شدن) */
export function PlannerStepDate() {
  const dateFrom = usePlanner((s) => s.dateFrom);
  const setDateFrom = usePlanner((s) => s.setDateFrom);
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => (dateFrom ? new Date(dateFrom) : undefined),
    [dateFrom]
  );

  return (
    <div>
      <h3 className="text-lg font-extrabold">کی می‌خواهی بری؟</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        یک تاریخ تقریبی حرکت انتخاب کن — یا رد شو برای هر زمانی.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-h-11 gap-2 rounded-2xl">
              <CalendarDays className="h-4 w-4" aria-hidden />
              {dateFrom ? toPersianShortDate(dateFrom) : "انتخاب تاریخ"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <JalaliCalendar
              mode="single"
              selected={selected}
              onSelect={(d) => {
                if (d) {
                  // ISO yyyy-MM-dd محلی
                  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  setDateFrom(iso);
                }
                setOpen(false);
              }}
              disabled={(date) => date < new Date()}
              defaultMonth={selected}
            />
          </PopoverContent>
        </Popover>
        {dateFrom && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground"
            onClick={() => setDateFrom(undefined)}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            حذف تاریخ
          </Button>
        )}
      </div>
      {dateFrom && (
        <p className="mt-3 rounded-2xl bg-emerald/5 p-3 text-xs text-emerald">
          برنامه بر اساس نزدیک‌ترین حرکت به {toPersianShortDate(dateFrom)} چیده می‌شود.
        </p>
      )}
    </div>
  );
}
