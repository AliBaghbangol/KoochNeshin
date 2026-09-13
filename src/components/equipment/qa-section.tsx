"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  ThumbsUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PenLine,
} from "lucide-react";
import { useQA } from "@/store/qa-store";
import { useAuth } from "@/store/auth-store";
import { useNav } from "@/store/nav-store";
import { toFa, timeAgo } from "@/lib/format";
import {
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/animations/scroll-reveal";
import { toast } from "sonner";

interface QASectionProps {
  productId: string;
  productTitle: string;
}

export function QASection({ productId, productTitle: _productTitle }: QASectionProps) {
  const { user, isAuthenticated } = useAuth();
  const setAuthOpen = useNav((s) => s.setAuthOpen);
  const items = useQA((s) => s.items);
  const addQuestion = useQA((s) => s.addQuestion);
  const markHelpful = useQA((s) => s.markHelpful);
  const [question, setQuestion] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const productQA = React.useMemo(
    () => items.filter((item) => item.productId === productId),
    [items, productId]
  );

  const handleSubmit = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    if (question.trim().length < 10) {
      toast.error("سوال شما باید حداقل ۱۰ کاراکتر باشد");
      return;
    }
    addQuestion({
      productId,
      question: question.trim(),
      questionAuthor: user?.fullName ?? "مسافر کوچ‌نشین",
    });
    toast.success("سوال شما ثبت شد!", {
      description: "پاسخ به‌زودی توسط تیم پشتیبانی ارسال می‌شود.",
    });
    setQuestion("");
  };

  const answered = productQA.filter((q) => q.answer);
  const pending = productQA.filter((q) => !q.answer);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-sunset" />
          <h3 className="text-xl font-bold">پرسش و پاسخ</h3>
          {productQA.length > 0 && (
            <span className="rounded-full bg-sunset/10 px-2 py-0.5 text-xs font-bold text-sunset">
              {toFa(productQA.length)} سوال
            </span>
          )}
        </div>
      </div>

      {/* Ask question form */}
      <ScrollReveal>
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold">سوالت را بپرس</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="مثلاً: آیا این محصول برای استفاده در زمستان مناسب است؟"
              rows={2}
              className="flex-1 resize-none rounded-xl border bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleSubmit}
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-emerald-dark max-sm:w-full"
            >
              <Send className="h-4 w-4" />
              ارسال
            </button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {isAuthenticated
              ? `به‌عنوان ${user?.fullName} ارسال می‌شود`
              : "برای ارسال سوال باید وارد شوید"}
          </p>
        </div>
      </ScrollReveal>

      {/* Answered questions */}
      {answered.length > 0 && (
        <StaggerGroup className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald">
            پاسخ داده‌شده ({toFa(answered.length)})
          </p>
          {answered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <motion.div
                key={item.id}
                variants={staggerItem}
                className="overflow-hidden rounded-2xl border bg-card"
              >
                {/* Question */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex w-full items-start gap-3 p-4 text-right transition hover:bg-secondary/30"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sunset/10 text-sunset">
                    <span className="text-xs font-bold">؟</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold leading-6">{item.question}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {item.questionAuthor} • {timeAgo(item.questionDate)}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {isExpanded && item.answer && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden border-t bg-emerald/5"
                    >
                      <div className="flex gap-3 p-4">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald/10 text-emerald">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm leading-7 text-foreground/80">
                            {item.answer}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground">
                              {item.answerAuthor} •{" "}
                              {item.answerDate && timeAgo(item.answerDate)}
                            </p>
                            <button
                              onClick={() => {
                                markHelpful(item.id);
                                toast.success("مفید بود");
                              }}
                              className="relative flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-bold text-emerald transition hover:bg-emerald/20 max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                            >
                              <ThumbsUp className="h-3 w-3" />
                              مفید ({toFa(item.helpful)})
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </StaggerGroup>
      )}

      {/* Pending questions */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            در انتظار پاسخ ({toFa(pending.length)})
          </p>
          {pending.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-dashed bg-secondary/30 p-3"
            >
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <span className="text-xs font-bold">؟</span>
              </div>
              <p className="flex-1 text-xs">{item.question}</p>
              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">
                در انتظار
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {productQA.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">سوالی پرسیده نشده</p>
            <p className="mt-1 text-sm text-muted-foreground">
              اولین نفری باش که سوال می‌پرسد!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
