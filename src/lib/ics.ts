/**
 * Kochneshin — ICS (iCalendar) export utilities.
 *
 * Builds a RFC 5545–compliant VCALENDAR with all-day VEVENTs (VALUE=DATE),
 * which is the most timezone-safe representation for tour departures.
 * Persian text is fine inside ICS (UTF-8); long lines are folded every 37
 * characters — safe even for 2-byte Persian characters (74 octets < 75 limit).
 */

export interface IcsEventInput {
  /** Unique id (used as UID). */
  uid: string;
  title: string;
  /** ISO date string for the departure day. */
  date: string;
  /** Tour duration in days (DTEND is exclusive, minimum 1). */
  durationDays?: number;
  location?: string;
  description?: string;
  status?: "confirmed" | "pending" | "cancelled";
}

/** Compact UTC timestamp for DTSTAMP/CREATED (e.g. 20250710T123345Z). */
function utcStamp(d: Date): string {
  return (
    d.getUTCFullYear().toString().padStart(4, "0") +
    (d.getUTCMonth() + 1).toString().padStart(2, "0") +
    d.getUTCDate().toString().padStart(2, "0") +
    "T" +
    d.getUTCHours().toString().padStart(2, "0") +
    d.getUTCMinutes().toString().padStart(2, "0") +
    d.getUTCSeconds().toString().padStart(2, "0") +
    "Z"
  );
}

/** Local all-day date (YYYYMMDD) from an ISO date string. */
function allDay(iso: string): string {
  const d = new Date(iso);
  return (
    d.getFullYear().toString().padStart(4, "0") +
    (d.getMonth() + 1).toString().padStart(2, "0") +
    d.getDate().toString().padStart(2, "0")
  );
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** RFC 5545 text escaping (backslash, semicolon, comma, newline). */
function esc(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Fold a content line at 37 characters (single-byte-safe for ASCII, and
 * ≤74 octets for Persian) with " " continuation lines, per RFC 5545 §3.1.
 */
function fold(line: string): string {
  if (line.length <= 37) return line;
  const parts: string[] = [line.slice(0, 37)];
  for (let i = 37; i < line.length; i += 36) {
    parts.push(" " + line.slice(i, i + 36));
  }
  return parts.join("\r\n");
}

const STATUS_MAP = {
  confirmed: "CONFIRMED",
  pending: "TENTATIVE",
  cancelled: "CANCELLED",
} as const;

/** Build the full VCALENDAR payload for the given events. */
export function buildIcs(events: IcsEventInput[]): string {
  const now = utcStamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kochneshin//Tour Bookings//FA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:رزروهای کوچ‌نشین",
    "X-WR-TIMEZONE:Asia/Tehran",
  ];

  events.forEach((e) => {
    const days = Math.max(1, Math.floor(e.durationDays ?? 1));
    lines.push(
      "BEGIN:VEVENT",
      `UID:${esc(e.uid)}@kochneshin.local`,
      `DTSTAMP:${now}`,
      `CREATED:${now}`,
      `DTSTART;VALUE=DATE:${allDay(e.date)}`,
      `DTEND;VALUE=DATE:${allDay(addDaysIso(e.date, days))}`,
      `SUMMARY:${esc(e.title)}`,
    );
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push(
      `STATUS:${STATUS_MAP[e.status ?? "confirmed"]}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Trigger a client-side download of the generated ICS payload. */
export function downloadIcsFile(filename: string, ics: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
