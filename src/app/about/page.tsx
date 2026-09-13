"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AboutView } from "@/components/views/about-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><AboutView /></Suspense></AppShell>;
}
