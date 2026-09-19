// Iranian national ID (کد ملی) — normalization + validation.
//
// Algorithm (the well-known کد ملی mod-11 check):
//   1. Normalize: Persian digits ۰-۹ → Latin, strip every non-digit char.
//   2. Exactly 10 digits; all-identical digits (e.g. "0000000000") are
//      rejected even when they would pass the arithmetic.
//   3. checksum: sum = Σ digit[i] × (10 − i) for i = 0..8; r = sum % 11;
//      control = digit[9]; valid if r < 2 ? control === r : control === 11 − r.
//
// Verified against the reference implementation (scratch bun -e run):
//   isValidIranianNationalId("0499370899") → true
//   isValidIranianNationalId("0012345679") → true
//   isValidIranianNationalId("1234567891") → true  (control digit computed)
//   isValidIranianNationalId("1234567890") → false (checksum mismatch)
//   isValidIranianNationalId("1111111111") → false (all-identical rule)

import { toEn } from "@/lib/format";

/**
 * Persian → Latin digits, strip non-digits, cap at 10.
 * Returns "" when the input contains no digits at all (so an input filtered
 * through this on change can only ever hold digits).
 */
export function normalizeNationalId(input: string): string {
  return toEn(input)
    .replace(/\D/g, "")
    .slice(0, 10);
}

/** True only for a well-formed, checksum-valid 10-digit کد ملی. */
export function isValidIranianNationalId(input: string): boolean {
  const id = normalizeNationalId(input);
  if (id.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(id)) return false; // all-identical digits
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(id[i]) * (10 - i);
  const r = sum % 11;
  const control = Number(id[9]);
  return r < 2 ? control === r : control === 11 - r;
}
