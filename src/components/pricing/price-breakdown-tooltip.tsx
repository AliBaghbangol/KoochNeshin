"use client";

import * as React from "react";
import { Flame, TrendingUp, TrendingDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DynamicPriceInfo, PriceReasonTag } from "@/types/pricing";
import { formatCurrency, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

const REASON_LABEL: Record<PriceReasonTag, string> = {
  high_demand: "تقاضای بالا",
  low_capacity: "ظرفیت کم",
  near_departure: "نزدیک به حرکت",
  early_bird: "خرید زودهنگام",
};

/**
 * Demand badge — small inline indicator shown on tour cards when a
 * dynamic price info exists (spec §7). Falls back to nothing when null.
 *
 * The actual price engine lives in the backend; this component only renders
 * the data it receives.
 */
export function DemandBadge({ info }: { info: DynamicPriceInfo | null }) {
  if (!info) return null;
  const up = (info.deltaPercent ?? 0) >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        up ? "bg-sunset/15 text-sunset" : "bg-emerald/10 text-emerald",
      )}
    >
      {up ? <Flame className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {info.reasonTags.slice(0, 1).map((r) => REASON_LABEL[r]).join("، ")}
      {up && info.deltaPercent
        ? ` +${toFa(info.deltaPercent)}٪`
        : !up && info.deltaPercent
          ? ` ${toFa(info.deltaPercent)}٪`
          : ""}
    </span>
  );
}

/**
 * Price breakdown tooltip — shows up on hover over the price (spec §7).
 * Shows base price, delta reason and the backend-provided explanation.
 */
export function PriceBreakdownTooltip({
  info,
  children,
}: {
  info: DynamicPriceInfo;
  children: React.ReactNode;
}) {
  const up = (info.deltaPercent ?? 0) >= 0;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help items-center gap-1">
            {children}
            <Info className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] p-3 text-right">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-muted-foreground">قیمت پایه:</span>
              <span className="font-bold">{formatCurrency(info.basePrice)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-muted-foreground">تغییر:</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-bold",
                  up ? "text-sunset" : "text-emerald",
                )}
              >
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {up ? "+" : ""}
                {toFa(info.deltaPercent ?? 0)}٪
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-muted-foreground">قیمت نهایی:</span>
              <span className="font-black text-emerald">
                {formatCurrency(info.finalPrice)}
              </span>
            </div>
            {info.reasonTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {info.reasonTags.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold"
                  >
                    {REASON_LABEL[r]}
                  </span>
                ))}
              </div>
            )}
            <p className="border-t pt-1.5 text-[10px] leading-4 text-muted-foreground">
              {info.explanation}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
