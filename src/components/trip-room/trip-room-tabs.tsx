"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Megaphone, Users, ListChecks, BarChart3, Radio, UserPlus, Wallet, Wifi } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TripRoom } from "@/types/trip-room";
import { ChatPanel } from "./chat-panel";
import { AnnouncementList } from "./announcement-list";
import { MemberList } from "./member-list";
import { TripChecklistPanel } from "./trip-checklist-panel";
import { PollCard } from "./poll-card";
import { PinnedMessagesCarousel } from "./pinned-messages-carousel";
import { TripRoomInvite } from "./trip-room-invite";
import { PollCreator } from "./poll-creator";
import { ExpensesPanel, ExpensesTabCount } from "./expenses-panel";
import { useGo } from "@/lib/use-go";
import { toFa } from "@/lib/format";
import { flagOn } from "@/lib/feature-flags";
import { ME_ID } from "@/store/trip-room-store";
import { useRealtime } from "@/store/realtime-store";
import { useTripRealtime } from "@/lib/realtime/use-trip-realtime";
import { cn } from "@/lib/utils";

type TabKey = "chat" | "announcements" | "members" | "checklist" | "polls" | "expenses";

/**
 * Trip Room Tabs — spec §2 + v21 enhancement (هزینه‌های گروهی).
 * Chat | Announcements | Members | Checklist | Polls | Expenses
 *
 * Optional "ورود به حالت زنده" banner when room.status === "active_trip"
 * wires the killer loop to Live Trip (§8).
 */
export function TripRoomTabs({ room }: { room: TripRoom }) {
  const go = useGo();
  // v22: live socket session — join + apply remote events + presence
  useTripRealtime(room.bookingId, room.tourTitle);
  const connected = useRealtime((s) => s.connected);
  const onlineUsers = useRealtime((s) => s.onlineByBooking[room.bookingId]);
  const onlineCount = onlineUsers?.length ?? 0;
  // v21.8 فیکس: قبلاً «همه‌ی» پیام‌های غیرسیستمی به‌عنوان خوانده‌نشده شمرده
  // می‌شدند؛ حالا فقط پیام‌های دیگران که در readBy من نیستند.
  const unreadMsgs = room.messages.filter(
    (m) =>
      !m.isSystem &&
      !m.deleted &&
      m.authorId !== ME_ID &&
      !(m.readBy ?? []).includes(ME_ID),
  ).length;
  const pinnedCount = room.announcements.filter((a) => a.pinned).length;
  const doneCount = room.checklist.filter((c) => c.done).length;

  // jump-to-message state — set by PinnedMessagesCarousel, consumed by ChatPanel
  const [jumpToMessage, setJumpToMessage] = React.useState<string | null>(null);
  // invite dialog state
  const [inviteOpen, setInviteOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* header — sticky glassmorphism */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-col gap-3 rounded-none border-x-0 border-t-0 border-b bg-card/80 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold">{room.tourTitle}</h2>
            <Badge
              variant="secondary"
              className={
                room.status === "active_trip"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-emerald/10 text-emerald"
              }
            >
              {room.status === "pre_trip"
                ? "قبل از سفر"
                : room.status === "active_trip"
                  ? "حین سفر"
                  : room.status === "post_trip"
                    ? "بعد از سفر"
                    : "بایگانی"}
            </Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span>اتاق گفت‌وگوی گروهی — {toFa(room.members.length)} عضو</span>
            {/* v22: live presence — هم‌سفرهای واقعاً آنلاین */}
            {onlineCount > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-1.5 py-px font-bold text-emerald"
                title={onlineUsers!.map((u) => u.name).join("، ")}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
                </span>
                {toFa(onlineCount)} آنلاین
              </span>
            )}
            {/* v22: وضعیت اتصال زنده */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-px font-medium",
                connected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}
              title={connected ? "همگام‌سازی زنده فعال است (WebSocket)" : "اتصال زنده برقرار نشده — فقط این دستگاه"}
            >
              <Wifi
                className={cn(
                  "h-2.5 w-2.5",
                  !connected && "opacity-50",
                )}
              />
              {connected ? "زنده" : "آفلاین"}
            </span>
          </p>
        </div>

        {flagOn("liveTrip") && room.status === "active_trip" && (
          <Button
            size="sm"
            onClick={() => go("live-trip", { bookingId: room.bookingId })}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            <Radio className="h-4 w-4 animate-pulse" />
            ورود به حالت زنده
          </Button>
        )}
        {flagOn("liveTrip") && room.status === "pre_trip" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => go("live-trip", { bookingId: room.bookingId })}
          >
            <Radio className="h-4 w-4" />
            شروع حالت زنده
          </Button>
        )}
        {/* دعوت هم‌سفر — لینک + QR */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          دعوت
        </Button>
      </div>

      {/* پیام‌های سنجاق‌شده — بالای تب‌ها */}
      <PinnedMessagesCarousel
        room={room}
        onJumpTo={(msgId) => setJumpToMessage(msgId)}
      />

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="flex w-full gap-1 overflow-x-auto sm:grid sm:grid-cols-6 sm:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsTrigger value="chat" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">چت</span>
            <span className="text-[9px] text-muted-foreground">
              {toFa(unreadMsgs)}
            </span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5">
            <Megaphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">اعلان‌ها</span>
            {pinnedCount > 0 && (
              <span className="text-[9px] text-gold">{toFa(pinnedCount)}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">اعضا</span>
            <span className="text-[9px] text-muted-foreground">
              {toFa(room.members.length)}
            </span>
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">چک‌لیست</span>
            <span className="text-[9px] text-muted-foreground">
              {toFa(doneCount)}/{toFa(room.checklist.length)}
            </span>
          </TabsTrigger>
          <TabsTrigger value="polls" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">نظرسنجی</span>
            <span className="text-[9px] text-muted-foreground">
              {toFa(room.polls.length)}
            </span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">هزینه‌ها</span>
            <ExpensesTabCount bookingId={room.bookingId} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-3">
          <div className="rounded-3xl border bg-background/40 p-3 sm:p-4">
            <ChatPanel
              room={room}
              jumpToMessage={jumpToMessage}
              onJumpConsumed={() => setJumpToMessage(null)}
            />
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="mt-3">
          <AnnouncementList room={room} />
        </TabsContent>

        <TabsContent value="members" className="mt-3">
          <MemberList room={room} />
        </TabsContent>

        <TabsContent value="checklist" className="mt-3">
          <TripChecklistPanel room={room} />
        </TabsContent>

        <TabsContent value="polls" className="mt-3">
          <div className="space-y-3">
            <PollCreator room={room} />
            {room.polls.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed bg-card/50 p-8 text-center text-xs text-muted-foreground">
                <BarChart3 className="mb-2 h-6 w-6 opacity-50" />
                هنوز نظرسنجی نیست.
              </div>
            ) : (
              room.polls.map((p) => (
                <PollCard key={p.id} room={room} pollId={p.id} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-3">
          <ExpensesPanel room={room} />
        </TabsContent>
      </Tabs>

      {/* دعوت هم‌سفر — modal با لینک + QR */}
      <TripRoomInvite
        room={room}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </div>
  );
}
