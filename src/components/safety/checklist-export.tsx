"use client";

import * as React from "react";
import { Download, FileText, Calendar, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { TripRoom } from "@/types/trip-room";
import { toPersianDate } from "@/lib/format";

/**
 * Checklist export — spec §4 expansion.
 *
 * Two export formats:
 *  1. Plain text (.txt) — printable checklist for offline use
 *  2. ICS calendar event — adds a "complete checklist" reminder to the
 *     user's calendar app the day before the trip
 *
 * Both are generated client-side from the current checklist state so the
 * feature works even without a backend.
 *
 * TODO(backend): once a backend exists, also offer `GET /api/trips/:id/checklist.ics`
 * for a server-rendered version.
 */
export function ChecklistExport({
  room,
  tripDate,
}: {
  room: TripRoom;
  tripDate?: string;
}) {
  function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportText() {
    const doneCount = room.checklist.filter((c) => c.done).length;
    const lines = [
      `چک‌لیست قبل از سفر — ${room.tourTitle}`,
      `تاریخ سفر: ${tripDate ? toPersianDate(tripDate) : "نامشخص"}`,
      `پیشرفت: ${doneCount} از ${room.checklist.length} آیتم`,
      "",
      "─".repeat(40),
      "",
      ...room.checklist.map((c) => `${c.done ? "[✓]" : "[ ]"} ${c.label}`),
      "",
      "─".repeat(40),
      "",
      "اعضای گروه:",
      ...room.members.map((m) => `  • ${m.name} (${m.role === "leader" ? "لیدر" : "مسافر"})`),
      "",
      "اعلامیه‌ها:",
      ...room.announcements.map((a) => `  • ${a.title}: ${a.body.slice(0, 80)}`),
      "",
      `ساخته‌شده در: ${toPersianDate(new Date().toISOString())}`,
      "کوچ‌نشین — سفرهای تجربی ایران",
    ];
    downloadBlob(
      lines.join("\n"),
      `checklist-${room.bookingId}.txt`,
      "text/plain;charset=utf-8",
    );
    toast.success("فایل متنی چک‌لیست دانلود شد.");
  }

  function exportIcs() {
    // ICS spec: https://datatracker.ietf.org/doc/html/rfc5545
    const now = new Date();
    const stamp =
      now.getUTCFullYear().toString() +
      (now.getUTCMonth() + 1).toString().padStart(2, "0") +
      now.getUTCDate().toString().padStart(2, "0") +
      "T" +
      now.getUTCHours().toString().padStart(2, "0") +
      now.getUTCMinutes().toString().padStart(2, "0") +
      now.getUTCSeconds().toString().padStart(2, "0") +
      "Z";

    // Event: day before tripDate at 20:00 local
    let startDate: Date;
    if (tripDate) {
      startDate = new Date(tripDate);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(20, 0, 0, 0);
    } else {
      startDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
    }
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min

    const fmt = (d: Date) =>
      d.getUTCFullYear().toString() +
      (d.getUTCMonth() + 1).toString().padStart(2, "0") +
      d.getUTCDate().toString().padStart(2, "0") +
      "T" +
      d.getUTCHours().toString().padStart(2, "0") +
      d.getUTCMinutes().toString().padStart(2, "0") +
      d.getUTCSeconds().toString().padStart(2, "0") +
      "Z";

    const doneCount = room.checklist.filter((c) => c.done).length;
    const description =
      `چک‌لیست سفر: ${doneCount}/${room.checklist.length} انجام شده. ` +
      room.checklist
        .map((c) => `${c.done ? "✓" : "✗"} ${c.label}`)
        .join(" | ");

    // RFC 5545: escape backslash, semicolon, comma, newline in text fields
    const esc = (s: string) =>
      s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kochneshin//Safety Checklist//FA",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:checklist-${room.bookingId}@kochneshin.ir`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmt(startDate)}`,
      `DTEND:${fmt(endDate)}`,
      `SUMMARY:${esc(room.tourTitle + " — یادآوری چک‌لیست")}`,
      `DESCRIPTION:${esc(description)}`,
      // Multiple VALARMs — three reminders at increasing urgency
      "BEGIN:VALARM",
      "TRIGGER:-P1D", // 1 day before — gentle reminder
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc("یادآوری چک‌لیست سفر — فردا حرکت می‌کنی")}`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT1H", // 1 hour before — final prep check
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc("یادآوری نهایی چک‌لیست سفر — یک ساعت تا مرجع")}`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M", // 15 min before — last call
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc("چک‌لیست نهایی سفر را تکمیل کن")}`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    downloadBlob(ics, `checklist-${room.bookingId}.ics`, "text/calendar");
    toast.success("رویداد تقویم دانلود شد — در تقویمت بازش کن.");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Download className="h-3.5 w-3.5" />
          خروجی چک‌لیست
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportText}>
          <FileText className="h-3.5 w-3.5" />
          فایل متنی (قابل چاپ)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportIcs}>
          <Calendar className="h-3.5 w-3.5" />
          رویداد تقویم (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
