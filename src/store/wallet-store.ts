"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * User wallet store — persisted to localStorage.
 *
 * The wallet balance is used in checkout to validate "pay with wallet"
 * and display the current balance consistently.
 */

const DEFAULT_BALANCE = 1_500_000;

interface WalletState {
  balance: number;
  deduct: (amount: number) => void;
  topUp: (amount: number) => void;
  reset: () => void;
}

export const useWallet = create<WalletState>()(
  persist(
    (set) => ({
      balance: DEFAULT_BALANCE,
      deduct: (amount) =>
        set((s) => ({ balance: Math.max(0, s.balance - amount) })),
      topUp: (amount) => set((s) => ({ balance: s.balance + amount })),
      reset: () => set({ balance: DEFAULT_BALANCE }),
    }),
    { name: "kochneshin-wallet" }
  )
);

export { DEFAULT_BALANCE };
