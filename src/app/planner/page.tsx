"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PlannerView } from "@/components/planner/planner-view";

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
        <PlannerView />
      </Suspense>
    </AppShell>
  );
}
