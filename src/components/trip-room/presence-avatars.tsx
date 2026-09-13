"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TripRoom } from "@/types/trip-room";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Presence Avatars Stack — Trip Room enhancement (spec §2).
 *
 * Shows the online members as a stack of overlapping avatars in the
 * chat toolbar, with a "+N" overflow count if too many to fit. Each
 * avatar has a small online/offline dot and a tooltip with the member's
 * name + role.
 *
 * This complements the existing typing indicator — when a member is
 * "typing" (random mock), their avatar gets a subtle pulsing ring.
 */

interface PresenceMember {
  userId: string;
  name: string;
  avatar?: string;
  role: "traveler" | "leader";
  online: boolean;
  isTyping?: boolean;
}

export function PresenceAvatars({
  members,
  typingUserId,
  max = 4,
}: {
  members: PresenceMember[];
  /** ID of the user currently typing (mock) — gets a pulsing ring */
  typingUserId?: string | null;
  max?: number;
}) {
  // Sort: online first (leaders first among online), then offline
  const sorted = [...members].sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (a.role !== b.role) return a.role === "leader" ? -1 : 1;
    return 0;
  });

  const visible = sorted.slice(0, max);
  const overflow = sorted.length - visible.length;
  const onlineCount = members.filter((m) => m.online).length;

  return (
    <div className="flex items-center gap-1.5">
      {/* avatars stack */}
      <div className="flex -space-x-2 -space-x-reverse">
        {visible.map((m, i) => (
          <TooltipProvider key={m.userId} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="relative"
                  style={{ zIndex: visible.length - i }}
                >
                  <Avatar
                    className={cn(
                      "h-6 w-6 ring-2 ring-background transition",
                      typingUserId === m.userId && "ring-gold",
                    )}
                  >
                    <AvatarImage src={m.avatar} alt={m.name} />
                    <AvatarFallback className="text-[8px]">
                      {m.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  {/* online dot */}
                  <span
                    className={cn(
                      "absolute -bottom-0 -left-0 h-2 w-2 rounded-full border border-background",
                      m.online ? "bg-emerald" : "bg-muted-foreground/50",
                    )}
                    aria-label={m.online ? "آنلاین" : "آفلاین"}
                  />
                  {/* typing pulse ring */}
                  <AnimatePresence>
                    {typingUserId === m.userId && (
                      <motion.span
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full ring-2 ring-gold"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{m.name}</span>
                  {m.role === "leader" && (
                    <span className="rounded-full bg-gold/15 px-1 py-0.5 text-[8px] font-bold text-gold">
                      لیدر
                    </span>
                  )}
                  {typingUserId === m.userId && (
                    <span className="text-gold">در حال تایپ...</span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {overflow > 0 && (
          <div
            className="relative grid h-6 w-6 place-items-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground ring-2 ring-background"
            style={{ zIndex: 0 }}
          >
            +{toFa(overflow)}
          </div>
        )}
      </div>

      {/* online count text */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
        </span>
        <span className="font-bold text-emerald">{toFa(onlineCount)}</span>
        <span>آنلاین</span>
      </div>
    </div>
  );
}
