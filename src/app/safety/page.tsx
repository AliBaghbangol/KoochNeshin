"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SafetyCenterView } from "@/components/views/safety-center-view";
export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
        <SafetyCenterView />
      </Suspense>
    </AppShell>
  );
}
