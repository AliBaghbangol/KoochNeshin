"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ExpenseBudgets,
  ExpenseCategory,
  GroupExpense,
  MemberBalance,
  Settlement,
  SettledTransfer,
} from "@/types/group-expenses";
import { enableCrossTabSync } from "@/lib/cross-tab";
import { emitLive } from "@/lib/realtime/trip-socket";

/**
 * Group expenses store — per-booking ledger, override-on-mock pattern like
 * `draft-tours-store.ts`. Persisted per browser; the backend contract is
 * documented in `types/group-expenses.ts` (TODO(backend)).
 *
 * `updateExpense` keeps `createdAt` / `addedBy` intact — editing rewrites only
 * the economic fields and stamps `editedAt`, so the audit trail (who recorded
 * it, when, whether it was touched since) survives.
 *
 * `budgets` is the planning layer (v21.4): per-category monthly-style caps
 * shown as progress against actual spend in the expenses panel.
 *
 * `settled` (v21.9): transfers the group confirmed as paid. Marking one
 * shifts the net balances (`applySettled`) so the suggested settlement list
 * shrinks and disappears when every transfer is confirmed.
 *
 * v21.9.1: the canonical demo booking (ub1) ships with a seeded ledger +
 * budgets + one confirmed transfer, so the settlement flow is discoverable
 * without manual data entry (persist key bumped to v2).
 */

interface GroupExpensesState {
  /** bookingId -> expenses */
  byBooking: Record<string, GroupExpense[]>;
  /** bookingId -> category -> budget amount (تومان) — planning layer */
  budgets: Record<string, ExpenseBudgets>;
  /** bookingId -> transfers confirmed as paid (v21.9) */
  settled: Record<string, SettledTransfer[]>;
  /** Record one suggested transfer as actually paid. Returns its id. */
  markSettled: (
    bookingId: string,
    transfer: Omit<SettledTransfer, "id" | "at">,
  ) => string;
  /** Undo a confirmed transfer (author or moderator, gated on the client). */
  unsetSettlement: (bookingId: string, transferId: string) => void;
  /** Forget the whole settled history for one booking (fresh settlement round). */
  clearSettled: (bookingId: string) => void;
  /** Set (or clear with null) the budget of one category for one booking. */
  setBudget: (
    bookingId: string,
    category: ExpenseCategory,
    amount: number | null,
  ) => void;
  addExpense: (
    expense: Omit<GroupExpense, "id" | "createdAt">,
  ) => string;
  /** Overwrite the editable fields of one expense (title/amount/category/payer/participants/shares). */
  updateExpense: (
    bookingId: string,
    expenseId: string,
    patch: Pick<
      GroupExpense,
      "title" | "amount" | "category" | "payerId" | "participants" | "shares"
    >,
    /** v22 — audit trail: who made the edit (display name) */
    editedByName?: string,
  ) => void;
  removeExpense: (bookingId: string, expenseId: string) => void;
  expensesOf: (bookingId: string) => GroupExpense[];
  clearBooking: (bookingId: string) => void;
  /** v22 — apply a relayed remote mutation (from trip-sync-service) */
  applyRemote: (bookingId: string, kind: string, payload: unknown) => void;
}

