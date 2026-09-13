"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProductDetailView } from "@/components/views/product-detail-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><ProductDetailView /></Suspense></AppShell>;
}
