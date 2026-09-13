"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LeaderDashboardView } from "@/components/views/leader-dashboard-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><LeaderDashboardView /></Suspense></AppShell>;
}
