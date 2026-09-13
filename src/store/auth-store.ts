"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole;
  // mock verification status for leaders
  leaderVerification: "none" | "pending" | "verified" | "rejected";
  // mock verification status for sellers
  sellerVerification: "none" | "pending" | "verified" | "rejected";
  loginAsTraveler: (name: string, phone: string) => void;
  loginAsLeader: (name: string, phone: string) => void;
  loginAsSeller: (name: string, phone: string) => void;
  loginAsAdmin: (name: string, phone: string) => void;
  setLeaderVerification: (status: "pending" | "verified" | "rejected") => void;
  setSellerVerification: (status: "pending" | "verified" | "rejected") => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      role: "guest",
      leaderVerification: "none",
      sellerVerification: "none",
      loginAsTraveler: (name, phone) =>
        set({
          user: {
            id: `u_${Date.now()}`,
            fullName: name,
            role: "traveler",
            phone,
            avatar: undefined,
          },
          isAuthenticated: true,
          role: "traveler",
        }),
      loginAsLeader: (name, phone) =>
        set({
          user: {
            id: `l_${Date.now()}`,
            fullName: name,
            role: "leader",
            phone,
          },
          isAuthenticated: true,
          role: "leader",
          leaderVerification: "pending",
        }),
      loginAsSeller: (name, phone) =>
        set({
          user: {
            id: `s_${Date.now()}`,
            fullName: name,
            role: "seller",
            phone,
          },
          isAuthenticated: true,
          role: "seller",
          sellerVerification: "verified",
        }),
      loginAsAdmin: (name, phone) =>
        set({
          user: {
            id: `admin_${Date.now()}`,
            fullName: name,
            role: "admin",
            phone,
          },
          isAuthenticated: true,
          role: "admin",
        }),
      setLeaderVerification: (status) => set({ leaderVerification: status }),
      setSellerVerification: (status) => set({ sellerVerification: status }),
      updateUser: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : s.user })),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          role: "guest",
          leaderVerification: "none",
          sellerVerification: "none",
        }),
    }),
    { name: "kochneshin-auth" , skipHydration: true }
  )
);
