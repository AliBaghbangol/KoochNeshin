"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CornerUpRight, X, Flag, Trash2, SmilePlus, Search, XCircle, AtSign, Pin, PinOff, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { TripRoom, TripRoomMessage } from "@/types/trip-room";
import {
  useTripRoom,
  resolveAccessLevel,
  ME_ID,
} from "@/store/trip-room-store";
import { useSendTripMessage, useTripRoomMessages } from "@/data/use-trip-room";
import { useMe } from "@/hooks/use-me";
import { QuickReactionsPicker } from "./quick-reactions-picker";
import { PresenceAvatars } from "./presence-avatars";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/track";
import { useRealtime } from "@/store/realtime-store";
import { emitTypingStart, emitTypingStop } from "@/lib/realtime/trip-socket";

const REACTIONS = ["👍", "❤️", "😂", "🔥"];

/** تبدیل ISO به ساعت فارسی HH:MM */
function timeOnly(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return toFa(`${hh}:${mm}`);
  } catch {
    return "";
  }
}

function initials(name: string) {
  return name.trim().slice(0, 1) || "؟";
}

/* ------------------------------------------------------------------ *
 * @mention (v21.6) — آگاهی از اعضا در چت اتاق سفر
 * تشخیص در زمان رندر انجام می‌شود (بدون تغییر اسکیما): هر توکنِ
 * «@نام» که با نام یکی از اعضا (نام کوچک یا کامل) یکی باشد، چیپ
 * هایلایت می‌گیرد. برای پیام‌های قدیمی هم کار می‌کند و با backend
 * واقعی (که بعداً mentions[] را ذخیره می‌کند) سازگار است.
 * ------------------------------------------------------------------ */

const MENTION_TAIL_RE = /@([\p{L}\p{N}_]*(?:\s[\p{L}\p{N}_]*)?)$/u;

/** حرفِ «درون کلمه» — شامل ZWNJ (نیم‌فاصله) تا «علی‌رضایی» تکی کلمه بماند. */
const NAME_CHAR_RE = /[\p{L}\p{N}\u200C]/u;

/** نام‌های قابل منشن کردن برای یک اتاق (نام کوچک + نام کامل). */
function mentionableNames(members: { userId: string; name: string }[]): string[] {
  const names = new Set<string>();
  for (const m of members) {
    const full = m.name.trim();
    if (!full) continue;
    names.add(full);
    const first = full.split(/\s+/)[0];
    if (first) names.add(first);
  }
  return [...names];
}

interface MentionToken {
  text: string;
  mention: boolean;
}

/** متن پیام را به توکن‌های mention/plain می‌شکند (برای رندر چیپ).
 *  اسکن طولانی‌ترین نام اول — تا «@علی رضایی» یک چیپ کامل بگیرد، نه دو تکه. */
function tokenizeMentions(text: string, names: Set<string>): MentionToken[] {
  const sorted = [...names].sort((a, b) => b.length - a.length);
  const tokens: MentionToken[] = [];
  let buf = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "@") {
      const match = sorted.find((n) => {
        const candidate = "@" + n;
        if (!text.startsWith(candidate, i)) return false;
        const after = text[i + candidate.length];
        /* مرز پایان: انتها یا نویسه‌ی خارج از کلمه — نه وسط کلمه‌ی بلندتر */
        return after === undefined || !NAME_CHAR_RE.test(after);
      });
      if (match) {
        if (buf) {
          tokens.push({ text: buf, mention: false });
          buf = "";
        }
        tokens.push({ text: "@" + match, mention: true });
        i += match.length + 1;
        continue;
      }
    }
    buf += text[i];
    i++;
  }
  if (buf) tokens.push({ text: buf, mention: false });
  return tokens;
}

/** آیا این پیام به یکی از نام‌های «من» اشاره کرده؟ (حلقه‌ی طلایی + فیلتر منشن) */
function mentionsAny(text: string, myNames: Set<string>): boolean {
  if (myNames.size === 0) return false;
  return tokenizeMentions(text, myNames).some((t) => t.mention);
}

