"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Heart, CornerUpRight, X, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useStoryComments, type StoryComment } from "@/store/story-comments-store";
import { useAuth } from "@/store/auth-store";
import { useMe } from "@/hooks/use-me";
import { toFa } from "@/lib/format";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

/** Convert ISO to relative Persian time string */
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

/**
 * Story Comments — Stories enhancement (spec §6).
 *
 * Renders a comment list + composer below the story detail content.
 * Comments are persisted to localStorage via story-comments-store.
 *
 * Each comment shows: avatar, name (+ «شما» badge for your own), relative
 * time, text and a like button (heart) with a persistent toggle.
 * The composer has a textarea + send button. Enter (without Shift) sends.
 *
 * Replies (v21.4): every comment has a «پاسخ» affordance. Replies are
 * grouped one level deep under their parent with an inline-start connector
 * line, and the composer shows a «در پاسخ به …» preview bar while replying.
 */

interface ReplyTarget {
  id: string;
  name: string;
}

export function StoryComments({ storyId }: { storyId: string }) {
  const comments = useStoryComments((s) => s.comments[storyId] ?? []);
  const addComment = useStoryComments((s) => s.addComment);
  const deleteComment = useStoryComments((s) => s.deleteComment);
  const restoreComment = useStoryComments((s) => s.restoreComment);
  const role = useAuth((s) => s.role);
  const canModerate = role === "leader" || role === "admin";
  const me = useMe();
  const [text, setText] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<ReplyTarget | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // auto-scroll to bottom when a new comment/reply arrives
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [comments.length]);

  const total = comments.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment(storyId, trimmed, { name: me.name, avatar: me.avatar }, replyTo ?? undefined);
    if (replyTo) track("comment_replied", { storyId, parentId: replyTo.id });
    setText("");
    setReplyTo(null);
  }

  /**
   * حذف نظر — سیاست (v21.5): نویسنده یا لیدر/ادمین. با تُستِ «بازگردانی»
   * امکان undo فوری هست (کامنت با ایندکس اصلی برمی‌گردد).
   */
  function handleDelete(comment: StoryComment) {
    const index = comments.findIndex((c) => c.id === comment.id);
    if (index === -1) return;
    deleteComment(storyId, comment.id);
    track("comment_deleted", {
      storyId,
      commentId: comment.id,
      byModerator: comment.authorId !== "me",
    });
    toast.success("نظر حذف شد", {
      action: {
        label: "بازگردانی",
        onClick: () => {
          restoreComment(storyId, comment, index);
          toast.success("نظر بازگردانی شد");
        },
      },
    });
  }

  // Group replies under their parents — one level deep. Replies whose
  // parent no longer exists render as top-level (history stays visible).
  const threaded = React.useMemo(() => {
    const byId = new Map(comments.map((c) => [c.id, c]));
    const topLevel = comments.filter(
      (c) => !c.replyToId || !byId.has(c.replyToId),
    );
    const repliesOf = new Map<string, StoryComment[]>();
    for (const c of comments) {
      if (c.replyToId && byId.has(c.replyToId)) {
        const list = repliesOf.get(c.replyToId) ?? [];
        list.push(c);
        repliesOf.set(c.replyToId, list);
      }
    }
    return { topLevel, repliesOf };
  }, [comments]);

  return (
    <div className="mt-6 rounded-3xl border bg-card p-4 shadow-sm">
      {/* header */}
      <div className="mb-3 flex items-center gap-2 border-b border-border/40 pb-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald/10 text-emerald">
          <MessageCircle className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-sm font-bold">نظرات</h3>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
          {toFa(total)}
        </span>
      </div>

      {/* comments list */}
      <div
        ref={scrollRef}
        className="mb-3 max-h-96 space-y-3 overflow-y-auto rounded-xl bg-background/30 p-2"
      >
        {total === 0 ? (
          <div className="grid place-items-center py-6 text-center text-[11px] text-muted-foreground">
            هنوز نظری ثبت نشده — اولین نفر باش!
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {threaded.topLevel.map((c) => (
              <CommentThread
                key={c.id}
                comment={c}
                replies={threaded.repliesOf.get(c.id) ?? []}
                myName={me.name}
                canModerate={canModerate}
                onReply={setReplyTo}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 rounded-xl border-r-2 border-emerald bg-emerald/5 px-3 py-1.5 text-[11px]">
              <span className="truncate text-muted-foreground">
                در پاسخ به <span className="font-bold text-foreground/80">{replyTo.name}</span>
              </span>
              <button
                type="button"
                aria-label="لغو پاسخ"
                onClick={() => setReplyTo(null)}
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* composer */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
          <AvatarImage src={me.avatar} alt={me.name} />
          <AvatarFallback>ش</AvatarFallback>
        </Avatar>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          placeholder={
            replyTo ? `پاسخ به ${replyTo.name}...` : "نظرت درباره این داستان چیست؟"
          }
          rows={1}
          className="min-h-[40px] resize-none rounded-2xl text-sm"
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark"
          disabled={!text.trim()}
          aria-label={replyTo ? "ارسال پاسخ" : "ارسال نظر"}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

/** A top-level comment plus its (one-level) replies rendered underneath. */
function CommentThread({
  comment,
  replies,
  myName,
  canModerate,
  onReply,
  onDelete,
}: {
  comment: StoryComment;
  replies: StoryComment[];
  myName: string;
  canModerate: boolean;
  onReply: (t: ReplyTarget) => void;
  onDelete: (c: StoryComment) => void;
}) {
  return (
    <div className="space-y-2.5">
      <CommentRow
        comment={comment}
        myName={myName}
        canModerate={canModerate}
        onReply={onReply}
        onDelete={onDelete}
      />
      {replies.length > 0 && (
        <div className="ms-5 space-y-2.5 border-s-2 border-emerald/20 ps-3">
          {replies.map((r) => (
            <CommentRow
              key={r.id}
              comment={r}
              myName={myName}
              canModerate={canModerate}
              onReply={onReply}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentRow({
  comment,
  myName,
  canModerate,
  onReply,
  onDelete,
  isReply = false,
}: {
  comment: StoryComment;
  myName: string;
  canModerate: boolean;
  onReply: (t: ReplyTarget) => void;
  onDelete: (c: StoryComment) => void;
  /** replies render slightly smaller and cannot be replied to (one level) */
  isReply?: boolean;
}) {
  const mine = comment.authorId === "me";
  const canDelete = mine || canModerate;
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const toggleLike = useStoryComments((s) => s.toggleLike);
  const liked = useStoryComments((s) => s.likedIds.includes(comment.id));
  const likeCount = comment.likeCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-start gap-2",
        mine ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar className={cn("shrink-0 ring-1 ring-background", isReply ? "h-6 w-6" : "h-7 w-7")}>
        <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
        <AvatarFallback className="text-[9px]">
          {comment.authorName.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex min-w-0 flex-col gap-0.5",
          isReply ? "max-w-[88%]" : "max-w-[80%]",
          mine ? "items-end" : "items-start",
        )}
      >
        <div className="flex items-center gap-1.5 px-1 text-[9px] text-muted-foreground">
          <span className="font-bold text-foreground/80">
            {mine ? myName : comment.authorName}
          </span>
          {mine && (
            <span className="rounded-full bg-primary/10 px-1.5 py-px text-[8px] font-bold text-primary">
              شما
            </span>
          )}
          <span>{timeAgoFa(comment.createdAt)}</span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 shadow-sm",
            isReply ? "text-[11px] leading-[1.4]" : "text-[12px] leading-5",
            mine
              ? "rounded-bl-sm bg-gradient-to-br from-emerald to-emerald-dark text-white"
              : "rounded-br-sm border bg-card",
          )}
        >
          {comment.replyToName && (
            <span
              className={cn(
                "mb-1 flex items-center gap-1 text-[9px] font-bold",
                mine ? "text-white/75" : "text-emerald",
              )}
            >
              <CornerUpRight className="h-2.5 w-2.5" />
              پاسخ به {comment.replyToName}
            </span>
          )}
          <span className="break-words">{comment.text}</span>
        </div>
        {/* action row: like + reply */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              toggleLike(comment.id);
              if (!liked) track("comment_liked", { commentId: comment.id });
            }}
            aria-pressed={liked}
            aria-label={liked ? "برداشتن لایک" : "لایک کردن نظر"}
            className={cn(
              "relative mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition-all",
              liked
                ? "bg-sunset/10 text-sunset"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <motion.span
              key={liked ? "liked" : "unliked"}
              initial={liked ? { scale: 0.4 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="grid place-items-center"
            >
              <Heart
                className={cn(
                  "h-3 w-3 transition-colors",
                  liked && "fill-sunset text-sunset",
                )}
              />
            </motion.span>
            {likeCount > 0 && <span className="tabular-nums">{toFa(likeCount)}</span>}
          </button>
          {!isReply && (
            <button
              type="button"
              onClick={() => onReply({ id: comment.id, name: mine ? myName : comment.authorName })}
              aria-label={`پاسخ به ${mine ? "نظر خودت" : comment.authorName}`}
              className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <CornerUpRight className="h-3 w-3" />
              پاسخ
            </button>
          )}
          {canDelete && (
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  aria-label={mine ? "حذف نظر خودم" : `حذف نظر ${comment.authorName}`}
                  title={mine ? "حذف نظر" : "حذف (مدیریت)"}
                  className="mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
                <AlertDialogHeader className="text-right sm:text-right">
                  <AlertDialogTitle>حذف نظر؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    {mine
                      ? "نظر تو برای همه حذف می‌شود. تا لحظه‌ای بعد از حذف می‌توانی آن را بازگردانی."
                      : `این نظر از ${comment.authorName} حذف می‌شود (اقدام مدیریت). تا لحظه‌ای بعد از حذف می‌توانی آن را بازگردانی.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse justify-start gap-2 sm:flex-row-reverse sm:justify-start">
                  <AlertDialogAction
                    onClick={() => onDelete(comment)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    حذف کن
                  </AlertDialogAction>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </motion.div>
  );
}
