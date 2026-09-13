"use client";

import * as React from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { UserDashboardView } from "@/components/views/user-dashboard-view";
import { LeaderDashboardView } from "@/components/views/leader-dashboard-view";
import { SellerDashboardView } from "@/components/views/seller-dashboard-view";
import { AdminDashboardView } from "@/components/views/admin-dashboard-view";
import { useAuth } from "@/store/auth-store";

/**
 * Unified dashboard router — a single `/dashboard` route that renders the
 * correct view based on the authenticated user's role:
 *   - admin   → AdminDashboardView
 *   - leader  → LeaderDashboardView
 *   - seller  → SellerDashboardView
 *   - default → UserDashboardView (covers traveler + guest)
 *
 * Uses a `mounted` flag to prevent hydration mismatch: on SSR, zustand
 * persist hasn't hydrated yet so `role` is undefined (renders a loading
 * placeholder). After mount, the correct view is shown.
 */
function DashboardRouter() {
  const role = useAuth((s) => s.user?.role);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (role === "admin") return <AdminDashboardView />;
  if (role === "leader") return <LeaderDashboardView />;
  if (role === "seller") return <SellerDashboardView />;
  return <UserDashboardView />;
}

export default function Page() {
  return (
    <AppShell>
      <Suspense
        fallback={<div className="min-h-[60vh] bg-background" />}
      >
        <DashboardRouter />
      </Suspense>
    </AppShell>
  );
}
