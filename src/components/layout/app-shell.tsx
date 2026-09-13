"use client";

import * as React from "react";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { NotificationCenter } from "@/components/layout/notification-center";
import {
  NotificationRealtimeBridge,
} from "@/components/layout/notification-realtime";
import { WishlistDrawer } from "@/components/layout/wishlist-drawer";
import { CompareDrawer } from "@/components/tours/compare-drawer";
import { FloatingCompareButton } from "@/components/tours/floating-compare-button";
import { EquipmentCompareDrawer } from "@/components/equipment/equipment-compare-drawer";
import {
  FloatingEquipmentCompareButton,
} from "@/components/equipment/floating-equipment-compare-button";
import { AuthModal } from "@/components/auth/auth-modal";
import { SearchPalette } from "@/components/common/search-palette";
import { ScrollToTop } from "@/components/common/scroll-to-top";
import { LiveActivityToast } from "@/components/common/live-activity-toast";
import { CustomCursor } from "@/components/common/custom-cursor";
import { FloatingAlertHost } from "@/components/common/floating-alert";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { OfflineIndicator } from "@/components/common/offline-indicator";
import { PwaInstallPrompt } from "@/components/common/pwa-install-prompt";
import { AchievementToast } from "@/components/rewards/achievement-toast";
import { useWishlist } from "@/store/wishlist-store";
import { useCart } from "@/store/cart-store";
import { useCompare } from "@/store/compare-store";
import { useAuth } from "@/store/auth-store";
import { useRecent } from "@/store/recent-store";
import { useRecentSearches } from "@/store/recent-searches-store";

/**
 * Shared layout wrapper for all pages.
 * Includes Navbar, Footer, and all global drawers/modals/overlays.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [isHome, setIsHome] = React.useState(false);
  React.useEffect(() => {
    setIsHome(window.location.pathname === "/");
  }, []);

  // Restore persisted UI state AFTER React hydration. zustand/persist reads
  // localStorage synchronously at store creation, which made the first client
  // render differ from SSR for returning users (heart colours, cart badge,
  // compare states, auth button) → hydration errors. skipHydration is set on
  // those stores; rehydrating here (post-hydration) restores state safely.
  React.useEffect(() => {
    [
      useWishlist,
      useCart,
      useCompare,
      useAuth,
      useRecent,
      useRecentSearches,
    ].forEach((store) => store.persist.rehydrate());
  }, []);

  // Register the (conservative, dev-safe) service worker for offline UX.
  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support unavailable — silently ignore */
      });
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      {/* Home page has its own footer inside FinalCTA */}
      {!isHome && <Footer />}
      <CartDrawer />
      <NotificationRealtimeBridge />
      <WishlistDrawer />
      <BottomNav />
      <CompareDrawer />
      <FloatingCompareButton />
      <EquipmentCompareDrawer />
      <FloatingEquipmentCompareButton />
      <AuthModal />
      <SearchPalette />
      <ScrollToTop />
      <LiveActivityToast />
      <CustomCursor />
      <FloatingAlertHost />
      <AnnouncementBanner />
      <CookieConsent />
      <OfflineIndicator />
      <PwaInstallPrompt />
      <AchievementToast />
    </div>
  );
}
