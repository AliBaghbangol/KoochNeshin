"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StoriesView } from "@/components/views/stories-view";
export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
        <StoriesView />
      </Suspense>
    </AppShell>
  );
}
