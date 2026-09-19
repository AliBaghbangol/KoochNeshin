"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PublicProfileView } from "@/components/views/public-profile-view";

/**
 * پروفایل عمومی مسافر — /u/[id] (ورژن ۲۴، بخش ۳ سند بررسی).
 * معادل همان چیزی که لیدرها دارند؛ از Trip Room / Travel Buddy /
 * داشبورد قابل بازشدن است. بدون اطلاعات حساس (تماس/ایمیل).
 */
export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
        <PublicProfileView />
      </Suspense>
    </AppShell>
  );
}
