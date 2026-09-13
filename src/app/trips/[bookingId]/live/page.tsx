"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LiveTripView } from "@/components/views/live-trip-view";
export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
        <LiveTripView />
      </Suspense>
    </AppShell>
  );
}
