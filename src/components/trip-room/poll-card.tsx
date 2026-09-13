"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Lock, Trophy, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { TripRoom } from "@/types/trip-room";
import { useTripRoom, resolveAccessLevel, ME_ID } from "@/store/trip-room-store";
import { toFa } from "@/lib/format";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

/** Polls tab — spec §2. Single-choice polls, results inline + donut chart. */
export function PollCard({ room, pollId }: { room: TripRoom; pollId: string }) {
  const vote = useTripRoom((s) => s.votePoll);
  const closePoll = useTripRoom((s) => s.closePoll);
  const access = resolveAccessLevel(room);
  const canClose = access === "leader" || access === "admin";
  const poll = room.polls.find((p) => p.id === pollId);
  // Open polls hide the donut by default — members opt in via «نمودار نتایج».
  // Closed polls always show it (final results).
  const [openChart, setOpenChart] = React.useState(false);
  const chartViewedRef = React.useRef(false);
  if (!poll) return null;

  const totalVotes = poll.options.reduce((s, o) => s + o.voterIds.length, 0);
  const myVote = poll.options.find((o) => o.voterIds.includes(ME_ID))?.id;
  const isClosed = poll.closed === true;

  // Find winner (option with most votes)
  const winner = poll.options.reduce((a, b) =>
    a.voterIds.length > b.voterIds.length ? a : b,
  );
  const hasVotes = totalVotes > 0;
  const isTie = poll.options.filter((o) => o.voterIds.length === winner.voterIds.length).length > 1;

  // Donut chart colors — cycle through a palette
  const DONUT_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444", "#06b6d4"];

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm",
        isClosed && "border-muted",
      )}
    >
      {/* header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
            <BarChart3 className="h-3.5 w-3.5" />
          </span>
          <h4 className="text-sm font-bold">{poll.question}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          {isClosed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
              <Lock className="h-2.5 w-2.5" />
              بسته‌شده
            </span>
          )}
          {!isClosed && canClose && hasVotes && (
            <button
              type="button"
              onClick={() => closePoll(room.bookingId, poll.id)}
              className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground transition hover:bg-muted/70"
            >
              بستن نظرسنجی
            </button>
          )}
        </div>
      </div>

      {/* options */}
      <ul className="space-y-2">
        {poll.options.map((o, i) => {
          const count = o.voterIds.length;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const mine = o.id === myVote;
          const isWinner = isClosed && hasVotes && o.id === winner.id && !isTie;
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={isClosed}
                onClick={() => vote(room.bookingId, poll.id, o.id, ME_ID)}
                className={cn(
                  "relative w-full overflow-hidden rounded-xl border px-3 py-2 text-right text-sm transition",
                  isClosed && "cursor-default",
                  mine
                    ? "border-emerald/40 bg-emerald/5"
                    : "hover:bg-muted/40",
                  isWinner && "border-gold/40",
                )}
              >
                {/* progress bar fill */}
                <motion.div
                  className="absolute inset-y-0 right-0"
                  style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] + "20" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  aria-hidden
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-semibold">
                    {mine && !isClosed && (
                      <Check className="h-3 w-3 text-emerald" />
                    )}
                    {isWinner && (
                      <Trophy className="h-3 w-3 fill-gold text-gold" />
                    )}
                    {o.text}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {toFa(pct)}٪ · {toFa(count)}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* footer: results summary + chart toggle */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          مجموع آرا: {toFa(totalVotes)} ·{" "}
          {isClosed
            ? hasVotes
              ? isTie
                ? "مساوی!"
                : `برنده: ${winner.text}`
              : "بدون رأی"
            : myVote
              ? "رأی ثبت شده"
              : "برای رأی دادن یک گزینه را انتخاب کنید"}
        </p>
        {/* chart toggle for OPEN polls (closed polls always show results) */}
        {!isClosed && hasVotes && (
          <button
            type="button"
            onClick={() => {
              setOpenChart((v) => !v);
              if (!chartViewedRef.current) {
                chartViewedRef.current = true;
                track("poll_chart_viewed", { pollId: poll.id });
              }
            }}
            aria-expanded={openChart}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
          >
            {openChart ? (
              <ChevronUp className="h-2.5 w-2.5" />
            ) : (
              <ChevronDown className="h-2.5 w-2.5" />
            )}
            {openChart ? "بستن نمودار" : "نمودار نتایج"}
          </button>
        )}
      </div>

      {/* results block — donut + legend; always visible when closed with votes,
          collapsible for open polls */}
      <AnimatePresence>
        {(isClosed || openChart) && hasVotes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-muted/30 p-3">
              <PollDonut
                segments={poll.options.map((o, i) => ({
                  value: o.voterIds.length,
                  color: DONUT_COLORS[i % DONUT_COLORS.length],
                  label: o.text,
                }))}
                total={totalVotes}
                size={64}
              />
              <ul className="min-w-[45%] flex-1 space-y-1.5">
                {poll.options.map((o, i) => {
                  const count = o.voterIds.length;
                  if (count === 0) return null;
                  const pct = Math.round((count / totalVotes) * 100);
                  const isWinnerOpt = o.id === winner.id && !isTie;
                  return (
                    <li
                      key={o.id}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {o.text}
                      </span>
                      {isWinnerOpt && (
                        <Trophy className="h-3 w-3 shrink-0 fill-gold text-gold" />
                      )}
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        ٪{toFa(pct)} · {toFa(count)} رأی
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/** Pure-SVG donut chart — no external dependency. */
function PollDonut({
  segments,
  total,
  size = 48,
}: {
  segments: { value: number; color: string; label: string }[];
  total: number;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Build arcs using reduce to avoid reassigning outer variable (React Compiler friendly)
  const arcs = segments
    .filter((s) => s.value > 0)
    .reduce<{ list: typeof segments extends never ? never : { key: number; color: string; dashLength: number; dashOffset: number; pct: number }[]; offset: number }>(
      (acc, s, i) => {
        const fraction = s.value / total;
        const dashLength = fraction * circumference;
        acc.list.push({
          key: i,
          color: s.color,
          dashLength,
          dashOffset: circumference - acc.offset,
          pct: Math.round(fraction * 100),
        });
        acc.offset += dashLength;
        return acc;
      },
      { list: [], offset: 0 },
    ).list;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* background ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={strokeWidth}
      />
      {/* segments */}
      {arcs.map((a) => (
        <motion.circle
          key={a.key}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={a.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${a.dashLength} ${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: a.dashOffset }}
          transition={{ duration: 0.6, delay: a.key * 0.1, ease: "easeOut" }}
          transform={`rotate(-90 ${center} ${center})`}
        />
      ))}
      {/* total in center */}
      <text
        x={center}
        y={center + 3}
        textAnchor="middle"
        fontSize={11}
        fontWeight="bold"
        fill="currentColor"
      >
        {toFa(total)}
      </text>
    </svg>
  );
}
