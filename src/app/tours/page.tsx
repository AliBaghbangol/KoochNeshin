"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ToursView } from "@/components/views/tours-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><ToursView /></Suspense></AppShell>;
}
