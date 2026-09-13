"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Pin, PinOff, Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { TripRoom } from "@/types/trip-room";
import { useTripRoom, resolveAccessLevel } from "@/store/trip-room-store";
import { toPersianShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Announcements tab — spec §2.
 * لیدر/ادمین می‌تواند بنویسد و پین کند. اعضا فقط می‌خوانند.
 */
export function AnnouncementList({ room }: { room: TripRoom }) {
  const addAnnouncement = useTripRoom((s) => s.addAnnouncement);
  const togglePin = useTripRoom((s) => s.togglePinAnnouncement);
  const access = resolveAccessLevel(room);
  const canWrite = access === "leader" || access === "admin";

  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");

  function submit() {
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) return;
    addAnnouncement(room.bookingId, { title: t, body: b });
    toast.success("اعلامیه منتشر شد.");
    setTitle("");
    setBody("");
    setOpen(false);
  }

  const sorted = [...room.announcements].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-3">
      {canWrite && (
        <div className="rounded-2xl border bg-card p-3">
          {!open ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              افزودن اعلامیه جدید
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان اعلامیه"
                className="text-sm"
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="متن اعلامیه..."
                rows={3}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={submit} disabled={!title.trim() || !body.trim()}>
                  انتشار
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    setTitle("");
                    setBody("");
                  }}
                >
                  لغو
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 p-8 text-center text-xs text-muted-foreground">
          <Megaphone className="mb-2 h-6 w-6 opacity-50" />
          هنوز اعلامیه‌ای منتشر نشده است.
        </div>
      )}

      {sorted.map((a, i) => (
        <motion.article
          key={a.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
          className={cn(
            "rounded-2xl border bg-card p-4",
            a.pinned && "border-gold/40 bg-gold/5",
          )}
        >
          <div className="mb-1 flex items-start justify-between gap-2">
            <h4 className="flex items-center gap-1.5 text-sm font-bold">
              {a.pinned && (
                <Pin className="h-3.5 w-3.5 text-gold" aria-label="سنجاق شده" />
              )}
              {a.title}
            </h4>
            {canWrite && (
              <button
                type="button"
                onClick={() => togglePin(room.bookingId, a.id)}
                className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label={a.pinned ? "حذف سنجاق" : "سنجاق"}
              >
                {a.pinned ? (
                  <PinOff className="h-3.5 w-3.5" />
                ) : (
                  <Pin className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
          <p className="whitespace-pre-line text-[13px] leading-6 text-muted-foreground">
            {a.body}
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground/80">
            {toPersianShortDate(a.createdAt)}
          </p>
        </motion.article>
      ))}
    </div>
  );
}
