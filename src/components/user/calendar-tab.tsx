"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarPlus,
  CalendarSearch,
  ChevronLeft,
  Clock,
  Download,
  MapPin,
  Users,
} from "lucide-react";
import type { DayButton as RdpDayButton } from "react-day-picker";
import { useGo } from "@/lib/use-go";
import { useBookings } from "@/store/bookings-store";
import {
  toFa,
  toPersianDate,
  toPersianShortDate,
  getJalaliParts,
  JALALI_MONTHS,
} from "@/lib/format";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { SmartImage } from "@/components/common/smart-image";
import {
  JalaliCalendar,
  SelectedAwareDayButton,
} from "@/components/common/jalali-calendar";
import { cn } from "@/lib/utils";
import { buildIcs, downloadIcsFile } from "@/lib/ics";
import { toast } from "sonner";

interface CalendarBooking {
  id: string;
  tourId: string;
  title: string;
  image: string;
  date: string; // ISO
  participants: number;
  destination: string;
  status: "confirmed" | "pending" | "cancelled";
  duration: number;
}

// Demo seed bookings — dated RELATIVE TO TODAY so the calendar always has
// content in the current month (+ one booking in the next month to
// demonstrate month navigation / the jump-to-nearest chip).
function isoOffsetDays(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

const MOCK_CALENDAR_BOOKINGS: CalendarBooking[] = [
  {
    id: "cb1",
    tourId: "t1",
    title: "صعود فصلی قله دماوند",
    image: "/images/tours/mountain-2.jpg",
    date: isoOffsetDays(3),
    participants: 2,
    destination: "قله دماوند",
    status: "confirmed",
    duration: 4,
  },
  {
    id: "cb2",
    tourId: "t4",
    title: "کوچ ابری جنگل ابر",
    image: "/images/tours/forest-1.jpg",
    date: isoOffsetDays(9),
    participants: 3,
    destination: "جنگل ابر",
    status: "pending",
    duration: 2,
  },
  {
    id: "cb3",
    tourId: "t10",
    title: "تخت جمشید و نقش رستم",
    image: "/images/tours/historical-1.jpg",
    date: isoOffsetDays(16),
    participants: 4,
    destination: "تخت جمشید",
    status: "confirmed",
    duration: 2,
  },
  {
    id: "cb4",
    tourId: "t6",
    title: "کویر لوت — ستارگان و کرت‌ها",
    image: "/images/tours/desert-1.jpg",
    date: isoOffsetDays(34),
    participants: 2,
    destination: "دشت لوت",
    status: "confirmed",
    duration: 3,
  },
];

/** Stable local-date key (timezone-safe matching between store dates & picker dates). */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const STATUS_DOT: Record<CalendarBooking["status"], string> = {
  confirmed: "bg-emerald",
  pending: "bg-gold",
  cancelled: "bg-destructive",
};

/**
 * Same-colour cell background for booked days (inline style — react-day-
 * picker's unlayered stylesheet would beat any @layer utility class).
 * The day cell gets a soft wash of the booking status colour instead of
 * only a tiny decorative dot, so booked days pop out of the grid.
 */
const STATUS_TINT: Record<CalendarBooking["status"], string> = {
  confirmed: "color-mix(in srgb, var(--emerald) 16%, transparent)",
  pending: "color-mix(in srgb, var(--gold) 22%, transparent)",
  cancelled: "color-mix(in srgb, var(--destructive) 12%, transparent)",
};

/**
 * Priority when a day holds several bookings with different statuses —
 * confirmed wins, then pending, then cancelled.
 */
function primaryStatus(list: CalendarBooking[]): CalendarBooking["status"] {
  if (list.some((b) => b.status === "confirmed")) return "confirmed";
  if (list.some((b) => b.status === "pending")) return "pending";
  return "cancelled";
}

const STATUS_LABEL: Record<CalendarBooking["status"], string> = {
  confirmed: "تأیید شده",
  pending: "در انتظار تأیید",
  cancelled: "لغو شده",
};

/**
 * Builds the day-button renderer for the bookings calendar: selected styling
 * comes from SelectedAwareDayButton (inline — react-day-picker's stylesheet
 * is unlayered), day numbers sit top-start like the rest of the dashboard,
 * bookings render as coloured status dots right under the number, and extra
 * bookings show a count badge in the cell corner.
 */
function makeBookingDayButton(bookingsByKey: Map<string, CalendarBooking[]>) {
  return function BookingDayButton({
    children,
    style,
    ...props
  }: React.ComponentProps<typeof RdpDayButton>) {
    const { day, modifiers } = props;
    const list = bookingsByKey.get(dayKey(day.date)) ?? [];
    const hasBookings = list.length > 0;
    const tint =
      hasBookings && !modifiers.selected
        ? STATUS_TINT[primaryStatus(list)]
        : undefined;
    return (
      <SelectedAwareDayButton
        {...props}
        style={
          tint ? ({ ...style, backgroundColor: tint } as React.CSSProperties) : style
        }
      >
        <span
          className={cn(
            "block text-sm leading-none",
            modifiers.selected
              ? "font-bold text-primary-foreground"
              : modifiers.today
              ? "font-bold text-gold underline decoration-gold decoration-2 underline-offset-4"
              : hasBookings
              ? "font-bold text-primary"
              : modifiers.outside
              ? "font-normal text-muted-foreground/50"
              : "font-normal text-foreground"
          )}
        >
          {children}
        </span>
        {hasBookings && (
          <span className="mt-1.5 flex items-center justify-start gap-1 ps-0.5">
            {list.slice(0, 3).map((b) => (
              <span
                key={b.id}
                className={cn(
                  "size-2 rounded-full ring-1 ring-background",
                  STATUS_DOT[b.status]
                )}
              />
            ))}
          </span>
        )}
        {list.length > 1 && (
          <span className="absolute bottom-1.5 left-2 text-[9px] font-bold leading-none text-primary">
            {toFa(list.length)}
          </span>
        )}
      </SelectedAwareDayButton>
    );
  };
}

export function CalendarTab() {
  const go = useGo();

  // Real user bookings from the bookings store (persisted) merged with the
  // demo seed — real bookings first.
  const userBookings = useBookings((s) => s.bookings);
  const realCalendarBookings: CalendarBooking[] = userBookings.map((b) => ({
    id: b.id,
    tourId: b.tourId,
    title: b.tourTitle,
    image: b.tourImage,
    date: b.tourDate,
    participants: b.participants,
    destination: b.tourTitle.split("—")[0].trim(),
    status:
      b.status === "confirmed"
        ? "confirmed"
        : b.status === "pending"
        ? "pending"
        : "cancelled",
    duration: 1, // Default; real duration would come from tour data
  }));
  const allCalendarBookings = [
    ...realCalendarBookings,
    ...MOCK_CALENDAR_BOOKINGS,
  ];

  // Bookings grouped by local-date key for the day-cell dots & click lookup.
  const bookingsByKey = React.useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    allCalendarBookings.forEach((b) => {
      const key = dayKey(new Date(b.date));
      map.set(key, [...(map.get(key) ?? []), b]);
    });
    return map;
  }, [allCalendarBookings]);

  const [month, setMonth] = React.useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = React.useState<Date | undefined>();
  const [selectedBooking, setSelectedBooking] =
    React.useState<CalendarBooking | null>(null);

  // Displayed Jalali month/year drives the side list + header count.
  const { jy: dispJy, jm: dispJm } = getJalaliParts(month);
  const monthBookings = React.useMemo(
    () =>
      allCalendarBookings.filter((b) => {
        const p = getJalaliParts(new Date(b.date));
        return p.jy === dispJy && p.jm === dispJm;
      }),
    [allCalendarBookings, dispJy, dispJm]
  );

  const handleSelect = (d: Date | undefined) => {
    setSelectedDay(d);
    if (!d) {
      setSelectedBooking(null);
      return;
    }
    const list = bookingsByKey.get(dayKey(d));
    setSelectedBooking(list?.[0] ?? null);
  };

  const handleMonthChange = (d: Date) => {
    setMonth(d);
    setSelectedDay(undefined);
    setSelectedBooking(null);
  };

  // Nearest upcoming booking (for the empty-month jump chip).
  const nearestBooking = React.useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return (
      allCalendarBookings
        .filter((b) => new Date(b.date) >= start)
        .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0] ?? null
    );
  }, [allCalendarBookings]);

  // Stretch the month grid to the full card width (cells scale like the rest
  // of the dashboard), with booking dots pinned inside day cells.
  const BookingDayButton = React.useMemo(
    () => makeBookingDayButton(bookingsByKey),
    [bookingsByKey]
  );

  /** Shared ICS payload builder for a single booking. */
  const bookingToIcsEvent = (b: CalendarBooking) => ({
    uid: b.id,
    title: b.title,
    date: b.date,
    durationDays: b.duration,
    location: b.destination,
    description: `${toFa(b.participants)} نفر • مدت: ${toFa(b.duration)} روز • وضعیت: ${STATUS_LABEL[b.status]} • کوچ‌نشین`,
    status: b.status,
  });

  /** Export a single booking as an .ics file (detail-card action). */
  const exportBookingToIcs = (b: CalendarBooking) => {
    downloadIcsFile("kochneshin-booking.ics", buildIcs([bookingToIcsEvent(b)]));
    toast.success("این سفر به فایل تقویم (ICS) اضافه شد", {
      description: "فایل را در Google Calendar / Apple Calendar باز کنید.",
    });
  };

  /** Export every non-cancelled booking as one .ics file (header action). */
  const handleExportIcs = () => {
    const exportable = allCalendarBookings.filter(
      (b) => b.status !== "cancelled"
    );
    if (exportable.length === 0) {
      toast.info("رزروی برای خروجی گرفتن وجود ندارد.");
      return;
    }
    downloadIcsFile(
      "kochneshin-bookings.ics",
      buildIcs(exportable.map(bookingToIcsEvent))
    );
    toast.success(`${toFa(exportable.length)} سفر به فایل تقویم اضافه شد`, {
      description: "رویدادها به‌صورت تمام‌روزه با مدت واقعی تور صادر شدند.",
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">تقویم رزروها</h3>
          <p className="text-sm text-muted-foreground">
            {toFa(monthBookings.length)} رزرو در {JALALI_MONTHS[dispJm - 1]}{" "}
            {toFa(dispJy)}
          </p>
        </div>
        <button
          onClick={handleExportIcs}
          className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary/40 hover:text-primary max-sm:h-11 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Download className="h-4 w-4" />
          خروجی تقویم (ICS)
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <ScrollReveal>
          <div className="rounded-3xl border bg-card p-5">
            <JalaliCalendar
              mode="single"
              selected={selectedDay}
              onSelect={handleSelect}
              month={month}
              onMonthChange={handleMonthChange}
              showOutsideDays
              className="w-full!"
              classNames={{
                months: "relative flex w-full self-stretch flex-col",
                month: "flex w-full flex-col",
                weekdays: "flex w-full",
                week: "mt-1.5 flex w-full",
                day: "relative aspect-square w-full flex-1 p-0 text-center",
                day_button: cn(
                  "relative aspect-square w-full rounded-xl p-0 pt-2.5 ps-3 text-start transition-colors hover:bg-accent hover:text-accent-foreground"
                ),
              }}
              components={{ DayButton: BookingDayButton }}
            />

            {/* Legend — tinted swatches mirror the day-cell backgrounds */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="grid h-5 w-5 place-items-center rounded-md ring-1 ring-inset ring-emerald/25"
                  style={{ backgroundColor: STATUS_TINT.confirmed }}
                >
                  <span className="size-1.5 rounded-full bg-emerald" />
                </span>
                تأیید شده
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="grid h-5 w-5 place-items-center rounded-md ring-1 ring-inset ring-gold/30"
                  style={{ backgroundColor: STATUS_TINT.pending }}
                >
                  <span className="size-1.5 rounded-full bg-gold" />
                </span>
                در انتظار
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="grid h-5 w-5 place-items-center rounded-md ring-1 ring-inset ring-destructive/25"
                  style={{ backgroundColor: STATUS_TINT.cancelled }}
                >
                  <span className="size-1.5 rounded-full bg-destructive" />
                </span>
                لغو شده
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Selected booking detail / Upcoming list */}
        <div className="space-y-3">
          {selectedBooking ? (
            <motion.div
              key={selectedBooking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4"
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                رزرو انتخاب‌شده
              </p>
              <div className="overflow-hidden rounded-xl">
                <SmartImage
                  src={selectedBooking.image}
                  alt={selectedBooking.title}
                  fallback="tour"
                  shimmer={false}
                  aspectClass="aspect-[16/10]"
                  className="object-cover"
                />
              </div>
              <h4 className="mt-3 font-bold leading-6">{selectedBooking.title}</h4>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {toPersianDate(selectedBooking.date)}
                </p>
                <p className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedBooking.destination}
                </p>
                <p className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {toFa(selectedBooking.duration)} روز
                </p>
                <p className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {toFa(selectedBooking.participants)} نفر
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => exportBookingToIcs(selectedBooking)}
                  aria-label="افزودن این سفر به تقویم"
                  title="افزودن این سفر به تقویم"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition hover:border-primary/40 hover:text-primary max-sm:h-11 max-sm:w-11 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <CalendarPlus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => go("tour-detail", { id: selectedBooking.tourId })}
                  className="flex-1 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground max-sm:h-11 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  مشاهده تور
                </button>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl border px-3 py-2 text-xs font-bold text-muted-foreground max-sm:h-11 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border bg-card p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                رزروهای پیش‌رو
              </p>
              <div className="space-y-2">
                {monthBookings.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      رزروی در این ماه نیست.
                    </p>
                    {nearestBooking && (
                      <button
                        onClick={() => {
                          handleMonthChange(new Date(nearestBooking.date));
                        }}
                        className="mx-auto mt-3 flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 max-sm:h-11"
                      >
                        <CalendarSearch className="h-3.5 w-3.5" />
                        نزدیک‌ترین رزرو:{" "}
                        {JALALI_MONTHS[getJalaliParts(new Date(nearestBooking.date)).jm - 1]}
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  monthBookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="flex w-full items-center gap-3 rounded-xl border p-2 text-right transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                        <SmartImage
                          src={b.image}
                          alt={b.title}
                          fallback="tour"
                          shimmer={false}
                          aspectClass="size-full"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">{b.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {toPersianShortDate(b.date)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          STATUS_DOT[b.status]
                        )}
                      />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
