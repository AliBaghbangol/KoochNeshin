"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  HeartPulse,
  CloudRain,
  Backpack,
  MapPin,
  Send,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { SafetyIncident, SafetyIncidentType, SafetyIncidentSeverity } from "@/types/safety";
import { track } from "@/lib/analytics/track";
import { useBookings } from "@/store/bookings-store";
import { useNotifications } from "@/store/notifications-store";
import { cn } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["medical", "weather", "equipment", "route", "other"]),
  severity: z.enum(["low", "medium", "high"]),
  description: z.string().min(5, "حداقل ۵ نویسه بنویس"),
});

type FormValues = z.infer<typeof schema>;

const TYPE_META: Record<
  SafetyIncidentType,
  { label: string; icon: typeof HeartPulse; tone: string }
> = {
  medical: { label: "پزشکی", icon: HeartPulse, tone: "text-red-600 bg-red-500/10" },
  weather: { label: "جو", icon: CloudRain, tone: "text-gold bg-gold/10" },
  equipment: { label: "تجهیزات", icon: Backpack, tone: "text-emerald bg-emerald/10" },
  route: { label: "مسیر", icon: MapPin, tone: "text-accent bg-accent/10" },
  other: { label: "سایر", icon: AlertTriangle, tone: "text-muted-foreground bg-muted" },
};

const SEVERITY_META: Record<SafetyIncidentSeverity, { label: string; tone: string }> = {
  low: { label: "خفیف", tone: "bg-emerald/10 text-emerald" },
  medium: { label: "متوسط", tone: "bg-gold/15 text-gold" },
  high: { label: "جدی", tone: "bg-red-500/10 text-red-600" },
};

/**
 * Incident report form — spec §4 (تکه B).
 * Submitting only adds a local notification + toast for now.
 * TODO(backend): POST /api/trips/:id/safety/events
 */
export function IncidentReportForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: string;
  onSubmitted?: (incident: SafetyIncident) => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "other", severity: "low", description: "" },
  });
  const addNotification = useNotifications((s) => s.add);

  const type = watch("type");
  const severity = watch("severity");

  function onValid(v: FormValues) {
    const incident: SafetyIncident = {
      id: `inc_${Date.now()}`,
      bookingId,
      type: v.type,
      severity: v.severity,
      description: v.description,
      createdAt: new Date().toISOString(),
    };
    track("safety_event_created", {
      bookingId,
      type: v.type,
      severity: v.severity,
    });
    addNotification({
      type: "system",
      title: "گزارش حادثه ثبت شد",
      body: `${TYPE_META[v.type].label} - ${SEVERITY_META[v.severity].label}: ${v.description.slice(0, 80)}`,
      actionLabel: "مشاهده",
      actionView: "safety-center",
    });
    onSubmitted?.(incident);
    toast.success("گزارش شما ثبت شد و به لیدر اطلاع‌رسانی شد.");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-3 rounded-3xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-500/10 text-red-600">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold">گزارش حادثه / رویداد ایمنی</h3>
          <p className="text-[10px] text-muted-foreground">
            هر رویداد غیرعادی را ثبت کن — لیدر و تیم پشتیبان مطلع می‌شوند.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold">نوع حادثه</label>
          <Select
            value={type}
            onValueChange={(v) => setValue("type", v as FormValues["type"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TYPE_META) as SafetyIncidentType[]).map((k) => {
                const meta = TYPE_META[k];
                const Icon = meta.icon;
                return (
                  <SelectItem key={k} value={k}>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold">شدت</label>
          <div className="flex gap-1">
            {(["low", "medium", "high"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue("severity", s)}
                className={cn(
                  "flex-1 rounded-xl border px-2 py-2 text-[11px] font-bold transition",
                  severity === s
                    ? SEVERITY_META[s].tone
                    : "bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {SEVERITY_META[s].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold">توضیحات</label>
        <Textarea
          {...register("description")}
          rows={3}
          placeholder="چه اتفاقی افتاد؟ کجا؟ چه کسی درگیر بود؟"
          className="text-sm"
        />
        {errors.description && (
          <p className="mt-1 text-[10px] text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <a
          href="tel:115"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline"
        >
          <Phone className="h-3 w-3" />
          اورژانس ۱۱۵
        </a>
        <Button type="submit" disabled={isSubmitting} size="sm">
          <Send className="h-3.5 w-3.5" />
          ثبت گزارش
        </Button>
      </div>

      <p className="rounded-xl bg-muted/50 p-2 text-[10px] text-muted-foreground">
        در شرایط اضطراری واقعی، حتماً با اورژانس (۱۱۵) نیز تماس بگیرید. این
        فرم جایگزین تماس با اورژانس نیست.
      </p>
    </form>
  );
}
