"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DestinationsView } from "@/components/views/destinations-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><DestinationsView /></Suspense></AppShell>;
}