function genId() {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Demo ledger for the canonical demo booking (v21.9.1).
 *
 * The settlement feature only becomes visible after a few expenses exist, so a
 * fresh visitor saw an empty tab and never discovered the marquee v21.9 flow.
 * This seed mirrors the seeded chat/checklist in `trip-room-store`: realistic
 * Damavand pre-trip costs split across the four demo members.
 *
 * Math (equal splits, E4 split between 3 people):
 *   paid  — علی 5,200,000 / حسین 3,800,000 / سارا 800,000 / شما 0
 *   share — علی 2,150,000 / حسین 2,550,000 / سارا 2,550,000 / شما 2,550,000
 *   net   — علی +3,050,000 / حسین +1,250,000 / سارا −1,750,000 / شما −2,550,000
 * One transfer (سارا → حسین 1,250,000) is pre-confirmed so the settled-history
 * UI is populated too; the remaining suggestions are
 *   شما → علی 2,550,000  و  سارا → علی 500,000.
 */
const DEMO_BOOKING_ID = "ub1";

function seedLedger(): Record<string, GroupExpense[]> {
  const h = (n: number) => new Date(Date.now() - 1000 * 60 * 60 * n).toISOString();
  return {
    [DEMO_BOOKING_ID]: [
      {
        id: "exp_seed_permit",
        bookingId: DEMO_BOOKING_ID,
        payerId: "leader_1",
        amount: 400_000,
        title: "پرمیت ورود به منطقه‌ی حفاظت‌شده",
        category: "ticket",
        participants: ["leader_1", "sara", "hossein", "me"],
        addedBy: "leader_1",
        createdAt: h(5),
      },
      {
        id: "exp_seed_rental",
        bookingId: DEMO_BOOKING_ID,
        payerId: "hossein",
        amount: 1_200_000,
        title: "اجاره‌ی کرامپون و باتوم (۳ نفر)",
        category: "supply",
        participants: ["sara", "hossein", "me"],
        addedBy: "hossein",
        createdAt: h(6),
      },
      {
        id: "exp_seed_snacks",
        bookingId: DEMO_BOOKING_ID,
        payerId: "sara",
        amount: 800_000,
        title: "تنقلات و وعده‌های کوه",
        category: "food",
        participants: ["leader_1", "sara", "hossein", "me"],
        addedBy: "sara",
        createdAt: h(8),
      },
      {
        id: "exp_seed_bus",
        bookingId: DEMO_BOOKING_ID,
        payerId: "hossein",
        amount: 2_600_000,
        title: "مینی‌بوس رفت‌وبرگشت پولادکاله",
        category: "transport",
        participants: ["leader_1", "sara", "hossein", "me"],
        addedBy: "hossein",
        createdAt: h(24),
      },
      {
        id: "exp_seed_lodge",
        bookingId: DEMO_BOOKING_ID,
        payerId: "leader_1",
        amount: 4_800_000,
        title: "کلبه‌ی اقامتگاه پای‌کوه (۲ شب)",
        category: "stay",
        participants: ["leader_1", "sara", "hossein", "me"],
        addedBy: "leader_1",
        createdAt: h(30),
      },
    ],
  };
}

function seedBudgets(): Record<string, ExpenseBudgets> {
  return {
    [DEMO_BOOKING_ID]: {
      stay: 5_000_000,
      transport: 3_000_000,
      food: 1_000_000,
      supply: 1_500_000,
    },
  };
}

function seedSettled(): Record<string, SettledTransfer[]> {
  return {
    [DEMO_BOOKING_ID]: [
      {
        id: "set_seed_1",
        fromId: "sara",
        toId: "hossein",
        amount: 1_250_000,
        byId: "sara",
        byName: "سارا کریمی",
        at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ],
  };
}

export const useGroupExpenses = create<GroupExpensesState>()(
  persist(
    (set, get) => ({
      byBooking: seedLedger(),
      budgets: seedBudgets(),
      settled: seedSettled(),
      markSettled: (bookingId, transfer) => {
        const id = genId().replace("exp_", "set_");
        const entry: SettledTransfer = {
          ...transfer,
          id,
          at: new Date().toISOString(),
        };
        set((s) => ({
          settled: {
            ...s.settled,
            [bookingId]: [entry, ...(s.settled[bookingId] ?? [])],
          },
        }));
        emitLive(bookingId, "settled:set", get().settled[bookingId] ?? []);
        return id;
      },
      unsetSettlement: (bookingId, transferId) => {
        set((s) => ({
          settled: {
            ...s.settled,
            [bookingId]: (s.settled[bookingId] ?? []).filter(
              (t) => t.id !== transferId,
            ),
          },
        }));
        emitLive(bookingId, "settled:set", get().settled[bookingId] ?? []);
      },
      clearSettled: (bookingId) => {
        set((s) => {
          const next = { ...s.settled };
          delete next[bookingId];
          return { settled: next };
        });
        emitLive(bookingId, "settled:set", []);
      },
      setBudget: (bookingId, category, amount) => {
        set((s) => {
          const current = s.budgets[bookingId] ?? {};
          const next = { ...current };
          if (amount === null || amount <= 0) {
            delete next[category];
          } else {
            next[category] = amount;
          }
          return {
            budgets: { ...s.budgets, [bookingId]: next },
          };
        });
        emitLive(bookingId, "budgets:set", get().budgets[bookingId] ?? {});
      },
      addExpense: (expense) => {
        const id = genId();
        const entry: GroupExpense = {
          ...expense,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          byBooking: {
            ...s.byBooking,
            [expense.bookingId]: [
              entry,
              ...(s.byBooking[expense.bookingId] ?? []),
            ],
          },
        }));
        emitLive(expense.bookingId, "exp:upsert", entry);
        return id;
      },
      updateExpense: (bookingId, expenseId, patch, editedByName) => {
        const updated = (get().byBooking[bookingId] ?? []).find(
          (e) => e.id === expenseId,
        );
        set((s) => ({
          byBooking: {
            ...s.byBooking,
            [bookingId]: (s.byBooking[bookingId] ?? []).map((e) =>
              e.id === expenseId
                ? {
                    ...e,
                    ...patch,
                    editedAt: new Date().toISOString(),
                    ...(editedByName ? { editedByName } : {}),
                  }
                : e,
            ),
          },
        }));
        if (updated) {
          const fresh = (get().byBooking[bookingId] ?? []).find(
            (e) => e.id === expenseId,
          );
          if (fresh) emitLive(bookingId, "exp:upsert", fresh);
        }
      },
      removeExpense: (bookingId, expenseId) => {
        set((s) => ({
          byBooking: {
            ...s.byBooking,
            [bookingId]: (s.byBooking[bookingId] ?? []).filter(
              (e) => e.id !== expenseId,
            ),
          },
        }));
        emitLive(bookingId, "exp:remove", { expenseId });
      },
      expensesOf: (bookingId) => get().byBooking[bookingId] ?? [],
      clearBooking: (bookingId) =>
        set((s) => {
          const next = { ...s.byBooking };
          delete next[bookingId];
          return { byBooking: next };
        }),

      /* ---------------- v22: remote application ---------------- */

      /**
       * Apply a relayed mutation from another browser (idempotent upserts /
       * explicit list replacement — at-least-once delivery is always safe).
       */
      applyRemote: (bookingId, kind, payload) => {
        const p = payload as Record<string, unknown>;
        switch (kind) {
          case "exp:upsert": {
            const exp = p as unknown as GroupExpense;
            if (!exp?.id) return;
            set((s) => {
              const list = s.byBooking[bookingId] ?? [];
              if (list.some((e) => e.id === exp.id)) {
                return {
                  byBooking: {
                    ...s.byBooking,
                    [bookingId]: list.map((e) => (e.id === exp.id ? exp : e)),
                  },
                };
              }
              return {
                byBooking: { ...s.byBooking, [bookingId]: [exp, ...list] },
              };
            });
            return;
          }
          case "exp:remove":
            set((s) => ({
              byBooking: {
                ...s.byBooking,
                [bookingId]: (s.byBooking[bookingId] ?? []).filter(
                  (e) => e.id !== p.expenseId,
                ),
              },
            }));
            return;
          case "settled:set":
            set((s) => ({
              settled: {
                ...s.settled,
                [bookingId]: Array.isArray(p) ? (p as unknown as SettledTransfer[]) : [],
              },
            }));
            return;
          case "budgets:set":
            set((s) => ({
              budgets: {
                ...s.budgets,
                [bookingId]: (p ?? {}) as ExpenseBudgets,
              },
            }));
            return;
          default:
            // trip-room kinds are handled by trip-room-store.applyRemote
            return;
        }
      },
    }),
    // v2: دموی اولیه‌ی دفتر هزینه + بودجه + یک تسویه‌ی تأییدشده (v21.9.1)
    { name: "koch-group-expenses-v2" },
  ),
);

