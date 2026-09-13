"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QAItem {
  id: string;
  productId: string;
  question: string;
  questionAuthor: string;
  questionDate: string; // ISO
  answer?: string;
  answerAuthor?: string;
  answerDate?: string;
  helpful: number; // count of "helpful" votes
}

interface QAState {
  items: QAItem[];
  addQuestion: (q: Omit<QAItem, "id" | "questionDate" | "helpful">) => void;
  addAnswer: (id: string, answer: string, author: string) => void;
  getForProduct: (productId: string) => QAItem[];
  markHelpful: (id: string) => void;
  count: () => number;
}

function genId() {
  return `qa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Seed Q&A data
const SEED_QA: QAItem[] = [
  {
    id: "qa_seed_1",
    productId: "e1",
    question: "آیا این چادر در باران شدید مقاوم است؟",
    questionAuthor: "مهدی ر.",
    questionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    answer:
      "بله، این چادر با مقاومت آب ۳۰۰۰ میلی‌متر برای باران‌های شدید مناسب است. اما برای طوفان توصیه می‌شود از چادر حرفه‌ایتر استفاده کنید.",
    answerAuthor: "تیم پشتیبانی کوچ‌نشین",
    answerDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    helpful: 8,
  },
  {
    id: "qa_seed_2",
    productId: "e1",
    question: "وزن واقعی چادر چقدر است؟ با کیسه حمل",
    questionAuthor: "سارا ک.",
    questionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    answer:
      "وزن چادر با کیسه حمل و تمام اکسسوری‌ها ۲.۹ کیلوگرم است. کیسه حمل دارای بند کوله برای حمل راحت است.",
    answerAuthor: "تیم پشتیبانی کوچ‌نشین",
    answerDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    helpful: 12,
  },
  {
    id: "qa_seed_3",
    productId: "e4",
    question: "سایزهای موجود چیست؟",
    questionAuthor: "علی م.",
    questionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    answer:
      "سایزهای ۳۸ تا ۴۶ موجود است. برای انتخاب سایز مناسب، جدول سایز را در بخش مشخصات ببینید.",
    answerAuthor: "تیم پشتیبانی کوچ‌نشین",
    answerDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    helpful: 5,
  },
];

export const useQA = create<QAState>()(
  persist(
    (set, get) => ({
      items: SEED_QA,
      addQuestion: (q) =>
        set((s) => ({
          items: [
            { ...q, id: genId(), questionDate: new Date().toISOString(), helpful: 0 },
            ...s.items,
          ],
        })),
      addAnswer: (id, answer, author) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  answer,
                  answerAuthor: author,
                  answerDate: new Date().toISOString(),
                }
              : item
          ),
        })),
      getForProduct: (productId) =>
        get().items.filter((item) => item.productId === productId),
      markHelpful: (id) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id ? { ...item, helpful: item.helpful + 1 } : item
          ),
        })),
      count: () => get().items.length,
    }),
    {
      name: "kochneshin-qa",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
