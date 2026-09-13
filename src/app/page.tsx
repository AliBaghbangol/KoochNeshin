"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { HomeView } from "@/components/home/home-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><HomeView /></Suspense></AppShell>;
}
