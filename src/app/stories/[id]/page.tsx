"use client";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StoryDetailView } from "@/components/views/story-detail-view";
export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="min-h-[60vh] bg-background" />}>
        <StoryDetailView />
      </Suspense>
    </AppShell>
  );
}
