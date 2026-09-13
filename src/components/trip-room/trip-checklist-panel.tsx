"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ListChecks,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { TripRoom } from "@/types/trip-room";
import { useTripRoom, resolveAccessLevel, ME_ID } from "@/store/trip-room-store";
import { useMe } from "@/hooks/use-me";
import { toFa } from "@/lib/format";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

/**
 * Pre-trip checklist tab — shared between Trip Room (§2) and Safety Center (§4).
 * Each item toggles done state. When all items are done, fire the
 * `safety_checklist_completed` analytics event (§9).
 *
 * v21.9: members can add their own items (gear, meds, snacks…) and remove
 * them again — the adder or a leader/admin. Seed items stay fixed so the
 * safety baseline never shrinks.
 */
export function TripChecklistPanel({ room }: { room: TripRoom }) {
  const toggle = useTripRoom((s) => s.toggleChecklist);
  const addItem = useTripRoom((s) => s.addChecklistItem);
  const removeItem = useTripRoom((s) => s.removeChecklistItem);
  const me = useMe();
  const access = resolveAccessLevel(room);
  const isModerator = access === "leader" || access === "admin";
  const prevAllDone = React.useRef(false);

  const [draft, setDraft] = React.useState("");
  const [justAddedId, setJustAddedId] = React.useState<string | null>(null);
  const composerRef = React.useRef<HTMLInputElement>(null);

  const doneCount = room.checklist.filter((c) => c.done).length;
  const allDone =
    doneCount === room.checklist.length && room.checklist.length > 0;

  React.useEffect(() => {
    if (allDone && !prevAllDone.current) {
      track("safety_checklist_completed", { bookingId: room.bookingId });
    }
    prevAllDone.current = allDone;
  }, [allDone, room.bookingId]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    addItem(room.bookingId, text, me.id, me.name);
    setDraft("");
    composerRef.current?.focus();
    toast.success("به چک‌لیست اضافه شد", { icon: "➕" });
    track("checklist_item_added", { bookingId: room.bookingId });
    // brief highlight of the freshly appended row
    const last = useTripRoom.getState().rooms[room.bookingId]?.checklist.at(-1);
    if (last) {
      setJustAddedId(last.id);
      window.setTimeout(
        () => setJustAddedId((cur) => (cur === last.id ? null : cur)),
        1800,
      );
    }
  }

  function handleRemove(c: { id: string; byId?: string; label: string }) {
    const mine = c.byId === ME_ID;
    if (!mine && !isModerator) return;
    removeItem(room.bookingId, c.id);
    toast.success("آیتم حذف شد");
    track("checklist_item_removed", { bookingId: room.bookingId, byModerator: !mine });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border bg-card p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald/10 text-emerald">
            <ListChecks className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold">چک‌لیست قبل از سفر</p>
            <p className="text-[10px] text-muted-foreground">
              آماده‌سازی گروهی — با هم کاملش کنیم
            </p>
          </div>
        </div>
        <div className="text-left">
          <div className="text-lg font-black text-emerald">
            {toFa(doneCount)} / {toFa(room.checklist.length)}
          </div>
          <div className="text-[10px] text-muted-foreground">آیتم انجام‌شده</div>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-emerald"
          initial={{ width: 0 }}
          animate={{
            width: `${(doneCount / room.checklist.length) * 100}%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {room.checklist.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
              className={cn(
                c.id === justAddedId &&
                  "rounded-2xl ring-2 ring-emerald/40 ring-offset-2 ring-offset-background",
              )}
            >
              <div
                className={cn(
                  "group flex items-center gap-1 rounded-2xl",
                  c.id === justAddedId && "bg-emerald/5",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(room.bookingId, c.id, me.id, me.name)}
                  className={cn(
                    "flex flex-1 items-center gap-3 rounded-2xl border bg-card p-3 text-right transition",
                    c.done
                      ? "border-emerald/30 bg-emerald/5"
                      : "hover:bg-muted/40",
                    // v21.9.2: آیتم‌های دلخواه اعضا خط‌چین‌اند تا با آیتم‌های
                    // ثابتِ خط ایمنی پایه اشتباه گرفته نشوند
                    c.custom && "border-dashed",
                  )}
                >
                  {c.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                  )}
                  <span
                    className={cn(
                      "flex-1 text-sm font-semibold",
                      c.done && "text-muted-foreground line-through",
                    )}
                  >
                    {c.label}
                  </span>
                  {c.custom ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary/80 px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                      <Sparkles className="h-2.5 w-2.5 text-gold" aria-hidden />
                      {c.byId === ME_ID ? "افزوده‌ی تو" : `افزوده‌ی ${c.byName ?? "عضو"}`}
                    </span>
                  ) : null}
                  {c.doneBy && !c.custom && (
                    <span className="text-[10px] text-muted-foreground">
                      توسط {c.doneBy}
                    </span>
                  )}
                </button>

                {/* حذف آیتم دلخواه — اضافه‌کننده یا لیدر/ادمین */}
                {c.custom && (c.byId === ME_ID || isModerator) && (
                  <button
                    type="button"
                    onClick={() => handleRemove(c)}
                    aria-label={`حذف آیتم ${c.label}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* composer — هر عضو می‌تواند آیتم اضافه کند */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Plus
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={composerRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={120}
            placeholder="آیتم دلخواه اضافه کن (قرص، باتری اضافه، …)"
            aria-label="افزودن آیتم به چک‌لیست"
            className="h-11 w-full rounded-2xl border bg-card pe-10 ps-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-emerald/40 focus:ring-2 focus:ring-emerald/15"
          />
        </div>
        <button
          type="submit"
          disabled={!draft.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-emerald-dark disabled:opacity-40 disabled:shadow-none"
          aria-label="افزودن به چک‌لیست"
        >
          <Plus className="h-4.5 w-4.5" aria-hidden />
        </button>
      </form>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-emerald/10 px-4 py-3 text-center text-sm font-bold text-emerald"
        >
          🎉 چک‌لیست کامل شد — آماده‌ی سفر هستیم!
        </motion.div>
      )}
    </div>
  );
}
