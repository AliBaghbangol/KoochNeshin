"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AdminDashboardView } from "@/components/views/admin-dashboard-view";

export default function Page() {
  return (
    <AppShell>
      <Suspense
        fallback={<div className="min-h-[60vh] bg-background" />}
      >
        <AdminDashboardView />
      </Suspense>
    </AppShell>
  );
}
