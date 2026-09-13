"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LeaderProfileView } from "@/components/views/leader-profile-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><LeaderProfileView /></Suspense></AppShell>;
}
