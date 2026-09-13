"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { BuddiesView } from "@/components/views/buddies-view";
export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
        <BuddiesView />
      </Suspense>
    </AppShell>
  );
}
