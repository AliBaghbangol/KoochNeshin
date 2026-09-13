"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TourDetailView } from "@/components/views/tour-detail-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><TourDetailView /></Suspense></AppShell>;
}
