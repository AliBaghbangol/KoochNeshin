"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TripRoom, TripRoomMember } from "@/types/trip-room";
import { useNamedMembers } from "@/data/use-trip-room";
import { toFa, toPersianShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Members tab — spec §2.
 *
 * v22: the roster is LIVE — `trip-room-store.applyPresence` mirrors the
 * WebSocket presence roster onto `members[].online`, so this list re-sorts
 * online-first and tints connected members in real time.
 */
export function MemberList({ room }: { room: TripRoom }) {
  // show the REAL logged-in identity instead of the mock «شما» entry
  const members = useNamedMembers(room);
  const sorted = React.useMemo(() => {
    const rank = (m: TripRoomMember) =>
      (m.online ? 0 : 1) * 10 + (m.role === "leader" ? 0 : 1);
    return [...members].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  }, [members]);

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <div className="space-y-3">
      {/* live presence summary (v22) */}
      <div className="flex items-center justify-between rounded-2xl border bg-card/60 px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
          </span>
          وضعیت حضور
        </span>
        <span className="text-xs font-extrabold text-emerald">
          {toFa(onlineCount)} از {toFa(members.length)} آنلاین
        </span>
      </div>

      <ul className="space-y-2">
        {sorted.map((m, i) => (
          <motion.li
            key={m.userId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors",
              m.online && "border-emerald/30 bg-gradient-to-l from-emerald/5 to-card",
            )}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={m.avatar} alt={m.name} />
                <AvatarFallback>{m.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-card",
                  m.online ? "bg-emerald" : "bg-muted-foreground/40",
                )}
                aria-label={m.online ? "آنلاین" : "آفلاین"}
              />
              {m.online && (
                <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 animate-ping rounded-full bg-emerald/50 [animation-duration:2s]" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">{m.name}</span>
                {m.role === "leader" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold">
                    <Crown className="h-2.5 w-2.5" />
                    لیدر
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                پیوست: {toPersianShortDate(m.joinedAt)}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold",
                m.online
                  ? "bg-emerald/10 text-emerald"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {m.online ? "آنلاین" : "آفلاین"}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