/** رنگ آواتار پایدار بر اساس userId — برای تنوع بصری */
function avatarTone(userId: string): string {
  const tones = [
    "bg-emerald/15 text-emerald",
    "bg-gold/15 text-gold",
    "bg-sunset/15 text-sunset",
    "bg-accent/15 text-accent",
    "bg-forest/15 text-forest",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

/**
 * Chat panel — spec §2.
 *
 * Bubble list (خودم راست، بقیه چپ)، reply preview، reactions، system messages،
 * report + delete (frontend gates). Polling handled by `useTripRoomMessages`.
 *
 * Visual polish (v2): tighter rows, stronger bubble contrast, persistent
 * meta strip, typing indicator, in-chat search.
 */
export function ChatPanel({
  room,
  jumpToMessage,
  onJumpConsumed,
}: {
  room: TripRoom;
  /** message id to scroll to (set by the parent, e.g. from the pinned carousel) */
  jumpToMessage?: string | null;
  /** called after we've performed the scroll so the parent can clear its state */
  onJumpConsumed?: () => void;
}) {
  const sendMessage = useSendTripMessage(room.bookingId);
  const toggleReaction = useTripRoom((s) => s.toggleReaction);
  const deleteMessage = useTripRoom((s) => s.deleteMessage);
  const markMessagesRead = useTripRoom((s) => s.markMessagesRead);
  const togglePinMessage = useTripRoom((s) => s.togglePinMessage);
  useTripRoomMessages(room.bookingId);

  const [text, setText] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<TripRoomMessage | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const typingTimerRef = React.useRef<number | null>(null);

  const access = resolveAccessLevel(room);
  const readOnly = access === "pending";
  const isModerator = access === "leader" || access === "admin";
  const me = useMe();

  /* --- v22: تایپ واقعی هم‌سفرها از مرورگرهای دیگر (auto-expiring) --- */
  const remoteTypers = useRealtime((s) => s.typingByBooking[room.bookingId]) ?? [];

  /* --- فیلتر چت (v21.8): همه / خوانده‌نشده / منشن‌های من --- */
  type ChatFilter = "all" | "unread" | "mentions" | "pinned";
  const [chatFilter, setChatFilter] = React.useState<ChatFilter>("all");

  /** همه‌ی نام‌هایی که به «من» اشاره‌اند: نام احراز هویت + نام عضو در اتاق
   *  (در دموی اتاق سفر عضوِ من «شما» است — هر دو باید منشن را بگیرند). */
  const myMentionNames = React.useMemo(() => {
    const names = new Set<string>();
    const add = (n?: string) => {
      const full = n?.trim();
      if (!full) return;
      names.add(full);
      const first = full.split(/\s+/)[0];
      if (first) names.add(first);
    };
    add(me.name);
    add(room.members.find((m) => m.userId === ME_ID)?.name);
    return names;
  }, [me.name, room.members]);

  const { unreadIds, mentionIds } = React.useMemo(() => {
    const unread = new Set<string>();
    const mentions = new Set<string>();
    for (const m of room.messages) {
      if (m.isSystem || m.deleted) continue;
      if (m.authorId !== ME_ID && !(m.readBy ?? []).includes(ME_ID)) {
        unread.add(m.id);
      }
      if (m.authorId !== ME_ID && mentionsAny(m.text, myMentionNames)) {
        mentions.add(m.id);
      }
    }
    return { unreadIds: unread, mentionIds: mentions };
  }, [room.messages, myMentionNames]);

  /** اولین پیام خوانده‌نشده — برای خط جداکننده‌ی «پیام‌های جدید» */
  const firstUnreadId = React.useMemo(() => {
    for (const m of room.messages) {
      if (!m.isSystem && !m.deleted && unreadIds.has(m.id)) return m.id;
    }
    return null;
  }, [room.messages, unreadIds]);

  /** لنگرِ جداکننده‌ی «پیام‌های جدید» — مثل تلگرام تا آخر سشن همین‌جا می‌ماند
   *  حتی بعد از خوانده‌شدن، تا کاربر مرزِ «جدید» را در تاریخچه گم نکند. */
  const [dividerAnchorId, setDividerAnchorId] = React.useState<string | null>(null);

  /* --- @mention autocomplete state (v21.6) --- */
  const mentionNames = React.useMemo(
    () => mentionableNames(room.members),
    [room.members],
  );
  const mentionNameSet = React.useMemo(() => new Set(mentionNames), [mentionNames]);
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null); // null = بسته
  const [mentionIndex, setMentionIndex] = React.useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const mentionResults = React.useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.trim();
    const base = q
      ? mentionNames.filter((n) =>
          n.toLocaleLowerCase("fa").includes(q.toLocaleLowerCase("fa")),
        )
      : mentionNames;
    return base.slice(0, 5);
  }, [mentionQuery, mentionNames]);

  const mentionOpen = mentionQuery !== null && mentionResults.length > 0 && !readOnly;

  // keep the highlighted row inside the visible window when the query changes
  React.useEffect(() => {
    setMentionIndex(0);
  }, [mentionQuery]);

  /** درج نام انتخاب‌شده به‌جای @query انتهایی */
  function applyMention(name: string) {
    setText((cur) => cur.replace(MENTION_TAIL_RE, `@${name} `));
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  /** تشخیص @query انتهایی بعد از هر تغییر متن */
  function handleTextChange(v: string) {
    setText(v);
    const m = v.match(MENTION_TAIL_RE);
    setMentionQuery(m ? m[1] : null);
    // v22: تایپ واقعی — به اتاق‌های دیگر پینگ بزن (throttle داخلی دارد)
    if (!readOnly && v.trim()) {
      emitTypingStart(room.bookingId, { userId: ME_ID, name: me.name });
    } else {
      emitTypingStop(room.bookingId, { userId: ME_ID, name: me.name });
    }
  }

  // v22: وقتی چت را می‌بندی/متن را رها می‌کنی، وضعیت تایپ را خاموش کن
  React.useEffect(() => {
    return () => {
      emitTypingStop(room.bookingId, { userId: ME_ID, name: me.name });
    };
  }, [room.bookingId, me.name]);

  // when jumpToMessage changes (and is non-null), scroll the chat to that message
  React.useEffect(() => {
    if (!jumpToMessage) return;
    const container = scrollRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(`[data-msg-id="${jumpToMessage}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(jumpToMessage);
      // clear the highlight after 2.5s
      const t = window.setTimeout(() => setHighlightedId(null), 2500);
      onJumpConsumed?.();
      return () => window.clearTimeout(t);
    }
    onJumpConsumed?.();
  }, [jumpToMessage, onJumpConsumed]);

  // auto-scroll: on first mount jump to the first unread message (classic chat
  // behavior — like Telegram), otherwise to the bottom. On subsequent NEW
  // messages, follow the bottom only if the user is already near it (never
  // yank the scroll while they're reading history — this also keeps messages
  // above the fold unread, which is exactly what the divider/filter need).
  const didInitialScrollRef = React.useRef(false);
  const prevLenRef = React.useRef(room.messages.length);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const len = room.messages.length;
    const gotNewMessage = len > prevLenRef.current;
    prevLenRef.current = len;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      setDividerAnchorId(firstUnreadId); // session-scoped divider anchor
      if (firstUnreadId) {
        const target = el.querySelector<HTMLElement>(`[data-msg-id="${firstUnreadId}"]`);
        if (target) {
          target.scrollIntoView({ block: "center" });
          return;
        }
      }
      el.scrollTop = el.scrollHeight;
      return;
    }
    if (gotNewMessage) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
      if (nearBottom) el.scrollTop = el.scrollHeight;
    }
  }, [room.messages.length, firstUnreadId]);

  // Mark messages from others as read **when they actually enter the viewport**
  // (v21.8 upgrade: was a blunt 500ms mark-all timer — messages below the fold
  // stayed "read" without being seen, which killed the unread divider/filter).
  // IntersectionObserver on [data-msg-id] rows; visible unread rows are marked
  // read in one batched store call.
  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIds = entries
          .filter((e) => e.isIntersecting)
          .map((e) => (e.target as HTMLElement).dataset.msgId)
          .filter(Boolean) as string[];
        if (visibleIds.length === 0) return;
        const toMark = visibleIds.filter((id) => {
          const m = room.messages.find((x) => x.id === id);
          return (
            m &&
            !m.isSystem &&
            !m.deleted &&
            m.authorId !== ME_ID &&
            !(m.readBy ?? []).includes(ME_ID)
          );
        });
        if (toMark.length > 0) {
          markMessagesRead(room.bookingId, toMark, ME_ID);
        }
      },
      { root: container, threshold: 0.5 },
    );
    container.querySelectorAll<HTMLElement>("[data-msg-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [room.messages, room.bookingId, markMessagesRead]);

  // fake "someone is typing" indicator — toggles every 8-14s for realism
  React.useEffect(() => {
    let active = true;
    const schedule = () => {
      const delay = 8000 + Math.random() * 6000;
      const id = window.setTimeout(() => {
        if (!active) return;
        setIsTyping(true);
        window.setTimeout(() => {
          if (!active) return;
          setIsTyping(false);
          schedule();
        }, 2500 + Math.random() * 1500);
      }, delay);
      typingTimerRef.current = id;
    };
    schedule();
    return () => {
      active = false;
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (readOnly) {
      toast.error("اتاق سفر بعد از تأیید رزرو باز می‌شود.");
      return;
    }
    const mentionCount = tokenizeMentions(trimmed, mentionNameSet).filter(
      (t) => t.mention,
    ).length;
    const res = sendMessage(trimmed, replyTo?.id);
    if (!res.ok) {
      setError("لطفاً یک ثانیه بین پیام‌ها فاصله بگذارید.");
      return;
    }
    if (mentionCount > 0) {
      track("message_mentioned", {
        bookingId: room.bookingId,
        count: mentionCount,
      });
    }
    setText("");
    setReplyTo(null);
    setError(null);
    setMentionQuery(null);
    emitTypingStop(room.bookingId, { userId: ME_ID, name: me.name });
  }

  function handleReport(m: TripRoomMessage) {
    // TODO(backend): POST /api/trip-rooms/:id/messages/:id/report
    toast.success("گزارش شما ثبت شد. تیم ما بررسی خواهد کرد.");
    track("message_reported", { bookingId: room.bookingId, messageId: m.id });
  }

  /**
   * حذف پیام — سیاست (v21.5): نویسنده می‌تواند پیام خودش را حذف کند؛
   * لیدر/ادمین می‌تواند هر پیامی را حذف کند. پیام حذف‌شده به‌صورت
   * «این پیام حذف شد» باقی می‌ماند (soft delete) تا thread رپلای‌ها سالم بماند.
   */
  function handleDelete(m: TripRoomMessage) {
    const mine = m.authorId === ME_ID;
    if (!mine && access !== "leader" && access !== "admin") return;
    deleteMessage(room.bookingId, m.id);
    toast.success(mine ? "پیامت حذف شد." : "پیام حذف شد.");
    track("message_deleted", {
      bookingId: room.bookingId,
      messageId: m.id,
      byModerator: !mine,
    });
  }

  /**
   * سنجاق/برداشتن سنجاق پیام — فقط لیدر/ادمین (v21.8).
   * پیام سنجاق‌شده در کاروسل بالای تب‌ها می‌آید تا هیچ‌کس اطلاعات مهم
   * (ساعت حرکت، محل،…) را از دست ندهد.
   */
  function handleTogglePin(m: TripRoomMessage) {
    if (!isModerator) return;
    const pinning = !m.pinned;
    togglePinMessage(room.bookingId, m.id, me.name);
    toast.success(
      pinning ? "پیام سنجاق شد — بالای چت نمایش داده می‌شود." : "سنجاق پیام برداشته شد.",
      { icon: pinning ? "📌" : "📍" },
    );
    track("message_pinned", {
      bookingId: room.bookingId,
      messageId: m.id,
      pinned: pinning,
    });
  }

  /** تغییر فیلتر چت + analytics (فقط وقتی واقعاً عوض شود) */
  function applyChatFilter(f: ChatFilter) {
    setChatFilter((cur) => {
      if (cur === f) return cur;
      track("chat_filter_used", { bookingId: room.bookingId, filter: f });
      return f;
    });
  }

  /** پرش به یک پیام (مثلاً والده‌ی یک رپلای) + هایلایت موقت. */
  function scrollToMessage(id: string) {
    const container = scrollRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(`[data-msg-id="${id}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    window.setTimeout(() => setHighlightedId((cur) => (cur === id ? null : cur)), 2500);
  }

  const filteredMessages = React.useMemo(() => {
    let list = room.messages;
    /* فیلتر تب (v21.8 + تب «مهم» v21.9) */
    if (chatFilter === "unread") {
      list = list.filter((m) => !m.isSystem && unreadIds.has(m.id));
    } else if (chatFilter === "mentions") {
      list = list.filter((m) => !m.isSystem && mentionIds.has(m.id));
    } else if (chatFilter === "pinned") {
      list = list.filter((m) => !m.isSystem && m.pinned);
    }
    /* جستجو روی نتیجه‌ی فیلتر */
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.text.toLowerCase().includes(q) ||
          m.authorName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [room.messages, searchQuery, chatFilter, unreadIds, mentionIds]);

  /** تعداد کل بعد از فیلترِ تب (بدون جستجو) — برای نشانِ تعداد روی چیپ‌ها */
  const filterCounts = React.useMemo(
    () => ({
      unread: room.messages.filter((m) => !m.isSystem && unreadIds.has(m.id)).length,
      mentions: room.messages.filter((m) => !m.isSystem && mentionIds.has(m.id)).length,
      pinned: room.messages.filter((m) => !m.isSystem && m.pinned).length,
    }),
    [room.messages, unreadIds, mentionIds],
  );

  return (
    <div className="flex h-full flex-col">
      {/* chat toolbar — presence + search */}
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/40 pb-2">
        <PresenceAvatars
          members={room.members.map((m) => ({
            userId: m.userId,
            name: m.name,
            avatar: m.avatar,
            role: m.role,
            online: m.online ?? false,
          }))}
          typingUserId={
            remoteTypers.length > 0
              ? remoteTypers[0].userId
              : isTyping
                ? "leader_1"
                : null
          }
        />
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full transition",
            searchOpen ? "bg-emerald/10 text-emerald" : "text-muted-foreground hover:bg-muted",
          )}
          aria-label="جستجو در پیام‌ها"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در پیام‌ها..."
                className="h-9 pr-9 text-[12px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  aria-label="پاک کردن جستجو"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* فیلتر چت (v21.8) — همه / خوانده‌نشده / منشن‌های من / مهم (v21.9) */}
      <div
        className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        role="tablist"
        aria-label="فیلتر پیام‌ها"
      >
        <ListFilter className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
        {([
          { key: "all" as const, label: "همه", count: null },
          { key: "unread" as const, label: "خوانده‌نشده", count: filterCounts.unread },
          { key: "mentions" as const, label: "منشن‌های من", count: filterCounts.mentions },
          { key: "pinned" as const, label: "مهم", count: filterCounts.pinned },
        ]).map((f) => {
          const active = chatFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => applyChatFilter(f.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all",
                f.key === "pinned"
                  ? active
                    ? "border-gold/50 bg-gold/10 text-gold shadow-sm"
                    : "border-border/60 bg-card text-muted-foreground hover:border-gold/40 hover:text-gold"
                  : active
                    ? "border-emerald/40 bg-emerald/10 text-emerald shadow-sm"
                    : "border-border/60 bg-card text-muted-foreground hover:border-emerald/30 hover:text-emerald",
              )}
            >
              {f.key === "pinned" && <Pin className="h-3 w-3" aria-hidden />}
              {f.label}
              {f.key === "unread" && f.count ? (
                <span
                  className={cn(
                    "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black tabular-nums",
                    active ? "bg-emerald text-white" : "bg-sunset/15 text-sunset",
                  )}
                >
                  {toFa(f.count)}
                </span>
              ) : f.key === "mentions" && f.count ? (
                <span
                  className={cn(
                    "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black tabular-nums",
                    active ? "bg-emerald text-white" : "bg-gold/15 text-gold",
                  )}
                >
                  {toFa(f.count)}
                </span>
              ) : f.key === "pinned" && f.count ? (
                <span
                  className={cn(
                    "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black tabular-nums",
                    active ? "bg-gold text-forest" : "bg-gold/15 text-gold",
                  )}
                >
                  {toFa(f.count)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-2.5 overflow-y-auto rounded-2xl bg-gradient-to-b from-background/40 to-background/20 p-3 sm:p-4 max-h-[60vh] min-h-[280px]"
        role="log"
        aria-live="polite"
      >
        {room.messages.length === 0 && (
          <div className="grid h-full place-items-center text-center text-xs text-muted-foreground">
            <div>
              <div className="mb-2 text-3xl" aria-hidden>
                💬
              </div>
              هنوز پیامی نیست — اولین نفر باش!
            </div>
          </div>
        )}

        {filteredMessages.length === 0 && room.messages.length > 0 && (
          <div className="grid h-40 place-items-center text-center text-xs text-muted-foreground">
            <div>
              <div className="mb-2 text-3xl opacity-60" aria-hidden>
                {chatFilter === "unread"
                  ? "✅"
                  : chatFilter === "mentions"
                    ? "📣"
                    : chatFilter === "pinned"
                      ? "📌"
                      : "🔍"}
              </div>
              {chatFilter === "unread"
                ? "همه‌ی پیام‌ها را خوانده‌ای!"
                : chatFilter === "mentions"
                  ? "هنوز کسی به تو اشاره نکرده — با @ اسمش را بنویس."
                  : chatFilter === "pinned"
                    ? "هنوز پیامی سنجاق نشده — لیدر می‌تواند پیام‌های مهم را سنجاق کند."
                    : "چیزی مطابق جستجو پیدا نشد."}
            </div>
          </div>
        )}

        {filteredMessages.map((m) => {
          if (m.isSystem) {
            return (
              <div
                key={m.id}
                className="flex justify-center"
                aria-label="پیام سیستمی"
              >
                <span className="rounded-full bg-muted/70 px-3 py-1 text-[10px] text-muted-foreground">
                  {m.text}
                </span>
              </div>
            );
          }
          const mine = m.authorId === ME_ID;
          return (
            <React.Fragment key={m.id}>
              {/* خط جداکننده‌ی «پیام‌های جدید» — لنگرِ سشن؛ فقط در نمای همه */}
              {chatFilter === "all" && m.id === dividerAnchorId && (
                <div className="flex items-center gap-2 py-1" role="separator" aria-label="پیام‌های جدید">
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/60 to-gold/60" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[9px] font-black text-gold">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-gold" aria-hidden />
                    پیام‌های جدید
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/60 to-gold/60" />
                </div>
              )}
            <motion.div
              key={m.id}
              data-msg-id={m.id}
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "group flex items-end gap-2 scroll-mt-2 rounded-2xl",
                mine ? "flex-row-reverse" : "flex-row",
                !mine &&
                  mentionsAny(m.text, myMentionNames) &&
                  "ring-1 ring-gold/50 bg-gold/[0.04] -mx-1 px-1",
              )}
            >
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                <AvatarImage src={m.authorAvatar} alt={m.authorName} />
                <AvatarFallback className={avatarTone(m.authorId)}>
                  {initials(m.authorName)}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "group/msg flex max-w-[78%] flex-col gap-0.5 rounded-2xl transition-all",
                  mine ? "items-end" : "items-start",
                  highlightedId === m.id && "ring-2 ring-gold/60 bg-gold/5 -mx-1 px-1",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-1 text-[10px]",
                    mine ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <span className="font-bold text-foreground/80">
                    {mine ? me.name : m.authorName}
                  </span>
                  {mine && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-px text-[9px] font-bold text-primary">
                      شما
                    </span>
                  )}
                  {/* بج «سنجاق‌شده» (v21.8) — با تولتیپ «سنجاق‌شده توسط X» */}
                  {m.pinned && (
                    <TooltipProvider delayDuration={120}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-px text-[9px] font-black text-gold">
                            <Pin className="h-2.5 w-2.5" aria-hidden />
                            سنجاق‌شده
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px]">
                          {m.pinnedBy ? `سنجاق‌شده توسط ${m.pinnedBy}` : "سنجاق‌شده توسط لیدر"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <span className="text-muted-foreground/70">{timeOnly(m.createdAt)}</span>
                </div>
                <div
                  className={cn(
                    "relative rounded-2xl px-3.5 py-2 text-[13px] leading-5 shadow-sm transition group-hover/msg:shadow-md",
                    mine
                      ? "rounded-bl-sm bg-gradient-to-br from-emerald to-emerald-dark text-white"
                      : "rounded-br-sm bg-card border border-border/60",
                    m.deleted && "italic text-muted-foreground",
                    m.pinned && !mine && "border-gold/40 bg-gold/[0.04]",
                    m.pinned && mine && "ring-1 ring-gold/60",
                  )}
                >
                  {/* small tail on the bubble */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute bottom-0 h-2 w-2",
                      mine
                        ? "-right-1 bg-emerald-dark [clip-path:polygon(0_0,100%_100%,0_100%)]"
                        : "-left-1 bg-card [clip-path:polygon(100%_0,100%_100%,0_100%)]",
                    )}
                  />
                  {m.replyToId && (
                    <button
                      type="button"
                      onClick={() => scrollToMessage(m.replyToId!)}
                      className={cn(
                        "mb-1.5 flex max-w-full items-center gap-1 border-r-2 pr-2 text-start text-[10px] transition hover:opacity-80",
                        mine
                          ? "border-white/50 text-white/80"
                          : "border-emerald/50 text-muted-foreground",
                      )}
                      aria-label="پرش به پیام اصلی"
                      title="پرش به پیام اصلی"
                    >
                      <CornerUpRight className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{replySnippet(room, m.replyToId)}</span>
                    </button>
                  )}
                  <MessageBody
                    text={m.text}
                    names={mentionNameSet}
                    mine={mine}
                  />
                </div>

                {/* read receipts — only on my own messages */}
                {mine && !m.deleted && (() => {
                  const readers = (m.readBy ?? []).filter((u) => u !== ME_ID);
                  const totalOthers = room.members.length - 1; // excluding me
                  if (totalOthers === 0) return null;
                  const allRead = readers.length >= totalOthers;
                  const someRead = readers.length > 0;
                  return (
                    <div className="mt-0.5 flex items-center gap-0.5 px-1 text-[9px]">
                      {allRead ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald">
                          <svg viewBox="0 0 16 12" className="h-3 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 6 L5 10 L11 2" />
                            <path d="M5 6 L9 10 L15 2" />
                          </svg>
                          خوانده شد
                        </span>
                      ) : someRead ? (
                        <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                          <svg viewBox="0 0 16 12" className="h-3 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 6 L5 10 L11 2" />
                          </svg>
                          {toFa(readers.length)} از {toFa(totalOthers)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-muted-foreground/50">
                          <svg viewBox="0 0 16 12" className="h-3 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 6 L5 10 L11 2" />
                          </svg>
                          ارسال شد
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* reactions row — attached to the bubble (tooltip: who reacted) */}
                {m.reactions && Object.keys(m.reactions).length > 0 && (
                  <TooltipProvider delayDuration={150}>
                    <div
                      className={cn(
                        "mt-0.5 flex flex-wrap gap-1",
                        mine ? "justify-end" : "justify-start",
                      )}
                    >
                      {Object.entries(m.reactions).map(([emoji, users]) => (
                        <Tooltip key={emoji}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() =>
                                toggleReaction(room.bookingId, m.id, emoji, ME_ID)
                              }
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold transition hover:scale-105",
                                users.includes(ME_ID)
                                  ? "border-emerald/40 bg-emerald/15 text-emerald"
                                  : "border-border bg-background text-muted-foreground hover:bg-muted",
                              )}
                            >
                              <span aria-hidden>{emoji}</span>
                              <span className="tabular-nums">{toFa(users.length)}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            {reactionNames(room, users, me.name)}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                )}

                {/* per-message action row (appears on hover) */}
                <div
                  className={cn(
                    "mt-0.5 flex items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover/msg:opacity-100",
                    mine ? "justify-end" : "justify-start",
                  )}
                >
                  <TooltipProvider delayDuration={120}>
                    {REACTIONS.map((emoji) => (
                      <Tooltip key={emoji}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={`ری‌اکشن ${emoji}`}
                            onClick={() =>
                              toggleReaction(room.bookingId, m.id, emoji, ME_ID)
                            }
                            className="grid h-6 w-6 place-items-center rounded-full text-xs transition hover:scale-110 hover:bg-muted"
                          >
                            {emoji}
                          </button>
                        </TooltipTrigger>
                      </Tooltip>
                    ))}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="پاسخ به این پیام"
                          onClick={() => setReplyTo(m)}
                          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:scale-110 hover:bg-muted"
                        >
                          <CornerUpRight className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">پاسخ</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="گزارش پیام"
                          onClick={() => handleReport(m)}
                          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:scale-110 hover:bg-muted"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">گزارش</TooltipContent>
                    </Tooltip>
                    {(m.authorId === ME_ID ||
                      ((access === "leader" || access === "admin") && !m.deleted)) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="حذف پیام"
                            onClick={() => handleDelete(m)}
                            className="grid h-6 w-6 place-items-center rounded-full text-destructive transition hover:scale-110 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {m.authorId === ME_ID ? "حذف پیامم" : "حذف (لیدر)"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {/* سنجاق پیام — فقط لیدر/ادمین (v21.8) */}
                    {isModerator && !m.deleted && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={m.pinned ? "برداشتن سنجاق" : "سنجاق کردن پیام"}
                            onClick={() => handleTogglePin(m)}
                            className={cn(
                              "grid h-6 w-6 place-items-center rounded-full transition hover:scale-110",
                              m.pinned
                                ? "text-gold hover:bg-gold/10"
                                : "text-muted-foreground hover:bg-muted",
                            )}
                          >
                            {m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {m.pinned ? "برداشتن سنجاق" : "سنجاق بالای چت"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>
              </div>
            </motion.div>
            </React.Fragment>
          );
        })}

        {/* typing indicator — اول «تایپ واقعی» هم‌سفرها (v22)، بعد ربات دمو */}
        <AnimatePresence>
          {!searchQuery &&
            remoteTypers.length > 0 &&
            remoteTypers.slice(0, 2).map((t) => (
              <motion.div
                key={t.userId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex items-end gap-2"
              >
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                  <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                    {initials(t.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl rounded-br-sm border border-border/60 bg-card px-3.5 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-primary/60"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.18,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {t.name} در حال تایپ...
                </span>
              </motion.div>
            ))}
          {!searchQuery && remoteTypers.length === 0 && isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-end gap-2"
            >
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                <AvatarFallback className="bg-gold/15 text-gold">؟</AvatarFallback>
              </Avatar>
              <div className="rounded-2xl rounded-br-sm border border-border/60 bg-card px-3.5 py-2.5 shadow-sm">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.18,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">در حال تایپ...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center justify-between gap-2 rounded-xl border-r-2 border-emerald bg-emerald/5 px-3 py-1.5 text-[11px]"
          >
            <span className="truncate text-muted-foreground">
              پاسخ به: <span className="font-semibold">{replyTo.text}</span>
            </span>
            <button
              type="button"
              aria-label="لغو پاسخ"
              onClick={() => setReplyTo(null)}
              className="grid h-5 w-5 place-items-center rounded-full hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* composer */}
      <form onSubmit={handleSubmit} className="relative mt-2 flex items-end gap-2">
        {/* @mention autocomplete popover (v21.6) */}
        <AnimatePresence>
          {mentionOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              role="listbox"
              aria-label="انتخاب عضو برای اشاره"
              className="absolute bottom-full left-0 z-30 mb-2 w-64 overflow-hidden rounded-2xl border bg-popover shadow-xl"
            >
              <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-1.5 text-[10px] font-bold text-muted-foreground">
                <AtSign className="h-3 w-3 text-emerald" />
                اشاره به عضو
                <span className="ms-auto font-normal">↑↓ انتخاب · Enter تأیید</span>
              </div>
              {mentionResults.map((name, i) => {
                const member = room.members.find(
                  (m) => m.name === name || m.name.split(/\s+/)[0] === name,
                );
                const activeRow = i === mentionIndex;
                return (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={activeRow}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep textarea focus
                      applyMention(name);
                    }}
                    onMouseEnter={() => setMentionIndex(i)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-start transition-colors",
                      activeRow ? "bg-emerald/10" : "hover:bg-muted/50",
                    )}
                  >
                    <Avatar className="h-7 w-7 ring-1 ring-background">
                      <AvatarImage src={member?.avatar} alt={name} />
                      <AvatarFallback className={cn("text-[10px]", avatarTone(member?.userId ?? name))}>
                        {initials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs font-bold">{name}</span>
                    {member?.role === "leader" && (
                      <span className="ms-auto rounded-full bg-gold/15 px-1.5 py-px text-[9px] font-black text-gold">
                        لیدر
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <QuickReactionsPicker
          onPick={(emoji) => {
            if (readOnly) {
              toast.error("اتاق سفر بعد از تأیید رزرو باز می‌شود.");
              return;
            }
            sendMessage(emoji);
          }}
        />
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (mentionOpen) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex((i) => (i + 1) % mentionResults.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex(
                  (i) => (i - 1 + mentionResults.length) % mentionResults.length,
                );
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                applyMention(mentionResults[mentionIndex] ?? mentionResults[0]);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setMentionQuery(null);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          placeholder={
            readOnly
              ? "اتاق سفر بعد از تأیید رزرو باز می‌شود..."
              : "پیام بنویس... یا @ را بزن تا عضوی را اشاره کنی"
          }
          disabled={readOnly}
          rows={1}
          className="min-h-[44px] resize-none rounded-2xl border-border/60 bg-card text-sm shadow-sm focus-visible:ring-emerald/30"
        />
        <Button
          type="submit"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark shadow-md transition hover:shadow-lg disabled:opacity-50"
          disabled={readOnly || !text.trim()}
          aria-label="ارسال پیام"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {error && <p className="mt-1 text-[11px] text-sunset">{error}</p>}
      {readOnly && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <SmilePlus className="h-3 w-3" />
          فقط اعضای تأییدشده می‌توانند پیام بفرستند.
        </p>
      )}
    </div>
  );
}

function replySnippet(room: TripRoom, replyToId: string): string {
  const m = room.messages.find((x) => x.id === replyToId);
  if (!m) return "پیام حذف شده";
  const snippet = m.text.length > 40 ? m.text.slice(0, 40) + "…" : m.text;
  return `${m.authorName}: ${snippet}`;
}

/** بدنه‌ی پیام با چیپِ اشاره (@نام) — توکن‌هایی که نام یکی از اعضا هستند
 *  هایلایت می‌شوند؛ در حباب خودم (زمینه سبز) با نیمه‌شفاف سفید. */
function MessageBody({
  text,
  names,
  mine,
}: {
  text: string;
  names: Set<string>;
  mine: boolean;
}) {
  const tokens = React.useMemo(() => tokenizeMentions(text, names), [text, names]);
  const hasMention = tokens.some((t) => t.mention);
  if (!hasMention) return <span className="break-words">{text}</span>;
  return (
    <span className="break-words">
      {tokens.map((t, i) =>
        t.mention ? (
          <span
            key={i}
            className={cn(
              "mx-0.5 inline-flex items-center gap-0.5 rounded-md px-1 py-px align-baseline text-[12px] font-black",
              mine
                ? "bg-white/20 text-white ring-1 ring-white/30"
                : "bg-emerald/10 text-emerald ring-1 ring-emerald/30",
            )}
            dir="rtl"
          >
            <AtSign className="h-2.5 w-2.5" aria-hidden />
            {t.text.slice(1).trim()}
          </span>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </span>
  );
}

/** نامِ کاربرانی که ری‌اکشن گذاشته‌اند — برای تولتیپ چیپ ری‌اکشن. */
function reactionNames(
  room: TripRoom,
  userIds: string[],
  myDisplayName: string,
): string {
  const names = userIds
    .slice(0, 5)
    .map((id) =>
      id === ME_ID
        ? myDisplayName
        : (room.members.find((mm) => mm.userId === id)?.name ?? "عضو"),
    );
  const rest = userIds.length - names.length;
  let out = names.join("، ");
  if (rest > 0) out += ` و ${toFa(rest)} نفر دیگر`;
  return out;
}

