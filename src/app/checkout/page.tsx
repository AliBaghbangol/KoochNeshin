"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CheckoutView } from "@/components/views/checkout-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><CheckoutView /></Suspense></AppShell>;
}
