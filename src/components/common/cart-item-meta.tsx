"use client";

import * as React from "react";
import { CalendarDays, Hourglass, Users } from "lucide-react";
import { toFa, toPersianDate, toPersianShortDate } from "@/lib/format";
import type { CartItem } from "@/types";

/**
 * CartItemMetaChips — surfaces the date metadata captured at add-to-cart time
 * (selected tour departure / equipment rental window) directly on cart line
 * items, so travelers see their dates everywhere — cart drawer, checkout
 * steps — without digging into the booking flow.
 */
export function CartItemMetaChips({
  meta,
  type,
}: {
  meta?: CartItem["meta"];
  type: CartItem["type"];
}) {
  const chips: React.ReactNode[] = [];

  if (meta?.startDate && type === "tour") {
    chips.push(
      <Chip key="dep" icon={<CalendarDays className="h-3 w-3 text-primary" />}>
        حرکت: {toPersianDate(meta.startDate)}
      </Chip>
    );
  }
  if (meta?.rentStart) {
    chips.push(
      <Chip key="rent" icon={<CalendarDays className="h-3 w-3 text-sunset" />}>
        اجاره: {toPersianShortDate(meta.rentStart)}
        {meta.rentEnd ? ` تا ${toPersianShortDate(meta.rentEnd)}` : ""}
      </Chip>
    );
  }
  if (meta?.rentDays) {
    chips.push(
      <Chip key="days" icon={<Hourglass className="h-3 w-3 text-sunset" />}>
        {toFa(meta.rentDays)} روز
      </Chip>
    );
  }
  if (meta?.participants) {
    chips.push(
      <Chip key="pax" icon={<Users className="h-3 w-3 text-primary" />}>
        {toFa(meta.participants)} نفر
      </Chip>
    );
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5" data-slot="cart-item-meta">
      {chips}
    </div>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}
