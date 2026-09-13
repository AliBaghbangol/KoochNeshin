"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TripRoomView } from "@/components/views/trip-room-view";
export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
        <TripRoomView />
      </Suspense>
    </AppShell>
  );
}
