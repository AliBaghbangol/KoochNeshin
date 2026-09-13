"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { BlogView } from "@/components/views/blog-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><BlogView /></Suspense></AppShell>;
}
