"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { EquipmentView } from "@/components/views/equipment-view";
export default function Page() {
  return <AppShell><Suspense fallback={<div className="min-h-[60vh] bg-background" />}><EquipmentView /></Suspense></AppShell>;
}
