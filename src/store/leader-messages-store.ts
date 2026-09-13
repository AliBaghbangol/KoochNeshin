"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Leader messages — persisted to localStorage.
 *
 * Seeded with mock conversations. `sendMessage` appends to the active
 * conversation. `markRead` clears the unread badge.
 */

export interface ChatMessage {
  from: "me" | "them";
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  last: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
}

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    name: "علی رضایی",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces&q=80",
    last: "سلام، برای تور دماوند سوال داشتم...",
    time: "۱۰:۲۴",
    unread: 2,
    messages: [
      { from: "them", text: "سلام، برای تور دماوند سوال داشتم", time: "۱۰:۲۰" },
      { from: "them", text: "آیا تجهیزات فردی لازم است یا تیمی؟", time: "۱۰:۲۴" },
      { from: "me", text: "سلام علی عزیز. کفش کوهنوردی و کاپشن ضدآب شخصی بیارید، بقیه را ما تأمین می‌کنیم.", time: "۱۰:۳۰" },
      { from: "them", text: "عالی، ممنون از راهنمایی‌تان", time: "۱۰:۳۲" },
    ],
  },
  {
    id: "c2",
    name: "سارا کریمی",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&q=80",
    last: "ممنون از لطف شما، منتظرم.",
    time: "دیروز",
    unread: 0,
    messages: [
      { from: "them", text: "ببخشید می‌شه تاریخ تور را عقب بکشید؟", time: "دیروز ۱۴:۱۰" },
      { from: "me", text: "متأسفانه ظرفیت تکمیل شده. می‌تونید تور هفته بعد را رزرو کنید.", time: "دیروز ۱۴:۲۵" },
      { from: "them", text: "ممنون از لطف شما، منتظرم.", time: "دیروز ۱۴:۳۰" },
    ],
  },
  {
    id: "c3",
    name: "حسین موسوی",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces&q=80",
    last: "تأیید کردم، ممنون.",
    time: "۲ روز پیش",
    unread: 0,
    messages: [
      { from: "me", text: "سلام حسین، رزرو شما تأیید شد. فایل بلیت را ارسال کردم.", time: "۲ روز پیش" },
      { from: "them", text: "تأیید کردم، ممنون.", time: "۲ روز پیش" },
    ],
  },
];

interface MessagesState {
  conversations: Conversation[];
  sendMessage: (conversationId: string, text: string) => void;
  markRead: (conversationId: string) => void;
  resetConversations: () => void;
  /**
   * Starts a new conversation from a traveler's perspective (the `fromUser`
   * is the traveler; the leader is the implicit recipient). If a
   * conversation between this leader and this traveler already exists
   * (matched by name+avatar), it appends to it instead of creating a
   * duplicate. Visible in the leader's "پیام‌ها" tab.
   */
  startConversation: (
    leaderId: string,
    fromUser: { name: string; avatar: string },
    text: string
  ) => void;
}

function nowTime(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export const useLeaderMessages = create<MessagesState>()(
  persist(
    (set, get) => ({
      conversations: SEED_CONVERSATIONS,
      sendMessage: (conversationId, text) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  last: text,
                  time: nowTime(),
                  messages: [
                    ...c.messages,
                    { from: "me" as const, text, time: nowTime() },
                  ],
                }
              : c
          ),
        })),
      markRead: (conversationId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, unread: 0 } : c
          ),
        })),
      resetConversations: () => set({ conversations: SEED_CONVERSATIONS }),
      startConversation: (leaderId, fromUser, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const existing = get().conversations.find(
          (c) => c.name === fromUser.name && c.avatar === fromUser.avatar
        );
        if (existing) {
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === existing.id
                ? {
                    ...c,
                    last: trimmed,
                    time: nowTime(),
                    unread: c.unread + 1,
                    messages: [
                      ...c.messages,
                      { from: "them" as const, text: trimmed, time: nowTime() },
                    ],
                  }
                : c
            ),
          }));
          return;
        }
        const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newConv: Conversation = {
          id,
          name: fromUser.name,
          avatar: fromUser.avatar,
          last: trimmed,
          time: nowTime(),
          unread: 1,
          messages: [
            { from: "them" as const, text: trimmed, time: nowTime() },
          ],
        };
        // leaderId is implicit (the leader reading their own messages tab).
        // We keep it on the conversation by tacking it onto the id prefix,
        // but the actual filter on the leader side uses the seeded list above.
        void leaderId;
        set((s) => ({ conversations: [newConv, ...s.conversations] }));
      },
    }),
    { name: "kochneshin-leader-messages" }
  ),
);
