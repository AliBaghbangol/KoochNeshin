"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Package,
  Phone,
  Truck,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, toFa, toPersianShortDate } from "@/lib/format";

/**
 * OrderDetailsDialog — full order-tracking view behind the «جزئیات» (eye)
 * button of the dashboard orders table.
 *
 * Renders a vertical, RTL-safe status timeline (ثبت سفارش → پردازش →
 * تحویل به شرکت حمل → تحویل شد) with Jalali dates derived from the order
 * date, plus a dedicated cancellation branch for returned orders
 * (including the stored cancel reason when present).
 */

export interface OrderDetailsData {
  id: string;
  items: string;
  total: number;
  date: string;
  status: "delivered" | "processing" | "returned";
  cancelReason?: string;
}

type StepState = "done" | "current" | "pending" | "cancelled";

interface TimelineStep {
  key: string;
  label: string;
  description: string;
  icon: typeof Package;
  state: StepState;
  date: Date | null;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function buildSteps(order: OrderDetailsData): TimelineStep[] {
  const base = new Date(order.date);
  const invalid = Number.isNaN(base.getTime());

  const registration: TimelineStep = {
    key: "registered",
    label: "ثبت سفارش",
    description: "سفارش شما با موفقیت ثبت و پرداخت شد.",
    icon: ClipboardList,
    state: "done",
    date: invalid ? null : base,
  };

  if (order.status === "returned") {
    return [
      registration,
      {
        key: "cancelled",
        label: "سفارش لغو شد",
        description:
          order.cancelReason ?? "این سفارش لغو شده و مبلغ آن بازگشت داده شده است.",
        icon: XCircle,
        state: "cancelled",
        date: invalid ? null : addDays(base, 1),
      },
    ];
  }

  const steps: TimelineStep[] = [
    registration,
    {
      key: "processing",
      label: "پردازش و بسته‌بندی",
      description: "اقلام سفارش آماده‌سازی و بسته‌بندی می‌شوند.",
      icon: Package,
      state: order.status === "processing" ? "current" : "done",
      date: invalid ? null : addDays(base, 1),
    },
    {
      key: "shipping",
      label: "تحویل به شرکت حمل",
      description: "بسته به شرکت حمل واگذار و در مسیر ارسال است.",
      icon: Truck,
      state: "pending",
      date: order.status === "delivered" && !invalid ? addDays(base, 2) : null,
    },
  ];

  if (order.status === "delivered") {
    steps.push({
      key: "delivered",
      label: "تحویل به مسافر",
      description: "سفارش با موفقیت به شما تحویل داده شد. سفر خوبی داشته باشید!",
      icon: CheckCircle2,
      state: "done",
      date: invalid ? null : addDays(base, 3),
    });
  } else {
    steps.push({
      key: "pending-delivery",
      label: "تحویل به مسافر",
      description: "پس از ارسال، سفارش در مقصد به شما تحویل داده می‌شود.",
      icon: CheckCircle2,
      state: "pending",
      date: null,
    });
  }

  return steps;
}

function StepIcon({ step }: { step: TimelineStep }) {
  const Icon = step.icon;
  return (
    <span
      className={cn(
        "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition",
        step.state === "done" &&
          "border-emerald bg-emerald text-white shadow-emerald/20",
        step.state === "current" &&
          "border-primary bg-primary text-primary-foreground shadow-glow-gold",
        step.state === "pending" &&
          "border-border bg-muted text-muted-foreground",
        step.state === "cancelled" && "border-destructive bg-destructive/10 text-destructive"
      )}
    >
      {step.state === "current" && (
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
      )}
      <Icon className="relative h-4.5 w-4.5" />
    </span>
  );
}

export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: {
  order: OrderDetailsData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const steps = React.useMemo(
    () => (order ? buildSteps(order) : []),
    [order]
  );

  if (!order) return null;

  const statusBadge =
    order.status === "delivered"
      ? { cls: "bg-emerald/10 text-emerald", label: "تحویل شده", icon: CheckCircle2 }
      : order.status === "processing"
        ? { cls: "bg-gold/15 text-gold", label: "در حال پردازش", icon: Clock }
        : { cls: "bg-destructive/10 text-destructive", label: "مرجوع شده", icon: AlertCircle };
  const StatusIcon = statusBadge.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[85vh] gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-lg",
          "custom-scroll"
        )}
        dir="rtl"
      >
        <DialogHeader className="border-b p-5 text-right">
          <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-primary" />
              پیگیری سفارش
              <span className="font-mono text-sm text-muted-foreground" dir="ltr">
                {order.id}
              </span>
            </DialogTitle>
            <Badge className={statusBadge.cls}>
              <StatusIcon className="h-3 w-3" />
              {statusBadge.label}
            </Badge>
          </div>
          <DialogDescription className="text-xs leading-5">
            وضعیت لحظه‌ای سفارش تجهیزات شما در کوچ‌نشین
          </DialogDescription>
        </DialogHeader>

        {/* Items + total summary */}
        <div className="grid grid-cols-1 gap-3 border-b bg-muted/30 p-5 max-sm:grid-cols-1">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-bold text-muted-foreground">اقلام سفارش</span>
            <span className="max-w-[70%] text-right text-xs font-semibold leading-5">
              {order.items}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-muted-foreground">مبلغ کل</span>
            <span className="text-sm font-bold text-emerald">
              {formatCurrency(order.total)}{" "}
              <span className="text-[10px] font-normal">تومان</span>
            </span>
          </div>
        </div>

        {/* Tracking timeline */}
        <div className="relative p-5">
          <h4 className="mb-4 text-sm font-bold">مسیر سفارش</h4>
          <ol className="relative space-y-6">
            {/* vertical connector line — masked by the icon circles */}
            {steps.length > 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-3 bottom-3 w-0.5",
                  "start-[19px]",
                  order.status === "returned" ? "bg-destructive/20" : "bg-border"
                )}
              />
            )}
            {steps.map((step) => {
              const isDone = step.state === "done";
              const isCurrent = step.state === "current";
              return (
                <li key={step.key} className="relative flex gap-4">
                  <StepIcon step={step} />
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-center justify-between gap-2 max-sm:flex-col max-sm:items-start max-sm:gap-0.5">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          step.state === "pending" && "text-muted-foreground",
                          step.state === "cancelled" && "text-destructive",
                          isDone && "text-emerald",
                          isCurrent && "text-primary"
                        )}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                            در جریان
                          </span>
                        )}
                      </p>
                      {step.date && (
                        <time className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {toPersianShortDate(step.date.toISOString())}
                        </time>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2 p-5 max-sm:flex-col max-sm:items-stretch">
          <Button
            className="flex-1 max-sm:h-11"
            onClick={() => toast.success("فاکتور دانلود شد")}
          >
            <Download className="h-4 w-4" />
            دانلود فاکتور
          </Button>
          <Button
            variant="outline"
            className="flex-1 max-sm:h-11"
            onClick={() => toast.info("پشتیبانی: ۰۲۱-۱۲۳۴۵۶۷۸")}
          >
            <Phone className="h-4 w-4" />
            پیگیری تلفنی
          </Button>
        </div>

        {/* order number footer */}
        <p className="border-t bg-muted/30 px-5 py-3 text-center text-[10px] text-muted-foreground">
          شماره پیگیری: <span dir="ltr">{toFa(order.id.replace("OR-", ""))}</span> — کوچ‌نشین
        </p>
      </DialogContent>
    </Dialog>
  );
}
