"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SellerDashboardView } from "@/components/views/seller-dashboard-view";

export default function Page() {
  return (
    <AppShell>
      <Suspense
        fallback={<div className="min-h-[60vh] bg-background" />}
      >
        <SellerDashboardView />
      </Suspense>
    </AppShell>
  );
}
