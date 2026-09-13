"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, BarChart3, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TripRoom } from "@/types/trip-room";
import {
  useTripRoom,
  resolveAccessLevel,
} from "@/store/trip-room-store";
import { useMe } from "@/hooks/use-me";
import { toast } from "sonner";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

/**
 * Poll Creator — Trip Room enhancement (spec §2).
 *
 * Lets the leader (or any member with access level "member" or above)
 * create new polls. Renders a collapsible form at the top of the polls
 * tab:
 *   1. Question input
 *   2. 2-5 option inputs (add/remove buttons)
 *   3. Submit button
 *
 * On submit:
 *   - Calls `addPoll(bookingId, question, options, authorId, authorName)`.
 *   - The store also creates a system message ("X created a new poll").
 *   - Fires `track("poll_created")` analytics event.
 *   - Shows a success toast.
 *   - Resets the form.
 */

export function PollCreator({ room }: { room: TripRoom }) {
  const addPoll = useTripRoom((s) => s.addPoll);
  const me = useMe();
  const access = resolveAccessLevel(room);
  const canCreate = access === "leader" || access === "admin" || access === "member";

  const [open, setOpen] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [options, setOptions] = React.useState<string[]>(["", ""]);
  const [error, setError] = React.useState<string | null>(null);

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(idx: number) {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateOption(idx: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  }

  function handleSubmit() {
    const q = question.trim();
    if (!q) {
      setError("سوال نظرسنجی را بنویسید.");
      return;
    }
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < MIN_OPTIONS) {
      setError(`حداقل ${MIN_OPTIONS} گزینه وارد کنید.`);
      return;
    }
    addPoll(room.bookingId, q, opts, me.id, me.name);
    track("poll_created", { bookingId: room.bookingId, options: opts.length });
    toast.success("نظرسنجی جدید ایجاد شد!");
    setQuestion("");
    setOptions(["", ""]);
    setError(null);
    setOpen(false);
  }

  if (!canCreate) return null;

  return (
    <div className="rounded-2xl border bg-card p-3 shadow-sm">
      {!open ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4" />
          ایجاد نظرسنجی جدید
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          {/* question */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-muted-foreground">
              سوال نظرسنجی
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="مثلاً: فردا کی سازه ملاقات کنیم؟"
              rows={2}
              className="text-sm"
            />
          </div>

          {/* options */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-muted-foreground">
              گزینه‌ها ({options.length}/{MAX_OPTIONS})
            </label>
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {options.map((opt, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`گزینه ${i + 1}`}
                      className="h-8 flex-1 text-sm"
                    />
                    {options.length > MIN_OPTIONS && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted"
                        aria-label={`حذف گزینه ${i + 1}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald transition hover:text-emerald-dark"
              >
                <Plus className="h-3 w-3" />
                افزودن گزینه
              </button>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-sunset">{error}</p>
          )}

          {/* actions */}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} className="flex-1">
              <Check className="h-3.5 w-3.5" />
              ایجاد نظرسنجی
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setQuestion("");
                setOptions(["", ""]);
                setError(null);
              }}
            >
              انصراف
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
