"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { BlogDetailView } from "@/components/views/blog-detail-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><BlogDetailView /></Suspense></AppShell>;
}