/* v21.9.2: هزینه/تسویه‌ای که در تب دیگر ثبت شود همین‌جا زنده می‌شود */
enableCrossTabSync(useGroupExpenses, "koch-group-expenses-v2");

/* ------------------------------------------------------------------ */
/* Pure settlement math (no store access — easy to unit-test later)     */
/* ------------------------------------------------------------------ */

/**
 * Net balances for every member of the trip.
 * paid  = sum of amounts the member paid
 * share = sum of the member's share across expenses they take part in
 * net   = paid - share  →  positive: should receive, negative: owes
 *
 * Split modes (v21.5):
 *  - equal (default): amount / participants.length
 *  - custom: `shares[userId]` weights normalized over the VALID participants
 *    (intersection with memberIds). Normalization guarantees the ledger
 *    always sums exactly to `amount` even if a participant went stale or a
 *    stored share row is missing/corrupt.
 */
export function computeBalances(
  expenses: GroupExpense[],
  memberIds: string[],
): MemberBalance[] {
  const balances = new Map<string, MemberBalance>(
    memberIds.map((id) => [id, { userId: id, paid: 0, share: 0, net: 0 }]),
  );

  for (const e of expenses) {
    const payer = balances.get(e.payerId);
    if (payer) payer.paid += e.amount;
    // split between the intersection of participants and known members so a
    // stale participant id (left the trip) can never crash the math
    const parts = e.participants.filter((p) => balances.has(p));
    if (parts.length === 0) continue;

    if (e.shares) {
      // custom split — normalized weights over valid participants
      const weights = parts.map((p) => Math.max(0, Number(e.shares![p]) || 0));
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      if (totalWeight > 0) {
        parts.forEach((p, i) => {
          balances.get(p)!.share += (e.amount * weights[i]) / totalWeight;
        });
        continue;
      }
      // corrupt shares (all zero) → fall through to equal split
    }

    const share = e.amount / parts.length;
    for (const p of parts) {
      balances.get(p)!.share += share;
    }
  }

  const list = [...balances.values()];
  for (const b of list) b.net = Math.round(b.paid - b.share);
  return list;
}

