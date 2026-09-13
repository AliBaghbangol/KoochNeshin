// src/types/group-expenses.ts
/**
 * Group expense splitter (هزینه‌های گروهی) — Trip Room 6th tab.
 *
 * Members record shared trip expenses; the app splits each expense equally
 * between the selected participants and computes a minimal set of
 * settlements (who pays whom, how much).
 *
 * NOTE: frontend-only (localStorage via zustand persist).
 * TODO(backend): replace with `GET/POST /api/trips/:bookingId/expenses`
 * so all members see the same ledger in real time (WebSocket later).
 */

export type ExpenseCategory =
  | "food"
  | "transport"
  | "stay"
  | "ticket"
  | "supply"
  | "other";

export interface ExpenseCategoryMeta {
  label: string;
  /** tailwind-safe accent classes used by the expenses panel */
  chip: string;
  bar: string;
}

export const EXPENSE_CATEGORIES: Record<
  ExpenseCategory,
  ExpenseCategoryMeta
> = {
  food: {
    label: "خوراک",
    chip: "bg-sunset/10 text-sunset",
    bar: "bg-sunset",
  },
  transport: {
    label: "رفت‌وآمد",
    chip: "bg-primary/10 text-primary",
    bar: "bg-primary",
  },
  stay: {
    label: "اقامت",
    chip: "bg-gold/10 text-gold",
    bar: "bg-gold",
  },
  ticket: {
    label: "بلیت و ورودی",
    chip: "bg-emerald/10 text-emerald",
    bar: "bg-emerald",
  },
  supply: {
    label: "تجهیزات و تدارکات",
    chip: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    bar: "bg-teal-500",
  },
  other: {
    label: "سایر",
    chip: "bg-muted text-muted-foreground",
    bar: "bg-muted-foreground/60",
  },
};

/** Per-category budget for one booking — category -> amount (تومان). */
export type ExpenseBudgets = Partial<Record<ExpenseCategory, number>>;

export interface GroupExpense {
  id: string;
  bookingId: string;
  /** userId (TripRoomMember.userId) of the person who paid */
  payerId: string;
  /** تومان */
  amount: number;
  title: string;
  category: ExpenseCategory;
  /** userIds sharing the cost — split equally unless `shares` is set */
  participants: string[];
  /**
   * Custom (unequal) split (v21.5): userId -> share in تومان.
   * When present, sums of valid entries are normalized to `amount`, so a
   * stale member id can never leak money out of the ledger. Absent or
   * equal to equal-split → treat as equal.
   */
  shares?: Record<string, number>;
  /** userId who recorded the entry (delete gate on the client) */
  addedBy: string;
  createdAt: string; // ISO
  /** set on the client when the entry is edited (audit-trail display) */
  editedAt?: string; // ISO
  /** v22 — display name of who made the last edit (audit-trail display) */
  editedByName?: string;
}

/** Net balance for one member — positive = should receive, negative = owes. */
export interface MemberBalance {
  userId: string;
  paid: number;
  share: number;
  net: number;
}

/** One suggested transfer that reduces the number of outstanding debts. */
export interface Settlement {
  fromId: string;
  toId: string;
  amount: number;
}

/**
 * A settlement transfer the group CONFIRMED as done (v21.9).
 * Marking one shifts the net balances, so the suggested list shrinks and —
 * when every transfer is confirmed — the ledger shows a clean slate.
 * TODO(backend): `POST /api/trips/:bookingId/settlements` for shared state.
 */
export interface SettledTransfer {
  id: string;
  fromId: string;
  toId: string;
  /** تومان */
  amount: number;
  at: string; // ISO
  /** room-member id + display name of who tapped «انجام شد» (audit) */
  byId: string;
  byName: string;
}
