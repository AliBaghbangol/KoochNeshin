"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CategoryView } from "@/components/views/category-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><CategoryView /></Suspense></AppShell>;
}
