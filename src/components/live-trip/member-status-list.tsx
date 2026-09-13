"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Battery, BatteryLow, MapPin, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LiveTripState } from "@/types/live-trip";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Member status list — spec §3 dashboard's "👥 X / Y عضو" block. */
export function MemberStatusList({ trip }: { trip: LiveTripState }) {
  const total = trip.members.length;
  const online = trip.members.filter((m) => m.online).length;

  const sorted = [...trip.members].sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
  });

  return (
    <div className="rounded-3xl border bg-card p-4 shadow-sm ring-1 ring-black/[0.02]">
      <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2.5">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Users className="h-4 w-4 text-emerald" />
          اعضای گروه
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
          {toFa(online)} / {toFa(total)} آنلاین
        </span>
      </div>
      <ul className="divide-y divide-border/40">
        {sorted.map((m, i) => {
          const lowBattery = (m.batteryLevel ?? 100) < 20;
          return (
            <motion.li
              key={m.userId}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-background">
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
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  آخرین فعالیت: {timeAgoFa(m.lastSeenAt)}
                </p>
              </div>
              {typeof m.batteryLevel === "number" && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    lowBattery
                      ? "bg-sunset/10 text-sunset"
                      : "bg-emerald/10 text-emerald",
                  )}
                >
                  {lowBattery ? (
                    <BatteryLow className="h-3 w-3" />
                  ) : (
                    <Battery className="h-3 w-3" />
                  )}
                  {toFa(m.batteryLevel)}٪
                </span>
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

function timeAgoFa(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "همین الان";
  if (min < 60) return `${toFa(min)} دقیقه پیش`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${toFa(hr)} ساعت پیش`;
  const d = Math.round(hr / 24);
  return `${toFa(d)} روز پیش`;
}

/** Floating location pin used in stat cards. */
export function LocationPin({ lat, lng }: { lat?: number; lng?: number }) {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return <span className="text-[10px] text-muted-foreground">نامشخص</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <MapPin className="h-3 w-3" />
      {toFa(lat.toFixed(4))}، {toFa(lng.toFixed(4))}
    </span>
  );
}
