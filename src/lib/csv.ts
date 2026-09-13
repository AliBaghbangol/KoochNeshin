/**
 * Shared CSV helpers — RFC 4180 compliant.
 *
 * Used by the leader dashboard bookings export and the trip-room
 * group-expenses ledger export so escaping rules stay consistent
 * (quotes doubled, every field quoted, CRLF line endings, UTF-8 BOM).
 */

/** Escape a single CSV field per RFC 4180 (quotes doubled, field quoted). */
export function csvEscape(v: string | number): string {
  return `"${String(v).replace(/"/g, '""')}"`;
}

/**
 * Build and download a CSV file.
 * @param filename  e.g. "koch-expenses-ub1.csv"
 * @param rows      first row is the header
 */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // release the blob URL on the next tick so Safari can start the download
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