/**
 * Fold confirmed transfers into the net balances (v21.9).
 * A confirmed «A pays B» moves A's net UP and B's net DOWN by the amount —
 * exactly what happens in the real world when the cash changes hands.
 * Pure function; `paid`/`share` keep the raw ledger truth.
 */
export function applySettled(
  balances: MemberBalance[],
  settled: SettledTransfer[],
): MemberBalance[] {
  if (settled.length === 0) return balances;
  const map = new Map(balances.map((b) => [b.userId, { ...b }]));
  for (const t of settled) {
    const from = map.get(t.fromId);
    const to = map.get(t.toId);
    if (from) from.net += t.amount;
    if (to) to.net -= t.amount;
  }
  return [...map.values()];
}

/**
 * Greedy min-cash-flow settlement: repeatedly match the biggest debtor with
 * the biggest creditor. Produces at most (n - 1) transfers in practice and
 * rounds to whole tomans.
 */
export function computeSettlements(
  balances: MemberBalance[],
): Settlement[] {
  const debtors = balances
    .filter((b) => b.net < -1) // ignore sub-rials noise
    .map((b) => ({ id: b.userId, amt: -b.net }))
    .sort((a, b) => b.amt - a.amt);
  const creditors = balances
    .filter((b) => b.net > 1)
    .map((b) => ({ id: b.userId, amt: b.net }))
    .sort((a, b) => b.amt - a.amt);

  const out: Settlement[] = [];
  let i = 0;
  let j = 0;
  let guard = 0;
  while (i < debtors.length && j < creditors.length && guard < 200) {
    guard += 1;
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0) {
      out.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: pay });
      debtors[i].amt -= pay;
      creditors[j].amt -= pay;
    }
    if (debtors[i].amt <= 1) i += 1;
    if (creditors[j].amt <= 1) j += 1;
  }
  return out;
}
