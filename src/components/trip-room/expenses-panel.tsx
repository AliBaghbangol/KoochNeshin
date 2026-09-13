"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Plus,
  Trash2,
  Pencil,
  Utensils,
  Bus,
  Home,
  Ticket,
  Backpack,
  CircleEllipsis,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Users,
  Download,
  ArrowUpDown,
  PiggyBank,
  TriangleAlert,
  Equal,
  SlidersHorizontal,
  Check,
  CheckCircle2,
  HandCoins,
  PartyPopper,
  Undo2,
  History,
  ChevronDown,
  BellRing,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/store/notifications-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { TripRoom, TripRoomMember } from "@/types/trip-room";
import {
  EXPENSE_CATEGORIES,
  type ExpenseBudgets,
  type ExpenseCategory,
  type GroupExpense,
  type SettledTransfer,
  type Settlement,
} from "@/types/group-expenses";
import {
  useGroupExpenses,
  computeBalances,
  computeSettlements,
  applySettled,
} from "@/store/group-expenses-store";
import { resolveAccessLevel, ME_ID } from "@/store/trip-room-store";
import { useNamedMembers } from "@/data/use-trip-room";
import { formatCurrency, toFa, toPersianShortDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Expenses panel — Trip Room 6th tab (هزینه‌های گروهی).
 *
 * Shared-trip ledger:
 *  - summary card: total spend / per-person / my net balance
 *  - category breakdown bars + per-category budgets (v21.4) with
 *    remaining / over-budget states and a budget editor dialog
 *  - settlement suggestions (greedy min-cash-flow)
 *  - expense list + add/edit dialog (payer, split among members);
 *    edited entries carry a «ویرایش‌شده» chip (v21.4)
 *
 * All data is frontend-only (TODO(backend): /api/trips/:id/expenses).
 */

const CATEGORY_ICONS: Record<ExpenseCategory, React.ElementType> = {
  food: Utensils,
  transport: Bus,
  stay: Home,
  ticket: Ticket,
  supply: Backpack,
  other: CircleEllipsis,
};

/** Tiny counter shown inside the «هزینه‌ها» tab trigger. */
export function ExpensesTabCount({ bookingId }: { bookingId: string }) {
  const count = useGroupExpenses(
    (s) => s.byBooking[bookingId]?.length ?? 0,
  );
  if (count === 0) return null;
  return <span className="text-[9px] text-muted-foreground">{toFa(count)}</span>;
}

export function ExpensesPanel({ room }: { room: TripRoom }) {
  const expenses = useGroupExpenses((s) => s.byBooking[room.bookingId]) ?? [];
  const addExpense = useGroupExpenses((s) => s.addExpense);
  const updateExpense = useGroupExpenses((s) => s.updateExpense);
  const removeExpense = useGroupExpenses((s) => s.removeExpense);
  const budgets = useGroupExpenses((s) => s.budgets[room.bookingId]);
  const access = resolveAccessLevel(room);
  const canWrite = access === "member" || access === "leader" || access === "admin";

  // Display roster: the mock «شما» entry shows the REAL logged-in identity.
  const namedMembers = useNamedMembers(room);

  const memberIds = React.useMemo(
    () => namedMembers.map((m) => m.userId),
    [namedMembers],
  );
  const memberById = React.useMemo(() => {
    const map = new Map<string, TripRoomMember>();
    for (const m of namedMembers) map.set(m.userId, m);
    return map;
  }, [namedMembers]);

  const balances = React.useMemo(
    () => computeBalances(expenses, memberIds),
    [expenses, memberIds],
  );

  /* ---- settled transfers (v21.9): confirmed «done» settlements ---- */
  const settledList = useGroupExpenses((s) => s.settled[room.bookingId]) ?? [];
  const markSettled = useGroupExpenses((s) => s.markSettled);
  const unsetSettlement = useGroupExpenses((s) => s.unsetSettlement);
  const clearSettled = useGroupExpenses((s) => s.clearSettled);

  /** Effective balances = ledger minus confirmed transfers. */
  const effectiveBalances = React.useMemo(
    () => applySettled(balances, settledList),
    [balances, settledList],
  );
  const remainingSettlements = React.useMemo(
    () => computeSettlements(effectiveBalances),
    [effectiveBalances],
  );
  /* summary card reflects confirmed settlements (effective net) */
  const myBalance = effectiveBalances.find((b) => b.userId === ME_ID);

  const canWriteLedger = canWrite; // alias for the settlement gates below
  const [historyOpen, setHistoryOpen] = React.useState(false);

  /* ---- یادآوری تسویه (v21.9.2): نُج به بدهکار با خنک‌شدن ۹۰ ثانیه‌ای ---- */
  const [remindLog, setRemindLog] = React.useState<Record<string, number>>({});
  const REMIND_COOLDOWN_MS = 90_000;

  /** برای بدهکارِ این انتقال یک نوتیفیکیشن یادآوری بفرست (با سینک بین‌تبی، تبِ او فوراً می‌گیرد). */
  function handleRemind(s: Settlement) {
    const now = Date.now();
    if (now - (remindLog[s.fromId] ?? 0) < REMIND_COOLDOWN_MS) return;
    const from = memberById.get(s.fromId);
    const to = memberById.get(s.toId);
    setRemindLog((m) => ({ ...m, [s.fromId]: now }));
    useNotifications.getState().add({
      type: "social",
      title: "🔔 یادآوری تسویه",
      body: `${room.tourTitle} — ${formatCurrency(s.amount)} به ${to?.name ?? "عضو"} بدهکاری.`,
    });
    toast.success(`یادآوری برای ${from?.name ?? "عضو"} ارسال شد`, {
      description: "نوتیفیکیشن برایش ثبت شد.",
      icon: "🔔",
    });
    track("settlement_reminded", {
      bookingId: room.bookingId,
      amount: s.amount,
    });
  }

  /** علامت‌گذاری یک انتقال به‌عنوان انجام‌شده (هر عضوِ دیده‌کننده می‌تواند تأیید کند). */
  function handleMarkSettled(s: Settlement) {
    if (!canWriteLedger) return;
    const fromName = memberById.get(s.fromId)?.name ?? "عضو";
    const toName = memberById.get(s.toId)?.name ?? "عضو";
    markSettled(room.bookingId, {
      fromId: s.fromId,
      toId: s.toId,
      amount: s.amount,
      byId: ME_ID,
      byName: memberById.get(ME_ID)?.name ?? "شما",
    });
    toast.success(`تسویه ${fromName} ← ${toName} ثبت شد`, {
      description: "موجودی‌ها به‌روز شدند.",
      icon: "🤝",
    });
    track("settlement_marked_paid", {
      bookingId: room.bookingId,
      amount: s.amount,
    });
  }

  /** برگرداندن یک تسویه‌ی ثبت‌شده — فقط ثبت‌کننده یا لیدر/ادمین. */
  function handleUnsetSettlement(t: SettledTransfer) {
    const mine = t.byId === ME_ID;
    if (!mine && access !== "leader" && access !== "admin") return;
    unsetSettlement(room.bookingId, t.id);
    toast.success("ثبت تسویه برداشته شد", { icon: "↩️" });
    track("settlement_undone", {
      bookingId: room.bookingId,
      amount: t.amount,
      byModerator: !mine,
    });
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = memberIds.length ? Math.round(total / memberIds.length) : 0;

  const byCategory = React.useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const budgetCount = budgets ? Object.keys(budgets).length : 0;
  const [budgetOpen, setBudgetOpen] = React.useState(false);

  // ---- filter + sort state for the expense list ----
  type SortKey = "newest" | "amount" | "alpha";
  const [filterCat, setFilterCat] = React.useState<ExpenseCategory | "all">("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("newest");

  const visibleExpenses = React.useMemo(() => {
    const list = expenses.filter((e) => filterCat === "all" || e.category === filterCat);
    const sorted = [...list];
    if (sortKey === "amount") sorted.sort((a, b) => b.amount - a.amount);
    else if (sortKey === "alpha")
      sorted.sort((a, b) => a.title.localeCompare(b.title, "fa"));
    // "newest" keeps the store's natural insertion order (newest first)
    return sorted;
  }, [expenses, filterCat, sortKey]);

  const catCount = React.useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return map;
  }, [expenses]);

  const handleExportCsv = () => {
    const rows: (string | number)[][] = [
      ["عنوان", "مبلغ (تومان)", "دسته", "پرداخت‌کننده", "نوع تقسیم", "تعداد شریک", "سهم هر نفر (تومان)", "تاریخ"],
      ...expenses.map((e) => [
        e.title,
        e.amount,
        EXPENSE_CATEGORIES[e.category].label,
        memberById.get(e.payerId)?.name ?? "عضو",
        e.shares ? "سفارشی" : "مساوی",
        e.participants.length,
        e.shares ? "—" : Math.round(e.amount / Math.max(1, e.participants.length)),
        toPersianShortDate(e.createdAt),
      ]),
      [],
      ["مجموع", total],
    ];
    downloadCsv(`koch-expenses-${room.bookingId}.csv`, rows);
    track("expenses_exported", {
      bookingId: room.bookingId,
      count: expenses.length,
      total,
    });
    toast.success("خروجی CSV دانلود شد");
  };

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GroupExpense | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (e: GroupExpense) => {
    setEditing(e);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* ===== summary ===== */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10">
              <Wallet className="h-3.5 w-3.5 text-primary" />
            </span>
            مجموع هزینه گروه
          </div>
          <p className="mt-2 text-lg font-extrabold tabular-nums text-primary">
            {formatCurrency(total)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {toFa(expenses.length)} هزینه ثبت شده
          </p>
        </div>
        <div className="rounded-3xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-gold/10">
              <Users className="h-3.5 w-3.5 text-gold" />
            </span>
            سهم هر نفر
          </div>
          <p className="mt-2 text-lg font-extrabold tabular-nums">{formatCurrency(perPerson)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            تقسیم مساوی بین {toFa(memberIds.length)} نفر
          </p>
        </div>
        <div
          className={cn(
            "rounded-3xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
            myBalance && myBalance.net > 1 &&
              "border-emerald/40 bg-gradient-to-br from-emerald/10 to-card",
            myBalance && myBalance.net < -1 &&
              "border-sunset/40 bg-gradient-to-br from-sunset/10 to-card",
          )}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-xl",
                myBalance && myBalance.net > 1
                  ? "bg-emerald/10"
                  : myBalance && myBalance.net < -1
                    ? "bg-sunset/10"
                    : "bg-muted",
              )}
            >
              <Scale
                className={cn(
                  "h-3.5 w-3.5",
                  myBalance && myBalance.net > 1 && "text-emerald",
                  myBalance && myBalance.net < -1 && "text-sunset",
                )}
              />
            </span>
            موجودی من
          </div>
          {myBalance ? (
            <>
              <p
                className={cn(
                  "mt-2 flex items-center gap-1.5 text-lg font-extrabold tabular-nums",
                  myBalance.net > 1 && "text-emerald",
                  myBalance.net < -1 && "text-sunset",
                  Math.abs(myBalance.net) <= 1 && "text-foreground",
                )}
              >
                {myBalance.net > 1 && <ArrowDownLeft className="h-4 w-4" />}
                {myBalance.net < -1 && <ArrowUpRight className="h-4 w-4" />}
                {formatCurrency(Math.abs(myBalance.net))}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {myBalance.net > 1
                  ? "باید بهت پس بدن"
                  : myBalance.net < -1
                    ? "باید بدی"
                    : "تسویه — بدهی نداری"}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* ===== category breakdown + budgets ===== */}
      {byCategory.length > 0 && (
        <div className="rounded-3xl border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold">تفکیک بر اساس دسته</h4>
            {canWrite && (
              <Button
                size="sm"
                variant={budgetCount > 0 ? "outline" : "ghost"}
                onClick={() => setBudgetOpen(true)}
                className="gap-1.5 text-[11px]"
                aria-label="تنظیم بودجه دسته‌ها"
              >
                <PiggyBank className="h-3.5 w-3.5" />
                {budgetCount > 0
                  ? `بودجه‌ها (${toFa(budgetCount)})`
                  : "تنظیم بودجه"}
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {byCategory.map(([cat, amount]) => {
              const meta = EXPENSE_CATEGORIES[cat];
              const Icon = CATEGORY_ICONS[cat];
              const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
              const budget = budgets?.[cat];
              const budgetPct = budget ? Math.min(100, Math.round((amount / budget) * 100)) : 0;
              const overBudget = budget !== undefined && amount > budget;
              const remaining = budget !== undefined ? budget - amount : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105",
                      meta.chip,
                      overBudget && "ring-1 ring-sunset/40",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                      <span className="flex min-w-0 items-center gap-1.5 font-bold">
                        <span className="truncate">{meta.label}</span>
                        {overBudget && (
                          <span
                            className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-sunset/10 px-1.5 py-px text-[9px] font-bold text-sunset"
                            title="از بودجه عبور کرده"
                          >
                            <TriangleAlert className="h-2.5 w-2.5" />
                            عبور از بودجه
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatCurrency(amount)} · ٪{toFa(pct)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", meta.bar)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {/* budget track — only for categories with a budget */}
                    {budget !== undefined && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-emerald/10">
                          <motion.div
                            className={cn(
                              "h-full rounded-full transition-all",
                              overBudget ? "bg-sunset" : "bg-emerald",
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${budgetPct}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-[9px] font-bold tabular-nums",
                            overBudget ? "text-sunset" : "text-emerald",
                          )}
                        >
                          {overBudget
                            ? `${formatCurrency(Math.abs(remaining))} بیشتر از بودجه`
                            : `${formatCurrency(remaining)} از بودجه مانده`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== settlements (v21.9: suggestions + confirm-as-paid + history) ===== */}
      {(remainingSettlements.length > 0 || settledList.length > 0) && (
        <div className="overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-b from-gold/[0.06] to-card p-4 shadow-sm">
          {/* header */}
          <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-gold">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-gold/15">
                <HandCoins className="h-3.5 w-3.5" aria-hidden />
              </span>
              پیشنهاد تسویه
            </h4>
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
              {toFa(settledList.length)} از{" "}
              {toFa(settledList.length + remainingSettlements.length)} انتقال
              انجام شده
            </span>
          </div>
          <p className="mb-3 text-[10px] leading-5 text-muted-foreground">
            {remainingSettlements.length > 0
              ? "کمترین تعداد انتقال برای صفر شدن بدهی‌ها — وقتی پول را دادی، تیکش را بزن"
              : "همه‌ی انتقال‌ها انجام شده — دفتر صفر شد!"}
          </p>

          {/* progress track — settled vs remaining */}
          <div
            className="mb-4 h-1.5 overflow-hidden rounded-full bg-gold/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={settledList.length + remainingSettlements.length}
            aria-valuenow={settledList.length}
            aria-label="پیشرفت تسویه گروه"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-gold via-gold to-emerald"
              initial={{ width: 0 }}
              animate={{
                width:
                  settledList.length + remainingSettlements.length > 0
                    ? `${(settledList.length / (settledList.length + remainingSettlements.length)) * 100}%`
                    : "0%",
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* remaining suggested transfers */}
          {remainingSettlements.length > 0 && (
            <ul className="space-y-2">
              {remainingSettlements.map((s, i) => {
                const from = memberById.get(s.fromId);
                const to = memberById.get(s.toId);
                const mineToPay = s.fromId === ME_ID;
                const reminded = Date.now() - (remindLog[s.fromId] ?? 0) < REMIND_COOLDOWN_MS;
                return (
                  <motion.li
                    key={`${s.fromId}-${s.toId}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "group flex flex-wrap items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-xs transition-colors",
                      mineToPay
                        ? "border-sunset/30 hover:border-sunset/50"
                        : "border-gold/20 hover:border-gold/40",
                    )}
                  >
                    {mineToPay && (
                      <span className="rounded-full bg-sunset/10 px-2 py-0.5 text-[9px] font-black text-sunset">
                        از تو
                      </span>
                    )}
                    {/* v21.9.2: جفت‌آواتار برای خوانایی سریع‌تر از متن */}
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Avatar className="h-6 w-6 shrink-0 ring-1 ring-border">
                        {from?.avatar && (
                          <AvatarImage src={from.avatar} alt={from.name} />
                        )}
                        <AvatarFallback className="bg-secondary text-[9px] font-bold">
                          {(from?.name ?? "؟").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate font-bold">
                        {from?.name ?? "عضو"}
                      </span>
                    </span>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-sunset/10">
                      <ArrowUpRight className="h-3 w-3 text-sunset" />
                    </span>
                    <span className="rounded-full bg-primary/[0.06] px-2 py-0.5 font-extrabold tabular-nums text-primary">
                      {formatCurrency(s.amount)}
                    </span>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald/10">
                      <ArrowDownLeft className="h-3 w-3 text-emerald" />
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Avatar className="h-6 w-6 shrink-0 ring-1 ring-border">
                        {to?.avatar && (
                          <AvatarImage src={to.avatar} alt={to.name} />
                        )}
                        <AvatarFallback className="bg-secondary text-[9px] font-bold">
                          {(to?.name ?? "؟").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate font-bold">{to?.name ?? "عضو"}</span>
                    </span>
                    <span className="text-muted-foreground">بدهد</span>

                    {/* یادآوری (v21.9.2) — فقط وقتی بدهکار خودت نیستی */}
                    {!mineToPay && canWriteLedger && (
                      <button
                        type="button"
                        onClick={() => handleRemind(s)}
                        disabled={reminded}
                        aria-label={`یادآوری بدهی به ${from?.name ?? "عضو"}`}
                        className={cn(
                          "flex items-center gap-1 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-[10px] font-bold text-gold transition",
                          reminded
                            ? "cursor-default opacity-50"
                            : "hover:bg-gold hover:text-foreground",
                          "max-sm:opacity-100 sm:opacity-60 sm:group-hover:opacity-100",
                        )}
                      >
                        <BellRing className="h-3.5 w-3.5" />
                        {reminded ? "ارسال شد" : "یادآوری"}
                      </button>
                    )}

                    {/* confirm-as-paid */}
                    {canWriteLedger && (
                      <button
                        type="button"
                        onClick={() => handleMarkSettled(s)}
                        aria-label={`علامت‌گذاری انتقال ${from?.name ?? ""} به ${to?.name ?? ""} به‌عنوان انجام‌شده`}
                        className={cn(
                          "ms-auto flex items-center gap-1 rounded-full border border-emerald/30 bg-emerald/5 px-2.5 py-1 text-[10px] font-bold text-emerald transition hover:bg-emerald hover:text-white",
                          "max-sm:opacity-100 sm:opacity-60 sm:group-hover:opacity-100",
                        )}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        انجام شد
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}

          {/* celebration — every transfer confirmed */}
          {remainingSettlements.length === 0 && settledList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald/25 bg-gradient-to-br from-emerald/10 to-card p-4 text-center"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald/15">
                <PartyPopper className="h-5 w-5 text-emerald" aria-hidden />
              </span>
              <p className="text-sm font-extrabold text-emerald">
                همه‌ی تسویه‌ها انجام شد 🎉
              </p>
              <p className="text-[10px] leading-5 text-muted-foreground">
                دفتر هزینه‌های گروه صفر است — حساب‌ها دوطرفه پاک شدند.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  clearSettled(room.bookingId);
                  toast.success("دور تسویه‌ی تازه شروع شد");
                  track("settlement_history_cleared", {
                    bookingId: room.bookingId,
                  });
                }}
                className="mt-1 gap-1.5 text-[11px]"
              >
                <Undo2 className="h-3.5 w-3.5" />
                شروع دور تسویه‌ی تازه
              </Button>
            </motion.div>
          )}

          {/* settled history (undo-able) */}
          {settledList.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                aria-expanded={historyOpen}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-1 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:text-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" aria-hidden />
                  تسویه‌شده‌ها ({toFa(settledList.length)})
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    historyOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {historyOpen && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5 pt-1.5">
                      {settledList.map((t) => {
                        const from = memberById.get(t.fromId);
                        const to = memberById.get(t.toId);
                        const canUndo =
                          t.byId === ME_ID ||
                          access === "leader" ||
                          access === "admin";
                        return (
                          <li
                            key={t.id}
                            className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald/15 bg-emerald/[0.04] px-2.5 py-1.5 text-[11px]"
                          >
                            <CheckCircle2
                              className="h-3.5 w-3.5 shrink-0 text-emerald"
                              aria-hidden
                            />
                            <span>{from?.name ?? "عضو"}</span>
                            <ArrowUpRight className="h-3 w-3 text-sunset" />
                            <span className="font-extrabold tabular-nums text-emerald">
                              {formatCurrency(t.amount)}
                            </span>
                            <ArrowDownLeft className="h-3 w-3 text-emerald" />
                            <span>{to?.name ?? "عضو"}</span>
                            <span className="text-[9px] text-muted-foreground">
                              {toPersianShortDate(t.at)} · توسط {t.byName}
                            </span>
                            {canUndo && (
                              <button
                                type="button"
                                onClick={() => handleUnsetSettlement(t)}
                                aria-label="برداشتن ثبت تسویه"
                                className="ms-auto grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-sunset/10 hover:text-sunset"
                              >
                                <Undo2 className="h-3 w-3" />
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </div>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ===== expense list ===== */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold">
            هزینه‌ها
            <span className="mr-1.5 text-[10px] font-medium text-muted-foreground">
              ({toFa(visibleExpenses.length)} از {toFa(expenses.length)})
            </span>
          </h4>
          <div className="flex items-center gap-1.5">
            {expenses.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCsv}
                className="gap-1.5 text-[11px]"
                aria-label="خروجی CSV"
                title="خروجی CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="max-sm:hidden">خروجی CSV</span>
              </Button>
            )}
            {expenses.length > 1 && (
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger
                  size="sm"
                  className="h-8 w-[7.5rem] gap-1 text-[11px]"
                  aria-label="مرتب‌سازی"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">جدیدترین</SelectItem>
                  <SelectItem value="amount">بزرگ‌ترین مبلغ</SelectItem>
                  <SelectItem value="alpha">بر اساس عنوان</SelectItem>
                </SelectContent>
              </Select>
            )}
            {canWrite && (
              <Button size="sm" onClick={openAdd} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                افزودن هزینه
              </Button>
            )}
          </div>
        </div>

        {/* ---- category filter chips ---- */}
        {expenses.length > 0 && (
          <div
            role="group"
            aria-label="فیلتر دسته"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <FilterChip
              active={filterCat === "all"}
              onClick={() => setFilterCat("all")}
              label={`همه (${toFa(expenses.length)})`}
            />
            {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[])
              .filter((k) => (catCount.get(k) ?? 0) > 0)
              .map((k) => (
                <FilterChip
                  key={k}
                  active={filterCat === k}
                  onClick={() => setFilterCat(filterCat === k ? "all" : k)}
                  label={`${EXPENSE_CATEGORIES[k].label} (${toFa(catCount.get(k) ?? 0)})`}
                />
              ))}
          </div>
        )}

        {visibleExpenses.length === 0 ? (
          expenses.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 p-8 text-center text-xs text-muted-foreground">
              <Wallet className="mb-2 h-6 w-6 opacity-50" />
              هنوز هزینه‌ای ثبت نشده — اولین هزینه گروه را اضافه کن.
            </div>
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 p-6 text-center text-xs text-muted-foreground">
              هزینه‌ای در این دسته نیست.
            </div>
          )
        ) : (
          <AnimatePresence initial={false}>
            {visibleExpenses.map((e, i) => {
              const meta = EXPENSE_CATEGORIES[e.category];
              const Icon = CATEGORY_ICONS[e.category];
              const payer = memberById.get(e.payerId);
              const canManage =
                e.addedBy === ME_ID || access === "leader" || access === "admin";
              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                  className="group flex items-center gap-3 rounded-2xl border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-transform group-hover:scale-105",
                      meta.chip,
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{e.title}</p>
                    <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                      <span className="truncate">
                        {payer?.name ?? "عضو"} پرداخت کرد · بین{" "}
                        {toFa(e.participants.length)} نفر · {toPersianShortDate(e.createdAt)}
                      </span>
                      {e.editedAt && (
                        <span
                          className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gold/10 px-1.5 py-px text-[9px] font-bold text-gold"
                          title={`آخرین ویرایش توسط ${e.editedByName ?? "نامشخص"} · ${toPersianShortDate(e.editedAt)}`}
                        >
                          <Pencil className="h-2 w-2" />
                          ویرایش‌شده{e.editedByName ? ` توسط ${e.editedByName.split(/\s+/)[0]}` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="text-sm font-extrabold tabular-nums">{formatCurrency(e.amount)}</p>
                    <p className="text-[10px] tabular-nums text-muted-foreground">
                      {e.shares
                        ? e.shares[ME_ID] !== undefined
                          ? `سهم من ${formatCurrency(Math.round(e.shares[ME_ID]))}`
                          : "تقسیم سفارشی"
                        : `سهم هر نفر ${formatCurrency(Math.round(e.amount / Math.max(1, e.participants.length)))}`}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEdit(e)}
                        aria-label="ویرایش هزینه"
                        title="ویرایش هزینه"
                        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-[''] max-sm:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          removeExpense(room.bookingId, e.id);
                          toast.success("هزینه حذف شد");
                        }}
                        aria-label="حذف هزینه"
                        title="حذف هزینه"
                        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-[''] max-sm:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <ExpenseDialog
        room={room}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={(payload) => {
          if (editing) {
            updateExpense(
              room.bookingId,
              editing.id,
              payload,
              memberById.get(ME_ID)?.name ?? "شما",
            );
            track("expense_updated", {
              bookingId: room.bookingId,
              amount: payload.amount,
              category: payload.category,
            });
            toast.success("هزینه ویرایش شد", { description: payload.title });
          } else {
            addExpense({ ...payload, bookingId: room.bookingId, addedBy: ME_ID });
            if (payload.shares) {
              track("expense_custom_split", {
                bookingId: room.bookingId,
                amount: payload.amount,
                participants: payload.participants.length,
              });
            }
            track("expense_added", {
              bookingId: room.bookingId,
              amount: payload.amount,
              category: payload.category,
            });
            toast.success("هزینه ثبت شد", { description: payload.title });
          }
          setDialogOpen(false);
          setEditing(null);
        }}
      />

      <BudgetDialog
        open={budgetOpen}
        onOpenChange={setBudgetOpen}
        bookingId={room.bookingId}
        current={budgets ?? {}}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Compact filter chip for the category bar. */
function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold transition",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

/**
 * BudgetDialog — per-category budget editor (v21.4).
 *
 * One optional amount per category (تومان). Empty input clears the budget
 * for that category. Saved as a diff so untouched categories keep their
 * stored value, and cleared cells are removed from the record.
 */
function BudgetDialog({
  open,
  onOpenChange,
  bookingId,
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  current: ExpenseBudgets;
}) {
  const setBudget = useGroupExpenses((s) => s.setBudget);
  // local draft: category -> raw input string ("" = cleared)
  const [draft, setDraft] = React.useState<Partial<Record<ExpenseCategory, string>>>({});

  // Re-seed the draft from the stored budgets every time the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    const seed: Partial<Record<ExpenseCategory, string>> = {};
    for (const k of Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]) {
      seed[k] = current[k] !== undefined ? String(current[k]) : "";
    }
    setDraft(seed);
    // `current` intentionally omitted — dialog state is per-open snapshot
    // (same pattern as ExpenseDialog, lesson from v21.2).
  }, [open]);

  const handleSave = () => {
    let changed = 0;
    for (const k of Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]) {
      const raw = (draft[k] ?? "").replace(/[^\d]/g, "");
      const nextAmount = raw ? Number(raw) : null;
      const stored = current[k] ?? null;
      if (nextAmount !== stored) {
        setBudget(bookingId, k, nextAmount);
        changed += 1;
      }
    }
    if (changed > 0) {
      track("expense_budget_set", { bookingId, changed });
      toast.success("بودجه‌ها ذخیره شد");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald/10">
              <PiggyBank className="h-4 w-4 text-emerald" />
            </span>
            بودجه‌بندی دسته‌ها
          </DialogTitle>
          <DialogDescription>
            برای هر دسته یک سقف هزینه تعیین کن؛ پیشرفت خرج گروه نسبت به بودجه
            نمایش داده می‌شود. خالی گذاشتن یعنی بدون بودجه.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map((k) => {
            const meta = EXPENSE_CATEGORIES[k];
            const Icon = CATEGORY_ICONS[k];
            const raw = draft[k] ?? "";
            return (
              <div
                key={k}
                className="flex items-center gap-2.5 rounded-2xl border bg-muted/30 p-2.5 transition-colors focus-within:border-emerald/50"
              >
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", meta.chip)}>
                  <Icon className="h-4 w-4" />
                </span>
                <Label className="w-20 shrink-0 text-[11px] font-bold">
                  {meta.label}
                </Label>
                <Input
                  value={raw}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [k]: e.target.value.replace(/[^\d]/g, "") }))
                  }
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="بدون بودجه"
                  className="h-8 flex-1 text-left text-xs"
                  aria-label={`بودجه ${meta.label}`}
                />
                <span className="w-10 shrink-0 text-left text-[10px] font-bold text-muted-foreground">
                  تومان
                </span>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            className="bg-emerald text-white hover:bg-emerald-dark"
            onClick={handleSave}
          >
            ذخیره بودجه‌ها
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ExpenseDialogProps {
  room: TripRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this expense instead of creating a new one. */
  initial?: GroupExpense | null;
  onSave: (payload: {
    payerId: string;
    amount: number;
    title: string;
    category: ExpenseCategory;
    participants: string[];
    /** set in custom (unequal) split mode; `undefined` = equal split.
     *  Passing explicit undefined on edit clears a previous custom split. */
    shares?: Record<string, number>;
  }) => void;
}

function ExpenseDialog({
  room,
  open,
  onOpenChange,
  initial,
  onSave,
}: ExpenseDialogProps) {
  const isEdit = Boolean(initial);

  // real identity for the «شما» roster entry
  const namedMembers = useNamedMembers(room);
  const memberIds = React.useMemo(
    () => namedMembers.map((m) => m.userId),
    [namedMembers],
  );
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<ExpenseCategory>("food");
  const [payerId, setPayerId] = React.useState<string>(ME_ID);
  const [participants, setParticipants] = React.useState<string[]>([]);
  // split mode (v21.5): "equal" divides amount/n; "custom" lets the user
  // type each participant's share which must sum exactly to the amount.
  type SplitMode = "equal" | "custom";
  const [splitMode, setSplitMode] = React.useState<SplitMode>("equal");
  const [shareDrafts, setShareDrafts] = React.useState<Record<string, string>>({});

  // Reset the form EVERY time the dialog opens — add mode starts clean,
  // edit mode starts from the expense being edited (lesson from v21.2:
  // stale form state after reopen was a UX bug).
  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setAmount(String(initial.amount));
      setCategory(initial.category);
      setPayerId(initial.payerId);
      // drop stale participant ids that are no longer in the roster
      const roster = new Set(memberIds);
      const parts = initial.participants.filter((p) => roster.has(p));
      setParticipants(parts);
      if (initial.shares) {
        setSplitMode("custom");
        const drafts: Record<string, string> = {};
        for (const p of parts) {
          if (initial.shares[p] !== undefined) drafts[p] = String(initial.shares[p]);
        }
        setShareDrafts(drafts);
      } else {
        setSplitMode("equal");
        setShareDrafts({});
      }
    } else {
      setTitle("");
      setAmount("");
      setCategory("food");
      setPayerId(ME_ID);
      setParticipants(memberIds);
      setSplitMode("equal");
      setShareDrafts({});
    }
    // memberIds/namedMembers intentionally omitted: reset only on `open`
    // transitions; the roster is stable for the lifetime of the dialog.
  }, [open, initial]);

  const amountNum = Number(amount.replace(/[^\d]/g, "")) || 0;

  // ---- custom split live validation ----
  const sharesSum = participants.reduce(
    (s, id) => s + (Number((shareDrafts[id] ?? "").replace(/[^\d]/g, "")) || 0),
    0,
  );
  const sharesDelta = amountNum - sharesSum; // >0 → remaining, <0 → over
  const customBalanced =
    amountNum > 0 && participants.length > 0 && sharesDelta === 0;
  const valid =
    title.trim().length > 1 &&
    amountNum > 0 &&
    participants.length > 0 &&
    (splitMode === "equal" || customBalanced);

  /** پُل کردن سهم‌ها به‌صورت مساوی (باقیمانده به نفر آخر) — نقطه شروع خوب برای ویرایش دستی. */
  const equalizeShares = () => {
    if (amountNum <= 0 || participants.length === 0) return;
    const base = Math.floor(amountNum / participants.length);
    const drafts: Record<string, string> = {};
    let assigned = 0;
    participants.forEach((id, i) => {
      const v = i === participants.length - 1 ? amountNum - assigned : base;
      drafts[id] = String(v);
      assigned += v;
    });
    setShareDrafts(drafts);
  };

  const switchMode = (mode: SplitMode) => {
    setSplitMode(mode);
    if (mode === "custom") {
      // start from an equal distribution so the sum is already balanced
      if (amountNum > 0 && participants.length > 0) equalizeShares();
    } else {
      setShareDrafts({});
    }
  };

  const toggle = (id: string) =>
    setParticipants((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const allSelected = participants.length === memberIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10">
                <Pencil className="h-4 w-4 text-primary" />
              </span>
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
              </span>
            )}
            {isEdit ? "ویرایش هزینه" : "افزودن هزینه گروهی"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "مشخصات هزینه را ویرایش کن؛ سهم‌ها و تسویه‌ها خودکار به‌روز می‌شوند."
              : splitMode === "custom"
                ? "سهم هر نفر را دستی وارد کن؛ مجموع سهم‌ها باید با مبلغ برابر شود."
                : "هزینه به‌طور مساوی بین افراد انتخاب‌شده تقسیم می‌شود."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
              عنوان
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: ناهار کنار دریاچه"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                مبلغ (تومان)
              </Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                dir="ltr"
                placeholder="250000"
                className="text-left"
              />
              {amountNum > 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatCurrency(amountNum)}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                دسته
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map((k) => {
                    const Icon = CATEGORY_ICONS[k];
                    return (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {EXPENSE_CATEGORIES[k].label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
              پرداخت‌کننده
            </Label>
            <Select value={payerId} onValueChange={setPayerId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {namedMembers.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name}
                    {m.role === "leader" ? " (لیدر)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ---- split mode segmented control (v21.5) ---- */}
          <div>
            <Label className="mb-1.5 block text-xs font-bold text-muted-foreground">
              نحوه تقسیم
            </Label>
            <div
              role="group"
              aria-label="نحوه تقسیم"
              className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1"
            >
              <button
                type="button"
                onClick={() => switchMode("equal")}
                aria-pressed={splitMode === "equal"}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  splitMode === "equal"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Equal className="h-3.5 w-3.5" />
                مساوی
              </button>
              <button
                type="button"
                onClick={() => switchMode("custom")}
                aria-pressed={splitMode === "custom"}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  splitMode === "custom"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                سفارشی
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground">
                تقسیم بین
              </Label>
              <button
                type="button"
                onClick={() =>
                  setParticipants(allSelected ? [] : memberIds)
                }
                className="text-[11px] font-bold text-primary hover:underline"
              >
                {allSelected ? "هیچ‌کدام" : "انتخاب همه"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-muted/30 p-2.5 max-sm:grid-cols-1">
              {namedMembers.map((m) => {
                const checked = participants.includes(m.userId);
                return (
                  <label
                    key={m.userId}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border bg-card px-2.5 py-2 text-xs transition",
                      checked ? "border-primary/50 shadow-sm" : "opacity-70",
                    )}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(m.userId)} />
                    <span className="truncate font-semibold">{m.name}</span>
                    {m.role === "leader" && (
                      <span className="mr-auto text-[9px] font-bold text-gold">لیدر</span>
                    )}
                  </label>
                );
              })}
            </div>
            {amountNum > 0 && participants.length > 0 && splitMode === "equal" && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                سهم هر نفر:{" "}
                <span className="font-bold text-foreground">
                  {formatCurrency(Math.round(amountNum / participants.length))}
                </span>
              </p>
            )}

            {/* ---- custom split inputs (v21.5) ---- */}
            {splitMode === "custom" && (
              <div className="mt-2 space-y-2 rounded-2xl border bg-muted/30 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                    سهم هر نفر (تومان)
                  </span>
                  <button
                    type="button"
                    onClick={equalizeShares}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    تقسیم خودکار مساوی
                  </button>
                </div>
                {participants.length === 0 ? (
                  <p className="py-2 text-center text-[11px] text-muted-foreground">
                    اول افراد را از لیست بالا انتخاب کن.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {participants.map((id) => {
                      const m = namedMembers.find((mm) => mm.userId === id);
                      const raw = shareDrafts[id] ?? "";
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 rounded-xl border bg-card px-2.5 py-1.5 transition-colors focus-within:border-primary/50"
                        >
                          <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                            {m?.name ?? "عضو"}
                          </span>
                          <Input
                            value={raw}
                            onChange={(e) =>
                              setShareDrafts((d) => ({
                                ...d,
                                [id]: e.target.value.replace(/[^\d]/g, ""),
                              }))
                            }
                            inputMode="numeric"
                            dir="ltr"
                            placeholder="0"
                            className="h-7 w-28 text-left text-xs tabular-nums"
                            aria-label={`سهم ${m?.name ?? "عضو"}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {amountNum > 0 && (
                  <div className="space-y-1 border-t border-border/60 pt-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">مجموع سهم‌ها</span>
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          customBalanced
                            ? "text-emerald"
                            : sharesDelta > 0
                              ? "text-gold"
                              : "text-sunset",
                        )}
                      >
                        {formatCurrency(sharesSum)} از {formatCurrency(amountNum)}
                      </span>
                    </div>
                    {customBalanced ? (
                      <p className="flex items-center gap-1 text-[10px] font-bold text-emerald">
                        <Check className="h-3 w-3" />
                        تسویه دقیق — آماده ثبت
                      </p>
                    ) : sharesDelta > 0 ? (
                      <p className="text-[10px] font-bold text-gold">
                        {formatCurrency(sharesDelta)} هنوز تخصیص نیافته
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-sunset">
                        {formatCurrency(-sharesDelta)} بیشتر از مبلغ هزینه
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            disabled={!valid}
            className="bg-primary text-primary-foreground"
            onClick={() => {
              if (!valid) return;
              onSave({
                payerId,
                amount: amountNum,
                title: title.trim(),
                category,
                participants,
                ...(splitMode === "custom"
                  ? {
                      shares: Object.fromEntries(
                        participants.map((id) => [
                          id,
                          Number((shareDrafts[id] ?? "").replace(/[^\d]/g, "")) || 0,
                        ]),
                      ),
                    }
                  : { shares: undefined }),
              });
            }}
          >
            {isEdit ? "ذخیره تغییرات" : "ثبت هزینه"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
